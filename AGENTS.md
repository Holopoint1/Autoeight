# AGENTS.md — Autoeight V2

**This is the single source of truth for AI agents and contributors.**
`CLAUDE.md`, `GEMINI.md`, `.cursorrules`, `.windsurfrules`, `system_prompt.md`, and
`.github/copilot-instructions.md` are thin pointers to this file — do not duplicate
content into them. Update facts here only.

For humans, start with [`README.md`](README.md). For deep structure and the
deployment model, see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

> **Branch note:** on `restructure/astro-track-b` this is an **Astro** project
> (migrated, builds clean, not deployed). `main` is still the old no-build flat
> site and is what's live until a manual Cloudflare cutover. This file
> describes the Astro structure (the branch you're on).

---

## Project

Autoeight is an AI and automation agency in Halifax, West Yorkshire, UK. This repo
is the company website — an **Astro static site on Cloudflare Pages** at
**autoeight.ai** (Cloudflare also manages DNS). 61 pages.

## Tech stack

- Astro (static output), TypeScript, Tailwind (utilities only — preflight off)
- Vanilla DOM JS; Google Fonts (Inter), Font Awesome 6.5 (CDN)
- Legacy `style.css` (~160 KB) kept verbatim in `public/` as the design system
- `ae-track.js` + `ae-consent.js` for analytics/consent (in `public/`)
- Supabase (Postgres + Edge Functions) for chat, visitor tracking, admin auth —
  **deployed separately via the Supabase CLI, not Cloudflare Pages**

## Deployment & URL model

`npm run build` → `dist/` → Cloudflare Pages. `build.format:'file'` emits
`about.html` etc.; Cloudflare serves them at clean URLs (`/about`) and 301s the
`.html`. **This preserves every existing indexed URL 1:1** — that is the whole
reason for `build.format:'file'`; don't change it without a redirect map.

Cloudflare Pages go-live settings: framework **Astro**, build `npm run build`,
output **`dist`**. No SSR adapter, no D1/KV/R2 — dynamic logic is external
Supabase Edge Functions. `_redirects` handles legacy `/backend/* → /admin/*`.

- A route = its file: `src/pages/services/web-design.astro` → `/services/web-design`.
- Adding a page: create the `.astro` under `src/pages/`, use a layout, add it to
  `public/sitemap.xml` (sitemap is static — see ARCHITECTURE for why).
- SEO meta is enforced once in `BaseLayout` via props — don't hand-write `<head>`.

## Directory layout

```
src/
  pages/        routes (path = URL): root + services/ resources/ results/ admin/
  layouts/      BaseLayout (head/SEO) → MarketingLayout (public) / AdminLayout (auth-gated, noindex)
  components/   Nav.astro, Footer.astro
  lib/          env.ts (public client config only), log.ts
  styles/       tokens.css (scaffold; not yet wired — CSS deferral, see SPEC-CONFORMANCE)
public/         served verbatim, URLs unchanged: style.css, main.js, ae-track.js,
                ae-consent.js, brand_assets/, chatbot/widget/, _headers,
                _redirects, robots.txt, sitemap.xml, CNAME
wrangler.toml  astro.config.mjs  tsconfig.json  tailwind.config.js  package.json
chatbot/        edge-function source + setup docs (chatbot/README.md) — NOT served
supabase/       Postgres migrations + Edge Functions (deployed to Supabase)
docs/           ARCHITECTURE.md · SPEC-CONFORMANCE.md · MIGRATION.md
.claude/skills/ Claude Code marketing/dev skills (gitignored, not deployed)
```

### Services — the 9 pages in `src/pages/services/`

`ai-automation` · `crm-integration` · `data-reporting` · `email-automation` ·
`internal-systems` · `lms` · `sales-automation` · `sales-marketing` · `web-design`

> The public nav/footer show a **curated subset**, not all 9. `src/components/Nav.astro`
> and `Footer.astro` are the source of truth for navigation. There is no
> `system-integration` page — ignore older docs that claimed one.

### `/backend/*` and the admin portal

The 13 legacy `backend/*.html` stubs were **deleted**; `public/_redirects` now
does `/backend/* → /admin/*` as real edge 301s. The admin portal lives in
`src/pages/admin/*` using `AdminLayout` (auth-gated via Supabase, `noindex`,
own `admin.css`/`auth.js` in `public/admin/`). It is **not** in the public
sitemap and is `Disallow`-ed in `robots.txt`. See `admin/README.md`.

## Brand voice

Direct, conversational, human. Not corporate, not salesy. Like one business owner
explaining something to another over coffee. Use contractions; mix short and long
sentences. British English (colour, optimise, analyse, personalise, centre).

- **Banned:** comprehensive, streamlined, leveraging, robust, holistic, empower,
  bespoke, cutting-edge, seamlessly
- **Preferred:** built, set up, sorted, handles, takes care of, plugged in

## SEO requirements (every public page)

- Title tag with "Halifax" or "West Yorkshire"; meta description with location keywords
- `meta` keywords, author ("Autoeight"), robots ("index, follow"); canonical URL
- Open Graph + Twitter Card tags
- JSON-LD schema with `areaServed`: Halifax, Leeds, Bradford, Huddersfield,
  West Yorkshire, UK; `BreadcrumbList` schema on service pages
- Target terms: "AI automation Halifax", "AI companies Halifax", "AI companies Leeds",
  "automation agency West Yorkshire", "AI automation help", "business automation UK"

(Passed as `BaseLayout` props — set them per page, don't hand-write `<head>`.)

## Code conventions

- Semantic HTML, one H1 per page, 2-space indent
- Use existing CSS custom properties (`--purple-light`, `--muted`, `--border`, …).
  Note: the colour naming is intentionally inverted (`--black:#fff`, `--white:#111`)
- Hyphenated class names (`hero-content`, `blog-card`, `stat-bar`); reuse existing
  components (`page-hero`, `page-section`, `tier-card`, `feature-card`, `step-card`)
- Page-specific JS goes in `<script is:inline>`; JSON-LD stays verbatim in the body
- External links: `target="_blank" rel="noopener"`
- Never commit `.env`/`.dev.vars`, credentials, or API keys (secrets live in Supabase)

## Proof points

- Matrix TSL: 3 hrs saved per rep per day, 29 tools consolidated
- Learn With Lorna: 60% less admin, £200+/mo saved, custom LMS
- TM Joinery: 0 to ranking in 6 regions, 5-star Google rating
- The Dice Tavern: 0% marketplace fees, 4.9-star rating, 4 automated emails per order

## Related docs (kept co-located with their domain — correct, don't centralise)

- [`admin/README.md`](admin/README.md) — admin portal
- [`chatbot/README.md`](chatbot/README.md) — chat widget + setup
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — deployment model & rationale
- [`docs/MIGRATION.md`](docs/MIGRATION.md) — the Astro migration record
- [`docs/SPEC-CONFORMANCE.md`](docs/SPEC-CONFORMANCE.md) — spec scorecard
