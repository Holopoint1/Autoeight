// ============================================================
// Autoeight Chatbot — Supabase Edge Function
// ============================================================
// Deploy with: supabase functions deploy chat
//
// Environment variables required in Supabase dashboard:
//   SUPABASE_URL              (auto-set)
//   SUPABASE_SERVICE_ROLE_KEY (auto-set)
//   ANTHROPIC_API_KEY         (get from console.anthropic.com)
//   RESEND_API_KEY            (get from resend.com, free tier 100/day)
//   NOTIFY_EMAIL              (alfie@autoeight.ai)
//   PUSHOVER_TOKEN            (optional, for push notifications)
//   PUSHOVER_USER             (optional, for push notifications)
//   TELEGRAM_BOT_TOKEN        (optional, for Telegram)
//   TELEGRAM_CHAT_ID          (optional, for Telegram)
//   KB_CONTENT                (the full knowledge-base.md contents)
//   SYSTEM_PROMPT             (the system-prompt.md contents)

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const NOTIFY_EMAIL = Deno.env.get("NOTIFY_EMAIL") || "alfie@autoeight.ai";
const PUSHOVER_TOKEN = Deno.env.get("PUSHOVER_TOKEN");
const PUSHOVER_USER = Deno.env.get("PUSHOVER_USER");
const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
const TELEGRAM_CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID");
const KB_CONTENT = Deno.env.get("KB_CONTENT") || "";
const SYSTEM_PROMPT_BASE = Deno.env.get("SYSTEM_PROMPT") || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const SYSTEM_PROMPT = `${SYSTEM_PROMPT_BASE}

---

## Knowledge base

Use ONLY the information below to answer questions about Autoeight. If something isn't covered here, say so honestly and offer to connect them to a human.

${KB_CONTENT}`;

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "https://autoeight.ai",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

interface ChatRequest {
  action: "message" | "request_human" | "history";
  conversation_id?: string;
  visitor_id?: string;
  message?: string;
  email?: string;
  name?: string;
  page_url?: string;
  user_agent?: string;
}

async function callClaude(messages: { role: string; content: string }[]): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    console.error("Anthropic error:", error);
    return "Sorry, I'm having trouble right now. Please tap 'Talk to a human' and Adam will pick this up.";
  }

  const data = await res.json();
  return data.content?.[0]?.text || "Sorry, no response.";
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
        from: "Autoeight Bot <chat@autoeight.ai>",
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
      }),
    });
  } catch (e) {
    console.error("Telegram failed:", e);
  }
}

async function notifyHumanRequest(conversation: any, recentMessages: any[]): Promise<void> {
  const name = conversation.visitor_name || "Anonymous visitor";
  const email = conversation.visitor_email || "No email provided";
  const page = conversation.page_url || "Unknown page";

  const transcript = recentMessages
    .map((m) => `<strong>${m.role === "user" ? name : "Bot"}:</strong> ${m.content}`)
    .join("<br><br>");

  const adminUrl = `https://autoeight.ai/backend/chat-admin.html?conversation=${conversation.id}`;

  const emailBody = `
    <h2>Someone wants to talk</h2>
    <p><strong>From:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Started on:</strong> ${page}</p>
    <hr>
    <h3>Recent conversation:</h3>
    <p>${transcript}</p>
    <hr>
    <p><a href="${adminUrl}" style="display:inline-block;padding:12px 24px;background:#6d4de6;color:#fff;text-decoration:none;border-radius:8px;">Reply in admin panel</a></p>
  `;

  await Promise.all([
    sendEmail(`[Autoeight] ${name} wants to chat`, emailBody),
    sendPushover(`${name} wants to chat`, `${email}\nPage: ${page}\nReply: ${adminUrl}`),
    sendTelegram(
      `<b>Autoeight chat request</b>\n\n<b>From:</b> ${name}\n<b>Email:</b> ${email}\n<b>Page:</b> ${page}\n\n<a href="${adminUrl}">Reply in admin panel</a>`
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

    // ── ACTION: Load conversation history ──
    if (body.action === "history" && body.conversation_id) {
      const { data } = await supabase
        .from("chat_messages")
        .select("role, content, created_at")
        .eq("conversation_id", body.conversation_id)
        .order("created_at", { ascending: true });

      return new Response(JSON.stringify({ messages: data || [] }), {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // ── ACTION: Send a message ──
    if (body.action === "message" && body.message) {
      let conversationId = body.conversation_id;

      // Create conversation if none
      if (!conversationId) {
        const { data: newConv } = await supabase
          .from("chat_conversations")
          .insert({
            visitor_id: body.visitor_id || null,
            page_url: body.page_url || null,
            user_agent: body.user_agent || null,
          })
          .select("id")
          .single();
        conversationId = newConv?.id;
      }

      if (!conversationId) {
        return new Response(JSON.stringify({ error: "Could not create conversation" }), {
          status: 500,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      }

      // Store user message
      await supabase.from("chat_messages").insert({
        conversation_id: conversationId,
        role: "user",
        content: body.message,
      });

      // Check conversation status - if waiting for human, don't let AI respond
      const { data: conv } = await supabase
        .from("chat_conversations")
        .select("status")
        .eq("id", conversationId)
        .single();

      if (conv?.status === "waiting_human" || conv?.status === "human_active") {
        // Just notify that the message was received
        await supabase
          .from("chat_conversations")
          .update({ last_message_at: new Date().toISOString() })
          .eq("id", conversationId);

        return new Response(
          JSON.stringify({
            conversation_id: conversationId,
            reply: null,
            status: conv.status,
          }),
          { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }

      // Get history for context (last 20 messages)
      const { data: historyData } = await supabase
        .from("chat_messages")
        .select("role, content")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .limit(20);

      const messages = (historyData || [])
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role, content: m.content }));

      // Call Claude
      const reply = await callClaude(messages);

      // Store assistant reply
      await supabase.from("chat_messages").insert({
        conversation_id: conversationId,
        role: "assistant",
        content: reply,
      });

      await supabase
        .from("chat_conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conversationId);

      return new Response(
        JSON.stringify({ conversation_id: conversationId, reply }),
        { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // ── ACTION: Request human ──
    if (body.action === "request_human" && body.conversation_id) {
      await supabase
        .from("chat_conversations")
        .update({
          status: "waiting_human",
          requested_human_at: new Date().toISOString(),
          visitor_email: body.email || null,
          visitor_name: body.name || null,
        })
        .eq("id", body.conversation_id);

      // Get conversation and recent messages for notification
      const { data: conversation } = await supabase
        .from("chat_conversations")
        .select("*")
        .eq("id", body.conversation_id)
        .single();

      const { data: recentMessages } = await supabase
        .from("chat_messages")
        .select("role, content")
        .eq("conversation_id", body.conversation_id)
        .order("created_at", { ascending: false })
        .limit(6);

      if (conversation && recentMessages) {
        await notifyHumanRequest(conversation, recentMessages.reverse());
      }

      // Store a system message for the visitor
      await supabase.from("chat_messages").insert({
        conversation_id: body.conversation_id,
        role: "assistant",
        content: "Thanks. Adam has been notified and will reply here shortly. Feel free to leave more detail in the meantime and he'll pick it up.",
      });

      return new Response(
        JSON.stringify({ success: true, status: "waiting_human" }),
        { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
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
