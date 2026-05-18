# Spec Conformance — Autoeight V2

Measures the project against **"Structuring a Complex Site on Cloudflare"**.
The migration to **Track B (Astro on Cloudflare Pages)** is done on branch
`restructure/astro-track-b` (61 pages, builds clean). Constraint held
throughout: content verbatim, URLs preserved 1:1, nothing deployed.

## Stack track (spec §1)

**Track B — Astro on Cloudflare Pages.** Adopted. `build.format:'file'`
preserves every existing URL so no redirect map was needed for the migration.

## Section-by-section

| Spec § | Status | Notes |
|---|---|---|
| §1 Stack track | ✅ | Track B (Astro). |
| §2 Folder structure | ✅ | `src/pages` (routes=URLs), `layouts/`, `components/`, `lib/`, `styles/`, `public/`. |
| §3 `wrangler.toml` | ✅ | Present. No D1/KV/R2 — backend is external Supabase; no invented bindings. |
| §4 Routing | ✅ | File-based `src/pages/**`. Legacy `/backend/*` → `/admin/*` via `_redirects`. |
| §5 HTML/templating | ✅ (◑ depth) | BaseLayout→MarketingLayout/AdminLayout→page; Nav/Footer components. Blog/case-studies still per-page, not yet content collections (deeper §5 — optional follow-up). |
| §6 CSS architecture | ⛔ Deferred (recorded) | Single legacy `style.css` kept verbatim; Tailwind preflight off. Token/Tailwind conversion is gradual future work — a big-bang rewrite would break 61 pages. |
| §7 JS architecture | ✅ | Component scripts; page JS kept `is:inline`; shared `lib/`. |
| §8 API/Functions | ✅ N/A by design | No host endpoints; Supabase Edge Functions. No empty `functions/`. |
| §9 Data layer | ✅ N/A by design | Supabase, not D1/KV/R2. |
| §10 Forms/validation | ◑ | `book` form migrated verbatim; Zod schema not yet added (faithful 1:1 first — follow-up). |
| §11 Auth | ✅ | Admin auth server-side in Supabase; `AdminLayout` keeps `auth.js`/`AEAuth.check()` ordering faithful; `noindex`. |
| §12 Edge concerns | ✅ | `_headers` (security+cache), `_redirects` (legacy 301s). CSP still Report-Only-pending (unchanged from before). |
| §13 Env/secrets | ✅ | `src/lib/env.ts` (public client config only). No secrets in repo. `.dev.vars` gitignored. |
| §14 Local dev | ✅ | `npm run dev`. |
| §15 Deployment | ✅ (config) ⏳ (cutover) | `npm run build`→`dist`. Cloudflare Pages settings change is the manual go-live step. |
| §16 Observability | ◑ | `lib/log.ts` ready; Cloudflare Web Analytics via `ae-track.js`. App-level error tracking N/A on static host. |
| §17 Request shape | ✅ | Chat flow documented in `chatbot/README.md`. |

## Honest summary

The structural spec is now **substantially met** — Track B adopted, the
folder model, routing, layouts/components, config, and env all conform, and
it builds. The deliberate gaps are **§6 CSS** (kept legacy to protect the
look) and the **depth items** (content collections, Zod, automated sitemap) —
all recorded as optional follow-ups in `MIGRATION.md`, none blocking. Nothing
is deployed; the live site is unchanged.
