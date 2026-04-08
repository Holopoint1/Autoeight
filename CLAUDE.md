# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Autoeight website — an AI and automation agency based in Halifax, West Yorkshire. Static site hosted on GitHub Pages at **autoeight.ai**. No framework, no CMS, no build tools. Pure HTML/CSS/JS.

## Tech Stack

- HTML5, CSS3, vanilla JavaScript (no jQuery, no React, no libraries)
- Google Fonts: Inter (weights 300–800)
- Font Awesome 6.5 (CDN)
- Single `style.css` (~6170 lines) with CSS custom properties
- Single `main.js` (~212 lines) — IntersectionObserver animations, typewriter, parallax, accordions, counters
- Supabase edge functions for backend/analytics (`supabase/functions/`)
- `ae-track.js` + `ae-consent.js` for analytics tracking
- GitHub Pages hosting, custom domain via `CNAME`

## Architecture

**No build step.** Edit HTML/CSS/JS directly and push to GitHub. GitHub Pages serves it.

### CSS Custom Properties (style.css)
The colour naming is inverted — this is intentional, not a bug:
- `--black: #ffffff` (text colour in this light theme)
- `--white: #111111` (dark text)
- `--purple: #6d4de6` / `--purple-light: #7c5cfc` (brand colours)
- `--muted: #71717a` / `--subtle: #a1a1aa` (secondary text)
- Radius scale: `--radius-sm` (8px) → `--radius-xl` (24px)

### JavaScript Patterns (main.js)
All animations use `IntersectionObserver` with a `.reveal` → `.visible` class pattern. Counters use `data-target` and `data-suffix` attributes. Mobile nav uses a hidden checkbox toggle (`#mobile-nav-toggle`). No external dependencies.

### Page Templates
Every page follows this structure:
1. `<head>`: meta tags, OG tags, Twitter cards, JSON-LD schema, font/CSS links
2. `<nav>`: shared navigation with services dropdown (6 services), resources dropdown, CTA button
3. `.page-hero`: hero section with gradient background + grid overlay
4. `.page-section` / `.page-section.alt`: content sections with `.page-section-inner` wrapper
5. `.page-cta`: call-to-action banner before footer
6. `<footer>`: brand info, service links, contact address
7. Tracking scripts: `ae-track.js`, `ae-consent.js`

### Reusable Component Classes
- `blog-card` — news/article cards on the blog hub
- `tier-card` / `tier-expandable` — expandable service feature cards (single-open accordion)
- `feature-card` — icon + title + description blocks
- `stat-bar` / `stat-card` — statistics displays with animated counters
- `step-card` — numbered process steps with connector line
- `cs-highlight` — case study preview cards
- `section-label` — small uppercase label above section titles

## Directory Layout

```
├── index.html                  # Homepage
├── about.html                  # About page
├── book.html                   # Calendly booking
├── style.css                   # All styling
├── main.js                     # All shared JS
├── ae-track.js                 # Analytics tracking
├── ae-consent.js               # Cookie consent
├── robots.txt                  # Blocks /backend/
├── sitemap.xml                 # All indexed URLs (update when adding pages)
├── CNAME                       # Custom domain: autoeight.ai
├── services/                   # 6 service pages
├── resources/                  # Blog hub, blueprint hub, individual posts
├── results/                    # Case studies hub
├── brand_assets/               # Logo, images, case study subfolders
│   └── case-studies/           # 4 client case study pages + logos
├── backend/                    # Admin dashboard (not indexed, auth-gated)
│   ├── auth.js                 # Authentication logic
│   └── backend.css             # Admin-only styles
├── supabase/                   # Edge functions + DB migrations
│   ├── functions/              # Serverless functions
│   ├── migrations/             # Database schema
│   └── seed.sql                # Seed data
└── .claude/skills/             # Claude Code marketing skills (gitignored)
    └── product-context.md      # Master product/brand reference
```

## Services (6 pages)

AI & Automation, AI Support (live chat + email), Sales Automation, Sales & Marketing Intelligence, Internal Systems & Operations, Web Design.

## Code Conventions

- **HTML**: Semantic markup, one H1 per page, 2-space indent
- **CSS**: Use existing custom properties. Hyphenated class names (`hero-content`, `blog-card`). No preprocessors
- **JS**: Vanilla DOM only. IntersectionObserver for scroll animations. No libraries
- **Copy**: British English (colour, optimise, analyse, personalise, centre)
- **External links**: `target="_blank" rel="noopener"`
- **Images**: go in `brand_assets/`
- **Cache busting**: `style.css?v=YYYYMMDD` suffix — update the version param when changing CSS

## Brand Voice

Direct, conversational, human. Not corporate, not salesy. Talk like one business owner explaining something to another over coffee.

**Banned words**: comprehensive, streamlined, leveraging, robust, holistic, empower, bespoke, cutting-edge, seamlessly

**Preferred words**: built, set up, sorted, handles, takes care of, plugged in

## SEO Requirements

Every page must include:
- Title tag with "Halifax" or "West Yorkshire"
- Meta description with location keywords
- `meta name="keywords"`, `meta name="author"` (Autoeight), `meta name="robots"` (index, follow)
- Canonical URL
- Open Graph tags: og:type, og:url, og:title, og:description, og:image, og:site_name, og:locale
- Twitter Card tags: twitter:card, twitter:title, twitter:description, twitter:image
- JSON-LD schema with `areaServed` array: Halifax, Leeds, Bradford, Huddersfield, West Yorkshire, UK
- BreadcrumbList schema on service pages

**Target search terms**: "AI automation Halifax", "AI companies Halifax", "AI companies Leeds", "automation agency West Yorkshire", "AI automation help", "business automation UK"

## Skills

Marketing and development skills live in `.claude/skills/`. Always read `product-context.md` first — it's the master reference for tone, audience, services, proof points, and SEO strategy. Available skills: seo-audit, copywriting, case-study-writer, email-sequence, page-cro, cold-email, content-strategy, brand-voice, schema-markup, sales-enablement.

## Key Rules

1. No frameworks, CMS, WordPress, Shopify, or build tools — everything is hand-coded
2. Nav dropdown + footer must list all 6 services consistently across every page
3. Update `sitemap.xml` when adding or changing pages
4. Backend pages (`/backend/`) are admin-only and blocked from indexing
5. Never commit `.env`, credentials, or API keys
6. Match existing design patterns — don't invent new component styles
