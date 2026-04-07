-- ============================================================
-- Visitor Intelligence System — Multi-Tenant Schema
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- SITES (multi-tenant root)
-- ============================================================
CREATE TABLE sites (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  domain        TEXT NOT NULL,
  api_key       TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  ipinfo_token  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sites_api_key ON sites(api_key);
CREATE INDEX idx_sites_domain ON sites(domain);

-- ============================================================
-- COMPANIES (enriched from IPinfo.io)
-- ============================================================
CREATE TABLE companies (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id       UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  clean_name    TEXT,
  domain        TEXT,
  city          TEXT,
  region        TEXT,
  country       TEXT,
  is_isp        BOOLEAN NOT NULL DEFAULT FALSE,
  lead_score    INTEGER NOT NULL DEFAULT 0,
  notes         TEXT,
  first_seen    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_companies_site ON companies(site_id);
CREATE INDEX idx_companies_clean_name ON companies(site_id, clean_name);
CREATE INDEX idx_companies_last_seen ON companies(site_id, last_seen DESC);
CREATE INDEX idx_companies_lead_score ON companies(site_id, lead_score DESC);

-- ============================================================
-- VISITORS (one per unique IP per site)
-- ============================================================
CREATE TABLE visitors (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id         UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  ip_address      INET NOT NULL,
  company_id      UUID REFERENCES companies(id) ON DELETE SET NULL,
  fingerprint     TEXT,
  ip_enriched     BOOLEAN NOT NULL DEFAULT FALSE,
  enrichment      JSONB,
  first_seen      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_sessions  INTEGER NOT NULL DEFAULT 0,
  total_pageviews INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(site_id, ip_address)
);

CREATE INDEX idx_visitors_site ON visitors(site_id);
CREATE INDEX idx_visitors_ip ON visitors(site_id, ip_address);
CREATE INDEX idx_visitors_company ON visitors(company_id);
CREATE INDEX idx_visitors_last_seen ON visitors(site_id, last_seen DESC);

-- ============================================================
-- SESSIONS
-- ============================================================
CREATE TABLE sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id         UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  visitor_id      UUID NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
  session_key     TEXT NOT NULL UNIQUE,
  entry_page      TEXT,
  exit_page       TEXT,
  referrer        TEXT,
  utm_source      TEXT,
  utm_medium      TEXT,
  utm_campaign    TEXT,
  utm_term        TEXT,
  utm_content     TEXT,
  device_type     TEXT,
  browser         TEXT,
  os              TEXT,
  screen_width    INTEGER,
  screen_height   INTEGER,
  page_count      INTEGER NOT NULL DEFAULT 0,
  duration_secs   INTEGER NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_site ON sessions(site_id);
CREATE INDEX idx_sessions_visitor ON sessions(visitor_id);
CREATE INDEX idx_sessions_active ON sessions(site_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_sessions_started ON sessions(site_id, started_at DESC);

-- ============================================================
-- PAGE VIEWS
-- ============================================================
CREATE TABLE page_views (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id       UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  session_id    UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  visitor_id    UUID NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
  url           TEXT NOT NULL,
  path          TEXT NOT NULL,
  title         TEXT,
  referrer      TEXT,
  time_on_page  INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pageviews_site ON page_views(site_id);
CREATE INDEX idx_pageviews_session ON page_views(session_id);
CREATE INDEX idx_pageviews_visitor ON page_views(visitor_id);
CREATE INDEX idx_pageviews_path ON page_views(site_id, path);
CREATE INDEX idx_pageviews_created ON page_views(site_id, created_at DESC);

-- ============================================================
-- COMPANY ACTIVITY VIEW (dashboard queries)
-- ============================================================
CREATE OR REPLACE VIEW company_activity WITH (security_invoker = true) AS
SELECT
  c.id            AS company_id,
  c.site_id,
  c.clean_name,
  c.name          AS raw_name,
  c.city,
  c.country,
  c.is_isp,
  c.lead_score,
  c.notes,
  COUNT(DISTINCT v.id)  AS unique_visitors,
  COUNT(DISTINCT s.id)  AS total_sessions,
  COUNT(pv.id)          AS total_pageviews,
  MAX(s.last_activity)  AS last_visit,
  MIN(v.first_seen)     AS first_visit,
  ARRAY_AGG(DISTINCT pv.path) FILTER (WHERE pv.path IS NOT NULL) AS pages_visited
FROM companies c
LEFT JOIN visitors v  ON v.company_id = c.id
LEFT JOIN sessions s  ON s.visitor_id = v.id
LEFT JOIN page_views pv ON pv.session_id = s.id
GROUP BY c.id, c.site_id, c.clean_name, c.name, c.city, c.country, c.is_isp, c.lead_score, c.notes;

-- ============================================================
-- FUNCTION: Mark stale sessions as inactive
-- ============================================================
CREATE OR REPLACE FUNCTION mark_stale_sessions()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE sessions
  SET is_active = FALSE
  WHERE is_active = TRUE
    AND last_activity < NOW() - INTERVAL '5 minutes';
END;
$$;

-- ============================================================
-- FUNCTION: Recalculate lead scores
-- ============================================================
CREATE OR REPLACE FUNCTION recalculate_lead_scores()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  rec RECORD;
  score INTEGER;
  recency_mult NUMERIC;
  last_activity TIMESTAMPTZ;
BEGIN
  FOR rec IN
    SELECT
      c.id AS company_id,
      COUNT(DISTINCT s.id) FILTER (WHERE s.started_at > NOW() - INTERVAL '7 days') AS recent_sessions,
      COUNT(pv.id) FILTER (WHERE pv.created_at > NOW() - INTERVAL '7 days') AS recent_pageviews,
      BOOL_OR(pv.path = '/book.html') FILTER (WHERE pv.created_at > NOW() - INTERVAL '30 days') AS visited_book,
      BOOL_OR(pv.path LIKE '/services/%') FILTER (WHERE pv.created_at > NOW() - INTERVAL '30 days') AS visited_services,
      c.is_isp,
      MAX(s.last_activity) AS last_activity
    FROM companies c
    LEFT JOIN visitors v ON v.company_id = c.id
    LEFT JOIN sessions s ON s.visitor_id = v.id
    LEFT JOIN page_views pv ON pv.session_id = s.id
    GROUP BY c.id
  LOOP
    score := 0;
    score := score + COALESCE(rec.recent_sessions, 0) * 10;
    score := score + COALESCE(rec.recent_pageviews, 0) * 5;
    IF rec.visited_book THEN score := score + 20; END IF;
    IF rec.visited_services THEN score := score + 15; END IF;
    IF rec.is_isp THEN score := score - 30; END IF;

    last_activity := rec.last_activity;
    IF last_activity IS NULL THEN
      recency_mult := 0.1;
    ELSIF last_activity > NOW() - INTERVAL '1 day' THEN
      recency_mult := 1.0;
    ELSIF last_activity > NOW() - INTERVAL '7 days' THEN
      recency_mult := 0.8;
    ELSIF last_activity > NOW() - INTERVAL '30 days' THEN
      recency_mult := 0.5;
    ELSE
      recency_mult := 0.2;
    END IF;

    score := GREATEST(0, ROUND(score * recency_mult));

    UPDATE companies SET lead_score = score WHERE id = rec.company_id;
  END LOOP;
END;
$$;

-- ============================================================
-- FUNCTION: Purge data older than 12 months
-- ============================================================
CREATE OR REPLACE FUNCTION purge_old_data()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM page_views WHERE created_at < NOW() - INTERVAL '12 months';
  DELETE FROM sessions WHERE created_at < NOW() - INTERVAL '12 months';
  DELETE FROM visitors WHERE last_seen < NOW() - INTERVAL '12 months';
  DELETE FROM companies WHERE last_seen < NOW() - INTERVAL '12 months';
END;
$$;

-- ============================================================
-- HELPER RPC FUNCTIONS (used by Edge Functions for atomic increments)
-- ============================================================
CREATE OR REPLACE FUNCTION increment_visitor_sessions(vid UUID)
RETURNS void LANGUAGE sql AS $$
  UPDATE visitors SET total_sessions = total_sessions + 1 WHERE id = vid;
$$;

CREATE OR REPLACE FUNCTION increment_visitor_pageviews(vid UUID)
RETURNS void LANGUAGE sql AS $$
  UPDATE visitors SET total_pageviews = total_pageviews + 1 WHERE id = vid;
$$;

CREATE OR REPLACE FUNCTION increment_session_pages(skey TEXT)
RETURNS void LANGUAGE sql AS $$
  UPDATE sessions SET page_count = page_count + 1 WHERE session_key = skey;
$$;

-- Add unique constraint on companies(site_id, name) for upsert
CREATE UNIQUE INDEX idx_companies_site_name ON companies(site_id, name);

-- ============================================================
-- RLS POLICIES
-- ============================================================
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- Anon can insert tracking data (via Edge Function, but belt-and-braces)
CREATE POLICY "anon_insert_visitors" ON visitors FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_insert_sessions" ON sessions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_insert_pageviews" ON page_views FOR INSERT TO anon WITH CHECK (true);

-- Service role has full access (used by Edge Functions)
CREATE POLICY "service_all_sites" ON sites FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_all_companies" ON companies FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_all_visitors" ON visitors FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_all_sessions" ON sessions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_all_pageviews" ON page_views FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- SCHEDULED JOBS (run after enabling pg_cron extension)
-- Uncomment these after enabling pg_cron in Supabase dashboard:
-- ============================================================
-- SELECT cron.schedule('mark-stale-sessions', '*/2 * * * *', 'SELECT mark_stale_sessions()');
-- SELECT cron.schedule('recalculate-lead-scores', '0 * * * *', 'SELECT recalculate_lead_scores()');
-- SELECT cron.schedule('purge-old-data', '0 3 * * *', 'SELECT purge_old_data()');
