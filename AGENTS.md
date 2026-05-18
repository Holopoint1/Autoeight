# AGENTS.md — Autoeight V2

**This is the single source of truth for AI agents and contributors.**
`CLAUDE.md`, `GEMINI.md`, `.cursorrules`, `.windsurfrules`, `system_prompt.md`, and
`.github/copilot-instructions.md` are thin pointers to this file — do not duplicate
content into them. Update facts here only.

For humans, start with [`README.md`](README.md). For deep structure and the
deployment contract, see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## Project

Autoeight is an AI and automation agency in Halifax, West Yorkshire, UK. This repo
is the company website — a **static HTML/CSS/JS site, no framework, no CMS, no build
step**, hosted on **Cloudflare Pages** at **autoeight.ai** (Cloudflare also
manages DNS for the domain). Migrated from GitHub Pages; the GitHub repo is the
source connected to the Cloudflare Pages project.

## Tech stack

- HTML5, CSS3, vanilla JavaScript (no jQuery, no React, no libraries)
- Google Fonts (Inter 300–800), Font Awesome 6.5 (CDN)
- Single shared `style.css` (~160 KB) and `main.js`
- `includes.js` injects shared `nav.html` + `footer.html` and the chat widget
- `ae-track.js` + `ae-consent.js` for analytics/consent
- Supabase (Postgres + Edge Functions) for chat, visitor tracking, admin auth —
  **deployed separately via the Supabase CLI, not Cloudflare Pages**

## ⚠️ Deployment contract — read before moving anything

**No build step. The folder path *is* the live URL.** `about.html` → `autoeight.ai/about.html`;
`services/web-design.html` → `autoeight.ai/services/web-design.html`. Cloudflare
Pages serves the repo root verbatim — same as GitHub Pages did.

Cloudflare Pages *can* now do edge 301s via `_redirects`, so a future
restructure is technically possible **only** with a complete redirect map. It is
still strongly discouraged: gratuitous URL churn loses SEO for no gain.

Therefore, by default:

- **Do NOT move or rename HTML pages or root assets** (`style.css`, `main.js`,
  `includes.js`, `ae-track.js`, `ae-consent.js`, `nav.html`, `footer.html`).
  It changes live URLs, breaks `sitemap.xml`, inbound links, and SEO unless every
  moved URL gets a 301 in `_redirects`.
- Asset references are mixed: root pages use `style.css`, subfolder pages use
  `../style.css`, and `includes.js`/`nav.html`/`footer.html` use absolute `/` paths.
- `robots.txt` explicitly references `/backend/`, `/nav.html`, `/footer.html`,
  `/includes.js` — keep those paths stable.
- Update `sitemap.xml` whenever you add/remove/rename a page.

## Directory layout (accurate)

```
index.html  about.html  book.html  privacy.html  terms.html   # root pages
style.css  main.js  includes.js  ae-track.js  ae-consent.js    # shared assets (do not move)
nav.html  footer.html                                          # fragments injected by includes.js
wrangler.toml  _headers  _redirects                            # Cloudflare Pages config
CNAME  robots.txt  sitemap.xml                                  # legacy GH Pages CNAME (inert on CF) / SEO

services/         # 9 service landing pages (see list below)
resources/        # blog hub + ~15 blog-*.html, blueprints hub + 4 blueprint-*.html, glossary, news
results/          # case-studies hub, testimonials, 5 client case-study pages
brand_assets/     # logos + images; brand_assets/case-studies/ has client detail pages
admin/            # internal staff portal at /admin/* (auth-gated, not indexed) — see admin/README.md
backend/          # legacy 302 redirect stubs → /admin/* (intentional; keeps old links alive; robots-blocked)
chatbot/          # chat widget client + edge-function source + setup docs — see chatbot/README.md
supabase/         # Postgres migrations + Edge Functions (deployed to Supabase, NOT served here)
docs/             # project documentation (ARCHITECTURE.md)
.claude/skills/   # Claude Code marketing/dev skills (gitignored, not deployed)
```

### Services — the 9 real files in `services/`

`ai-automation` · `crm-integration` · `data-reporting` · `email-automation` ·
`internal-systems` · `lms` · `sales-automation` · `sales-marketing` · `web-design`

> The public nav dropdown / footer show a **curated subset**, not all 9. Treat
> `nav.html` and `footer.html` as the source of truth for what appears in
> navigation. **`system-integration.html` does not exist** — older docs that listed
> "7 services including system-integration" were wrong; ignore that.

### `backend/` is not a backend

It is 13 HTML files that redirect `/backend/*` → the matching `/admin/*` clean
URL, kept so old bookmarks/email links don't break. It is blocked in `robots.txt`.
Real admin code lives in `admin/` (`admin/auth.js`, `admin/admin.css`). Do not
delete `backend/`; do not rename it.

On Cloudflare Pages, `_redirects` now performs these as real edge **301s** (it
mirrors the stubs' own targets exactly). The HTML stubs stay as a harmless
fallback. If you add/rename an admin page, update `_redirects` **and** the stub.

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

## Code conventions

- Semantic HTML, one H1 per page, 2-space indent
- Use existing CSS custom properties (`--purple-light`, `--muted`, `--border`, …).
  Note: the colour naming is intentionally inverted (`--black:#fff`, `--white:#111`)
- Hyphenated class names (`hero-content`, `blog-card`, `stat-bar`); reuse existing
  components (`page-hero`, `page-section`, `tier-card`, `feature-card`, `step-card`)
- Vanilla DOM JS only; `IntersectionObserver` `.reveal`→`.visible` for animations
- External links: `target="_blank" rel="noopener"`
- Cache-bust changed assets with `?v=YYYYMMDD`
- Never commit `.env`, credentials, or API keys (secrets live in Supabase env vars)

## Proof points

- Matrix TSL: 3 hrs saved per rep per day, 29 tools consolidated
- Learn With Lorna: 60% less admin, £200+/mo saved, custom LMS
- TM Joinery: 0 to ranking in 6 regions, 5-star Google rating
- The Dice Tavern: 0% marketplace fees, 4.9-star rating, 4 automated emails per order

## Related docs (kept co-located with their domain — correct, don't centralise)

- [`admin/README.md`](admin/README.md) — admin portal
- [`chatbot/README.md`](chatbot/README.md) — chat widget + setup
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — deployment model & structure rationale
