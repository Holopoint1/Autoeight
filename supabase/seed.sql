-- ============================================================
-- Seed: Autoeight as first site + ISP blocklist
-- ============================================================

-- Insert Autoeight site (api_key auto-generated, update after creation)
INSERT INTO sites (name, domain) VALUES ('Autoeight', 'autoeight.ai');

-- ============================================================
-- Known UK residential ISPs (org names from IPinfo.io)
-- Used to auto-flag is_isp on company records
-- ============================================================
CREATE TABLE IF NOT EXISTS isp_blocklist (
  org_pattern TEXT PRIMARY KEY
);

INSERT INTO isp_blocklist (org_pattern) VALUES
  ('BT'),
  ('British Telecom'),
  ('Virgin Media'),
  ('Sky Broadband'),
  ('Sky UK'),
  ('TalkTalk'),
  ('Plusnet'),
  ('EE'),
  ('Vodafone'),
  ('Three'),
  ('O2'),
  ('Hyperoptic'),
  ('Zen Internet'),
  ('KCOM'),
  ('Gigaclear'),
  ('Community Fibre'),
  ('Colt Technology'),
  ('Andrews & Arnold'),
  ('Cloudflare'),
  ('Google LLC'),
  ('Amazon.com'),
  ('Microsoft Corporation'),
  ('Akamai Technologies'),
  ('DigitalOcean'),
  ('OVH'),
  ('Hetzner'),
  ('Linode')
ON CONFLICT DO NOTHING;
