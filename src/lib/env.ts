/*
 * Typed reference for the only "env" this site has.
 *
 * There is no host backend, D1, KV, or R2 — all dynamic logic is external
 * Supabase Edge Functions called over HTTPS from the browser. The values below
 * are PUBLIC client config (already shipped in every page's HTML today, like a
 * web-analytics site key) — NOT secrets. Real secrets (Supabase service role,
 * Resend, etc.) live only in Supabase Edge Function env vars and never here.
 *
 * Centralised so the endpoint/key is defined once instead of copy-pasted into
 * every page's inline <script> as it is in the legacy site.
 */
export const PUBLIC_CONFIG = {
  /** Public visitor-tracking ingest endpoint (Supabase Edge Function). */
  trackEndpoint: 'https://useohuvyxzshmskjngpo.supabase.co/functions/v1/track',
  /** Public tracking ingest key — write-only, safe in client HTML. */
  trackApiKey: '991d5076a16d0a4d1c00379d040173fb2ff38f31e49c178e',
  /** Chat widget script (served from /public). */
  chatWidgetSrc: '/chatbot/widget/chat-widget.js?v=2026-04-21-hours',
  siteUrl: 'https://autoeight.ai',
} as const;

export type PublicConfig = typeof PUBLIC_CONFIG;
