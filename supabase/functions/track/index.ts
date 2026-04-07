import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Allowed origins per site — fetched once and cached
const siteCache = new Map<string, { id: string; domain: string; ipinfo_token: string | null }>();

interface TrackEvent {
  type: "pageview" | "heartbeat";
  api_key: string;
  session_key: string;
  fingerprint?: string;
  url: string;
  path: string;
  title?: string;
  referrer?: string;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
  device?: {
    type?: string;
    browser?: string;
    os?: string;
    sw?: number;
    sh?: number;
  };
  duration?: number;
  is_new_session?: boolean;
}

function corsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

async function resolveSite(apiKey: string) {
  if (siteCache.has(apiKey)) return siteCache.get(apiKey)!;

  const { data } = await supabase
    .from("sites")
    .select("id, domain, ipinfo_token")
    .eq("api_key", apiKey)
    .single();

  if (!data) return null;

  const site = { id: data.id, domain: data.domain, ipinfo_token: data.ipinfo_token };
  siteCache.set(apiKey, site);
  return site;
}

function extractIP(req: Request): string {
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "0.0.0.0"
  );
}

function cleanCompanyName(org: string): string {
  // IPinfo org field looks like "AS1234 Acme Corp" — strip ASN prefix
  return org.replace(/^AS\d+\s+/, "").trim();
}

function isISP(org: string, blocklist: string[]): boolean {
  const lower = org.toLowerCase();
  return blocklist.some((pattern) => lower.includes(pattern.toLowerCase()));
}

async function enrichIP(
  ip: string,
  siteId: string,
  visitorId: string,
  ipinfoToken: string | null
): Promise<void> {
  if (!ipinfoToken) return;

  try {
    const res = await fetch(`https://ipinfo.io/${ip}?token=${ipinfoToken}`);
    if (!res.ok) return;

    const data = await res.json();
    if (!data.org) return;

    // Fetch ISP blocklist
    const { data: blocklist } = await supabase
      .from("isp_blocklist")
      .select("org_pattern");

    const patterns = (blocklist || []).map((b: { org_pattern: string }) => b.org_pattern);
    const cleanName = cleanCompanyName(data.org);
    const isp = isISP(data.org, patterns);

    // Upsert company
    const { data: company } = await supabase
      .from("companies")
      .upsert(
        {
          site_id: siteId,
          name: data.org,
          clean_name: cleanName,
          city: data.city || null,
          region: data.region || null,
          country: data.country || null,
          is_isp: isp,
          last_seen: new Date().toISOString(),
        },
        { onConflict: "site_id,name", ignoreDuplicates: false }
      )
      .select("id")
      .single();

    if (company) {
      // Link visitor to company
      await supabase
        .from("visitors")
        .update({
          company_id: company.id,
          ip_enriched: true,
          enrichment: data,
        })
        .eq("id", visitorId);
    }
  } catch {
    // Enrichment is best-effort — don't fail the request
  }
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders("*") });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    // Handle both application/json and text/plain (from sendBeacon)
    const contentType = req.headers.get("content-type") || "";
    let event: TrackEvent;
    if (contentType.includes("application/json")) {
      event = await req.json();
    } else {
      const text = await req.text();
      event = JSON.parse(text);
    }

    // Validate required fields
    if (!event.api_key || !event.session_key || !event.path) {
      return new Response("Bad request", { status: 400 });
    }

    // Resolve site from API key
    const site = await resolveSite(event.api_key);
    if (!site) {
      return new Response("Invalid API key", { status: 403 });
    }

    const headers = corsHeaders(`https://${site.domain}`);
    const ip = extractIP(req);
    const now = new Date().toISOString();

    // Upsert visitor
    const { data: visitor } = await supabase
      .from("visitors")
      .upsert(
        {
          site_id: site.id,
          ip_address: ip,
          fingerprint: event.fingerprint || null,
          last_seen: now,
        },
        { onConflict: "site_id,ip_address", ignoreDuplicates: false }
      )
      .select("id, ip_enriched")
      .single();

    if (!visitor) {
      return new Response(null, { status: 204, headers });
    }

    if (event.type === "pageview") {
      if (event.is_new_session) {
        // Insert new session
        await supabase.from("sessions").insert({
          site_id: site.id,
          visitor_id: visitor.id,
          session_key: event.session_key,
          entry_page: event.path,
          exit_page: event.path,
          referrer: event.referrer || null,
          utm_source: event.utm?.source || null,
          utm_medium: event.utm?.medium || null,
          utm_campaign: event.utm?.campaign || null,
          utm_term: event.utm?.term || null,
          utm_content: event.utm?.content || null,
          device_type: event.device?.type || null,
          browser: event.device?.browser || null,
          os: event.device?.os || null,
          screen_width: event.device?.sw || null,
          screen_height: event.device?.sh || null,
          page_count: 1,
          is_active: true,
          started_at: now,
          last_activity: now,
        });

        // Increment visitor session count
        await supabase.rpc("increment_visitor_sessions", { vid: visitor.id });
      } else {
        // Update existing session
        await supabase
          .from("sessions")
          .update({
            exit_page: event.path,
            page_count: supabase.rpc ? undefined : undefined, // handled below
            last_activity: now,
            is_active: true,
          })
          .eq("session_key", event.session_key);

        // Increment page count via raw SQL
        await supabase.rpc("increment_session_pages", { skey: event.session_key });
      }

      // Insert page view
      await supabase.from("page_views").insert({
        site_id: site.id,
        session_id: (
          await supabase
            .from("sessions")
            .select("id")
            .eq("session_key", event.session_key)
            .single()
        ).data?.id,
        visitor_id: visitor.id,
        url: event.url,
        path: event.path,
        title: event.title || null,
        referrer: event.referrer || null,
      });

      // Increment visitor pageview count
      await supabase.rpc("increment_visitor_pageviews", { vid: visitor.id });

    } else if (event.type === "heartbeat") {
      // Update time on most recent page view for this session
      const { data: lastPv } = await supabase
        .from("page_views")
        .select("id")
        .eq("visitor_id", visitor.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (lastPv && event.duration) {
        await supabase
          .from("page_views")
          .update({ time_on_page: event.duration })
          .eq("id", lastPv.id);
      }

      // Update session duration and activity
      await supabase
        .from("sessions")
        .update({
          duration_secs: event.duration || 0,
          last_activity: now,
          is_active: true,
        })
        .eq("session_key", event.session_key);
    }

    // Enrich IP in background if not already done
    if (!visitor.ip_enriched) {
      // Fire and forget — don't block the response
      enrichIP(ip, site.id, visitor.id, site.ipinfo_token);
    }

    return new Response(null, { status: 204, headers });
  } catch {
    return new Response("Internal error", { status: 500 });
  }
});
