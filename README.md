# Autoeight V2 — autoeight.ai

The Autoeight company website. Autoeight is an AI and automation agency in Halifax,
West Yorkshire. This is a **static HTML/CSS/JS site with no build step**, hosted on
**Cloudflare Pages** at **autoeight.ai** (Cloudflare also manages the domain's DNS).
It was migrated from GitHub Pages; the GitHub repo is still the connected source.

## Quick start

There is nothing to install or build. To preview locally:

```bash
# Cloudflare Pages runtime (matches production, applies _headers/_redirects):
npx wrangler pages dev .

# …or any plain static server:
python -m http.server 8000
```

`includes.js` (nav/footer/chat injection) and absolute `/` asset paths work best
served from the site root.

## Deploying

The repo is connected to a Cloudflare Pages project. **There is no build** —
Framework preset *None*, build command empty, output directory `/` (repo root).
Push to `main` → production deploy. Every branch/PR → a preview deployment.
`_headers`, `_redirects`, and `wrangler.toml` take effect automatically on
Cloudflare Pages.

> **Important:** there is still no build step, so the folder path *is* the public
> URL. Cloudflare Pages *can* 301 via `_redirects`, but don't churn URLs — see
> [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). First-time cutover steps are in
> that file under "Migrating GitHub Pages → Cloudflare Pages".

## Where things live

| Path | What |
|---|---|
| `index.html`, `about.html`, `book.html`, `privacy.html`, `terms.html` | Root pages |
| `style.css`, `main.js`, `includes.js`, `ae-track.js`, `ae-consent.js` | Shared assets (do not move) |
| `nav.html`, `footer.html` | Fragments injected at runtime by `includes.js` |
| `wrangler.toml`, `_headers`, `_redirects` | Cloudflare Pages config |
| `services/` | 9 service landing pages |
| `resources/` | Blog + blueprints + glossary + news |
| `results/` | Case studies + testimonials |
| `brand_assets/` | Logos, images, client case-study pages |
| `admin/` | Internal staff portal (`/admin/*`, auth-gated) — see [`admin/README.md`](admin/README.md) |
| `backend/` | Legacy redirect stubs → `/admin/*` (now also 301'd at the edge by `_redirects`) |
| `chatbot/` | Chat widget + edge-function source — see [`chatbot/README.md`](chatbot/README.md) |
| `supabase/` | Postgres migrations + Edge Functions (deployed to Supabase, not Cloudflare Pages) |
| `docs/` | Project documentation |

## Documentation

- **[`AGENTS.md`](AGENTS.md)** — single source of truth for conventions, brand voice,
  SEO rules, and structure (AI tool configs all point here)
- **[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)** — deployment model, the
  Cloudflare Pages cutover checklist, and structural rationale
- **[`admin/README.md`](admin/README.md)** — admin portal
- **[`chatbot/README.md`](chatbot/README.md)** — chat widget & setup

## Conventions in one line

Vanilla HTML/CSS/JS, British English, hyphenated class names, reuse existing
components, never commit secrets. Full detail in [`AGENTS.md`](AGENTS.md).
