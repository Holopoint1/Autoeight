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
  return org.replace(/^AS\d+\s+/, "").trim();
}

function isISP(org: string, blocklist: string[]): boolean {
  const lower = org.toLowerCase();
  return blocklist.some((pattern) => lower.includes(pattern.toLowerCase()));
}

// Extract company domain from a hostname like "host-1-2.acmecorp.co.uk"
function extractDomainFromHostname(hostname: string): string | null {
  if (!hostname || hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) return null;
  // Strip common ISP/generic patterns
  const ispPatterns = /\b(dynamic|static|pool|dial|dsl|cable|broadband|residential|mobile|gprs|lte|nat|dhcp|ppp)\b/i;
  if (ispPatterns.test(hostname)) return null;
  // Get the registrable domain (last two parts, or three for .co.uk etc)
  const parts = hostname.split(".");
  if (parts.length < 2) return null;
  const twoPartTLDs = ["co.uk", "org.uk", "ac.uk", "com.au", "co.nz", "co.za", "com.br"];
  const lastTwo = parts.slice(-2).join(".");
  if (twoPartTLDs.includes(lastTwo) && parts.length >= 3) {
    return parts.slice(-3).join(".");
  }
  return lastTwo;
}

// Query RIPE RDAP for European IPs — free, no auth needed
async function queryRIPE(ip: string): Promise<string | null> {
  try {
    const res = await fetch(`https://rdap.db.ripe.net/ip/${ip}`, {
      headers: { "Accept": "application/json" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    // Look for the organisation or entity name
    if (data.entities) {
      for (const entity of data.entities) {
        if (entity.roles?.includes("registrant") || entity.roles?.includes("administrative")) {
          const name = entity.vcardArray?.[1]?.find((v: string[]) => v[0] === "fn")?.[3];
          if (name && typeof name === "string") return name;
        }
      }
      // Fallback: first entity with a name
      for (const entity of data.entities) {
        const name = entity.vcardArray?.[1]?.find((v: string[]) => v[0] === "fn")?.[3];
        if (name && typeof name === "string") return name;
      }
    }
    // Fallback: check the name field directly
    if (data.name) return data.name;
    return null;
  } catch {
    return null;
  }
}

// Query ARIN RDAP for US/CA IPs — free, no auth needed
async function queryARIN(ip: string): Promise<string | null> {
  try {
    const res = await fetch(`https://rdap.arin.net/registry/ip/${ip}`, {
      headers: { "Accept": "application/json" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.entities) {
      for (const entity of data.entities) {
        if (entity.roles?.includes("registrant") || entity.roles?.includes("administrative")) {
          const name = entity.vcardArray?.[1]?.find((v: string[]) => v[0] === "fn")?.[3];
          if (name && typeof name === "string") return name;
        }
      }
    }
    if (data.name) return data.name;
    return null;
  } catch {
    return null;
  }
}

async function enrichIP(
  ip: string,
  siteId: string,
  visitorId: string,
  ipinfoToken: string | null
): Promise<void> {
  if (!ipinfoToken) return;

  try {
    // Step 1: IPinfo lookup (hostname + org)
    const res = await fetch(`https://ipinfo.io/${ip}?token=${ipinfoToken}`);
    if (!res.ok) return;
    const ipinfo = await res.json();
    if (!ipinfo.org) return;

    // Fetch ISP blocklist
    const { data: blocklist } = await supabase
      .from("isp_blocklist")
      .select("org_pattern");
    const patterns = (blocklist || []).map((b: { org_pattern: string }) => b.org_pattern);

    let companyName = cleanCompanyName(ipinfo.org);
    let domain: string | null = null;
    let isp = isISP(ipinfo.org, patterns);

    // Step 2: If it looks like an ISP, try to find the real company
    if (isp) {
      // Try hostname first — sometimes reveals company domain
      if (ipinfo.hostname) {
        domain = extractDomainFromHostname(ipinfo.hostname);
        if (domain && !isISP(domain, patterns)) {
          // Hostname revealed a non-ISP domain — use it as company name
          const domainName = domain.split(".")[0];
          // Capitalise first letter
          companyName = domainName.charAt(0).toUpperCase() + domainName.slice(1) + " (" + domain + ")";
          isp = false;
        }
      }

      // Try RIPE RDAP (European IPs) — often has the actual leaseholder
      if (isp) {
        const ripeName = await queryRIPE(ip);
        if (ripeName && !isISP(ripeName, patterns) && ripeName !== companyName) {
          companyName = ripeName;
          isp = false;
        }
      }

      // Try ARIN RDAP (US/CA IPs) as fallback
      if (isp) {
        const arinName = await queryARIN(ip);
        if (arinName && !isISP(arinName, patterns) && arinName !== companyName) {
          companyName = arinName;
          isp = false;
        }
      }
    }

    // Step 3: Store the enriched company
    const enrichmentData = { ...ipinfo, ripe_check: true, resolved_name: companyName };

    const { data: company } = await supabase
      .from("companies")
      .upsert(
        {
          site_id: siteId,
          name: companyName,
          clean_name: companyName,
          domain: domain,
          city: ipinfo.city || null,
          region: ipinfo.region || null,
          country: ipinfo.country || null,
          is_isp: isp,
          last_seen: new Date().toISOString(),
        },
        { onConflict: "site_id,name", ignoreDuplicates: false }
      )
      .select("id")
      .single();

    if (company) {
      await supabase
        .from("visitors")
        .update({
          company_id: company.id,
          ip_enriched: true,
          enrichment: enrichmentData,
        })
        .eq("id", visitorId);
    }
  } catch {
    // Enrichment is best-effort
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
