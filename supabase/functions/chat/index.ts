// ============================================================
// Autoeight Chat — Supabase Edge Function (free, no AI)
// ============================================================
// Deploy with: supabase functions deploy chat
//
// Environment variables required in Supabase dashboard:
//   SUPABASE_URL              (auto-set)
//   SUPABASE_SERVICE_ROLE_KEY (auto-set)
//   RESEND_API_KEY            (get from resend.com, free tier 100/day)
//   NOTIFY_EMAIL              (alfie@autoeight.ai)
//   PUSHOVER_TOKEN            (optional, for push notifications)
//   PUSHOVER_USER             (optional, for push notifications)
//   TELEGRAM_BOT_TOKEN        (optional, for Telegram)
//   TELEGRAM_CHAT_ID          (optional, for Telegram)

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const NOTIFY_EMAIL = Deno.env.get("NOTIFY_EMAIL") || "alfie@autoeight.ai";
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "Autoeight Chat <onboarding@resend.dev>";
const PUSHOVER_TOKEN = Deno.env.get("PUSHOVER_TOKEN");
const PUSHOVER_USER = Deno.env.get("PUSHOVER_USER");
const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
const TELEGRAM_CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

interface ChatRequest {
  action: "submit_lead" | "append_message" | "history";
  conversation_id?: string;
  visitor_id?: string;
  name?: string;
  company?: string;
  email?: string | null;
  message?: string;
  page_url?: string;
  user_agent?: string;
  since?: string;
}

async function sendEmail(subject: string, body: string): Promise<void> {
  if (!RESEND_API_KEY) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: NOTIFY_EMAIL,
        subject,
        html: body,
      }),
    });
  } catch (e) {
    console.error("Email send failed:", e);
  }
}

async function sendPushover(title: string, message: string): Promise<void> {
  if (!PUSHOVER_TOKEN || !PUSHOVER_USER) return;
  try {
    await fetch("https://api.pushover.net/1/messages.json", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        token: PUSHOVER_TOKEN,
        user: PUSHOVER_USER,
        title,
        message,
        priority: "1",
        sound: "pushover",
      }),
    });
  } catch (e) {
    console.error("Pushover failed:", e);
  }
}

async function sendTelegram(message: string): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
  } catch (e) {
    console.error("Telegram failed:", e);
  }
}

function escapeHtml(s: string): string {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function notifyNewLead(conversationId: string, name: string, company: string, email: string, message: string, pageUrl: string) {
  const adminUrl = `https://autoeight.ai/backend/chat-admin.html?conversation=${conversationId}`;
  const safeName = escapeHtml(name);
  const safeCompany = escapeHtml(company);
  const safeEmail = escapeHtml(email);
  const safeMessage = escapeHtml(message);
  const safePage = escapeHtml(pageUrl);

  const emailBody = `
    <h2 style="font-family:system-ui;">New chat from ${safeName}</h2>
    <table style="font-family:system-ui;font-size:14px;border-collapse:collapse;">
      <tr><td style="padding:4px 12px 4px 0;color:#666;"><strong>Name</strong></td><td>${safeName}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#666;"><strong>Company</strong></td><td>${safeCompany || "(not provided)"}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#666;"><strong>Email</strong></td><td>${email ? `<a href="mailto:${safeEmail}">${safeEmail}</a>` : "(not provided)"}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#666;"><strong>Page</strong></td><td><a href="${safePage}">${safePage}</a></td></tr>
    </table>
    <hr style="margin:16px 0;border:none;border-top:1px solid #eee;">
    <p style="font-family:system-ui;font-size:14px;white-space:pre-wrap;">${safeMessage}</p>
    <hr style="margin:16px 0;border:none;border-top:1px solid #eee;">
    <p><a href="${adminUrl}" style="display:inline-block;padding:12px 24px;background:#6d4de6;color:#fff;text-decoration:none;border-radius:8px;font-family:system-ui;">Reply in admin panel</a></p>
  `;

  const pushBody = `${name}${company ? " (" + company + ")" : ""}${email ? "\n" + email : ""}\n\n${message}\n\nReply: ${adminUrl}`;

  const telegramBody =
    `<b>New Autoeight chat</b>\n\n` +
    `<b>Name:</b> ${safeName}\n` +
    `<b>Company:</b> ${safeCompany || "(not provided)"}\n` +
    `<b>Email:</b> ${safeEmail || "(not provided)"}\n` +
    `<b>Page:</b> ${safePage}\n\n` +
    `${safeMessage}\n\n` +
    `<a href="${adminUrl}">Reply in admin panel</a>`;

  await Promise.all([
    sendEmail(`[Autoeight] New chat from ${name}${company ? " at " + company : ""}`, emailBody),
    sendPushover(`${name} wants to chat`, pushBody),
    sendTelegram(telegramBody),
  ]);
}

async function notifyFollowUp(conversationId: string, name: string, message: string) {
  const adminUrl = `https://autoeight.ai/backend/chat-admin.html?conversation=${conversationId}`;
  const safe = escapeHtml(message);
  const safeName = escapeHtml(name || "visitor");

  const emailBody = `
    <h2 style="font-family:system-ui;">Follow-up from ${safeName}</h2>
    <p style="font-family:system-ui;font-size:14px;white-space:pre-wrap;">${safe}</p>
    <hr style="margin:16px 0;border:none;border-top:1px solid #eee;">
    <p><a href="${adminUrl}" style="display:inline-block;padding:12px 24px;background:#6d4de6;color:#fff;text-decoration:none;border-radius:8px;font-family:system-ui;">Reply in admin panel</a></p>
  `;

  await Promise.all([
    sendEmail(`[Autoeight] Follow-up from ${name || "visitor"}`, emailBody),
    sendPushover(`${name || "Visitor"} added more`, `${message}\n\nReply: ${adminUrl}`),
    sendTelegram(
      `<b>Follow-up from ${safeName}</b>\n\n${safe}\n\n<a href="${adminUrl}">Reply</a>`
    ),
  ]);
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });
  }

  try {
    const body: ChatRequest = await req.json();

    // ── ACTION: Load conversation history (with optional `since` filter) ──
    if (body.action === "history" && body.conversation_id) {
      let query = supabase
        .from("chat_messages")
        .select("role, content, created_at")
        .eq("conversation_id", body.conversation_id)
        .order("created_at", { ascending: true });

      if (body.since) query = query.gt("created_at", body.since);

      const { data } = await query;

      return new Response(JSON.stringify({ messages: data || [] }), {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // ── ACTION: Submit initial lead (name + company + first message) ──
    if (body.action === "submit_lead" && body.message) {
      const { data: newConv, error: convError } = await supabase
        .from("chat_conversations")
        .insert({
          visitor_id: body.visitor_id || null,
          visitor_name: body.name || null,
          visitor_email: body.email || null,
          visitor_company: body.company || null,
          page_url: body.page_url || null,
          user_agent: body.user_agent || null,
          status: "waiting_human",
          requested_human_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (convError || !newConv) {
        console.error("Create conversation failed:", convError);
        return new Response(JSON.stringify({ error: "Could not create conversation" }), {
          status: 500,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      }

      const conversationId = newConv.id;
      const now = new Date().toISOString();

      await supabase.from("chat_messages").insert([
        {
          conversation_id: conversationId,
          role: "user",
          content: body.message,
        },
      ]);

      await supabase
        .from("chat_conversations")
        .update({ last_message_at: now })
        .eq("id", conversationId);

      // Fire notifications (don't await to keep response fast — but we do await inside Promise.all)
      await notifyNewLead(
        conversationId,
        body.name || "Anonymous",
        body.company || "",
        body.email || "",
        body.message,
        body.page_url || ""
      );

      return new Response(
        JSON.stringify({
          conversation_id: conversationId,
          status: "waiting_human",
          last_message_at: now,
        }),
        { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // ── ACTION: Append a follow-up message to an existing conversation ──
    if (body.action === "append_message" && body.conversation_id && body.message) {
      await supabase.from("chat_messages").insert({
        conversation_id: body.conversation_id,
        role: "user",
        content: body.message,
      });

      await supabase
        .from("chat_conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", body.conversation_id);

      const { data: conv } = await supabase
        .from("chat_conversations")
        .select("visitor_name")
        .eq("id", body.conversation_id)
        .single();

      await notifyFollowUp(body.conversation_id, conv?.visitor_name || "", body.message);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Handler error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
