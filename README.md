# Autoeight V2 — autoeight.ai

The Autoeight company website. Autoeight is an AI and automation agency in
Halifax, West Yorkshire. **Astro static site, deployed on Cloudflare Pages.**

> **Branch state:** on `restructure/astro-track-b` this is the migrated Astro
> project (61 pages, builds clean, **not deployed**). `main` is still the old
> no-build flat site and is what's live until a manual Cloudflare cutover.

## Quick start

```bash
npm install
npm run dev      # local dev server — open the printed URL
npm run build    # builds ./dist (exactly what Cloudflare Pages serves)
```

## Deploying

The site is built (`npm run build`) and Cloudflare Pages serves `dist/`.
Go-live settings: framework **Astro**, build command **`npm run build`**,
output **`dist`**. Every push to `main` → production; branches → previews.

`build.format:'file'` keeps URLs identical to the old site (`/about`,
`/services/web-design`, …), so no redirect map is needed. `_redirects` only
handles legacy `/backend/* → /admin/*`. Full reasoning + the one-time cutover
steps: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Where things live

| Path | What |
|---|---|
| `src/pages/` | Every page — route path = URL. `services/ resources/ results/ admin/` |
| `src/layouts/` | `BaseLayout` (head/SEO) → `MarketingLayout` (public) / `AdminLayout` (auth-gated) |
| `src/components/` | `Nav.astro`, `Footer.astro` |
| `src/lib/` | `env.ts` (public client config), `log.ts` |
| `src/styles/` | `tokens.css` (scaffold; CSS still lives in legacy `public/style.css`) |
| `public/` | Served verbatim, URLs unchanged: `style.css`, `main.js`, `ae-*.js`, `brand_assets/`, `chatbot/widget/`, `_headers`, `_redirects`, `robots.txt`, `sitemap.xml`, `CNAME` |
| `chatbot/`, `supabase/` | Edge-function source — deployed to Supabase, **not** Cloudflare |
| `docs/` | Architecture, spec conformance, migration record |

## Documentation

- **[`AGENTS.md`](AGENTS.md)** — single source of truth (conventions, voice, SEO, structure)
- **[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)** — deployment model & rationale
- **[`docs/MIGRATION.md`](docs/MIGRATION.md)** — the Astro migration record + follow-ups
- **[`docs/SPEC-CONFORMANCE.md`](docs/SPEC-CONFORMANCE.md)** — scorecard vs the Cloudflare spec
- **[`admin/README.md`](admin/README.md)** · **[`chatbot/README.md`](chatbot/README.md)**

## Conventions in one line

Astro + vanilla JS, British English, reuse existing components, page JS as
`is:inline`, never commit secrets. Full detail in [`AGENTS.md`](AGENTS.md).
