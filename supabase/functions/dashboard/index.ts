import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const DASHBOARD_TOKEN = Deno.env.get("DASHBOARD_TOKEN")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
  "Content-Type": "application/json",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS_HEADERS });
}

function authenticate(req: Request): boolean {
  const auth = req.headers.get("Authorization");
  return auth === `Bearer ${DASHBOARD_TOKEN}`;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (!authenticate(req)) {
    return json({ error: "Unauthorized" }, 401);
  }

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/dashboard\/?/, "/").replace(/\/+$/, "") || "/";
  const params = url.searchParams;

  // Site ID — required for all queries
  const siteId = params.get("site_id");
  if (!siteId) {
    return json({ error: "site_id required" }, 400);
  }

  // ── GET /companies ──
  if (req.method === "GET" && path === "/companies") {
    const days = parseInt(params.get("days") || "30");
    const search = params.get("search") || "";
    const minScore = parseInt(params.get("min_score") || "0");
    const hideIsp = params.get("hide_isp") !== "false";
    const page = parseInt(params.get("page") || "1");
    const perPage = parseInt(params.get("per_page") || "50");
    const offset = (page - 1) * perPage;

    let query = supabase
      .from("company_activity")
      .select("*")
      .eq("site_id", siteId)
      .gte("last_visit", new Date(Date.now() - days * 86400000).toISOString())
      .gte("lead_score", minScore)
      .order("lead_score", { ascending: false })
      .range(offset, offset + perPage - 1);

    if (hideIsp) {
      query = query.eq("is_isp", false);
    }

    if (search) {
      query = query.ilike("clean_name", `%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) return json({ error: error.message }, 500);
    return json({ companies: data || [], total: count, page, per_page: perPage });
  }

  // ── GET /companies/:id/timeline ──
  if (req.method === "GET" && path.match(/^\/companies\/[\w-]+\/timeline$/)) {
    const companyId = path.split("/")[2];

    // Company info
    const { data: company } = await supabase
      .from("companies")
      .select("*")
      .eq("id", companyId)
      .eq("site_id", siteId)
      .single();

    if (!company) return json({ error: "Company not found" }, 404);

    // All sessions for this company's visitors
    const { data: visitors } = await supabase
      .from("visitors")
      .select("id")
      .eq("company_id", companyId);

    const visitorIds = (visitors || []).map((v: { id: string }) => v.id);

    const { data: sessions } = await supabase
      .from("sessions")
      .select("*")
      .in("visitor_id", visitorIds)
      .order("started_at", { ascending: false })
      .limit(100);

    // Page views for those sessions
    const sessionIds = (sessions || []).map((s: { id: string }) => s.id);
    const { data: pageViews } = await supabase
      .from("page_views")
      .select("*")
      .in("session_id", sessionIds)
      .order("created_at", { ascending: true });

    // Group page views by session
    const pvBySession = new Map<string, typeof pageViews>();
    for (const pv of pageViews || []) {
      const existing = pvBySession.get(pv.session_id) || [];
      existing.push(pv);
      pvBySession.set(pv.session_id, existing);
    }

    const timeline = (sessions || []).map((s: Record<string, unknown>) => ({
      ...s,
      pages: pvBySession.get(s.id as string) || [],
    }));

    return json({ company, timeline });
  }

  // ── POST /companies/:id/notes ──
  if (req.method === "POST" && path.match(/^\/companies\/[\w-]+\/notes$/)) {
    const companyId = path.split("/")[2];
    const body = await req.json();

    const { error } = await supabase
      .from("companies")
      .update({ notes: body.notes })
      .eq("id", companyId)
      .eq("site_id", siteId);

    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  }

  // ── GET /live ──
  if (req.method === "GET" && path === "/live") {
    const { data: sessions } = await supabase
      .from("sessions")
      .select(`
        id, session_key, entry_page, exit_page, device_type, browser, os,
        page_count, duration_secs, started_at, last_activity,
        visitor_id
      `)
      .eq("site_id", siteId)
      .eq("is_active", true)
      .order("last_activity", { ascending: false });

    // Enrich with company info
    const visitorIds = [...new Set((sessions || []).map((s: { visitor_id: string }) => s.visitor_id))];
    const { data: visitors } = await supabase
      .from("visitors")
      .select("id, ip_address, company_id")
      .in("id", visitorIds);

    const companyIds = [...new Set(
      (visitors || [])
        .map((v: { company_id: string | null }) => v.company_id)
        .filter(Boolean)
    )];

    const { data: companies } = companyIds.length
      ? await supabase.from("companies").select("id, clean_name, city, country, is_isp").in("id", companyIds)
      : { data: [] };

    const visitorMap = new Map((visitors || []).map((v: Record<string, unknown>) => [v.id, v]));
    const companyMap = new Map((companies || []).map((c: Record<string, unknown>) => [c.id, c]));

    const enriched = (sessions || []).map((s: Record<string, unknown>) => {
      const visitor = visitorMap.get(s.visitor_id) as Record<string, unknown> | undefined;
      const company = visitor?.company_id ? companyMap.get(visitor.company_id) as Record<string, unknown> | undefined : null;
      return {
        ...s,
        ip: visitor?.ip_address || null,
        company: company ? { name: company.clean_name, city: company.city, country: company.country, is_isp: company.is_isp } : null,
      };
    });

    return json({ live: enriched });
  }

  // ── GET /analytics ──
  if (req.method === "GET" && path === "/analytics") {
    const days = parseInt(params.get("days") || "30");
    const since = new Date(Date.now() - days * 86400000).toISOString();

    // Top pages
    const { data: topPages } = await supabase
      .from("page_views")
      .select("path")
      .eq("site_id", siteId)
      .gte("created_at", since);

    const pageCounts: Record<string, number> = {};
    for (const pv of topPages || []) {
      pageCounts[pv.path] = (pageCounts[pv.path] || 0) + 1;
    }
    const topPagesRanked = Object.entries(pageCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([path, count]) => ({ path, count }));

    // Traffic sources
    const { data: referrers } = await supabase
      .from("sessions")
      .select("referrer")
      .eq("site_id", siteId)
      .gte("started_at", since)
      .not("referrer", "is", null);

    const sourceCounts: Record<string, number> = {};
    for (const s of referrers || []) {
      try {
        const host = new URL(s.referrer).hostname.replace(/^www\./, "");
        sourceCounts[host] = (sourceCounts[host] || 0) + 1;
      } catch {
        sourceCounts["(direct)"] = (sourceCounts["(direct)"] || 0) + 1;
      }
    }
    const topSources = Object.entries(sourceCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([source, count]) => ({ source, count }));

    // Visits per day
    const { data: dailySessions } = await supabase
      .from("sessions")
      .select("started_at")
      .eq("site_id", siteId)
      .gte("started_at", since);

    const dailyCounts: Record<string, number> = {};
    for (const s of dailySessions || []) {
      const day = s.started_at.substring(0, 10);
      dailyCounts[day] = (dailyCounts[day] || 0) + 1;
    }
    const visitsPerDay = Object.entries(dailyCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    // Device breakdown
    const { data: devices } = await supabase
      .from("sessions")
      .select("device_type")
      .eq("site_id", siteId)
      .gte("started_at", since);

    const deviceCounts: Record<string, number> = {};
    for (const s of devices || []) {
      const dt = s.device_type || "unknown";
      deviceCounts[dt] = (deviceCounts[dt] || 0) + 1;
    }

    return json({
      top_pages: topPagesRanked,
      top_sources: topSources,
      visits_per_day: visitsPerDay,
      devices: deviceCounts,
    });
  }

  // ── GET /export ──
  if (req.method === "GET" && path === "/export") {
    const days = parseInt(params.get("days") || "90");

    const { data } = await supabase
      .from("company_activity")
      .select("*")
      .eq("site_id", siteId)
      .gte("last_visit", new Date(Date.now() - days * 86400000).toISOString())
      .eq("is_isp", false)
      .order("lead_score", { ascending: false });

    // Build CSV
    const headers = ["Company", "City", "Country", "Visitors", "Sessions", "Pageviews", "Last Visit", "Lead Score"];
    const rows = (data || []).map((c: Record<string, unknown>) =>
      [c.clean_name, c.city, c.country, c.unique_visitors, c.total_sessions, c.total_pageviews, c.last_visit, c.lead_score]
        .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");

    return new Response(csv, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="visitor-intelligence-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  return json({ error: "Not found" }, 404);
});
