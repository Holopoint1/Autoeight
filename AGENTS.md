# Autoeight V2 — Agent Instructions

## Project Overview
Autoeight is an AI and automation agency based in Halifax, West Yorkshire. This repo is the company website — a static HTML/CSS/JS site hosted on GitHub Pages at autoeight.ai.

## Tech Stack
- Pure static HTML, CSS, JavaScript — no framework, no build tools
- Hosted on GitHub Pages with custom domain (CNAME: autoeight.ai)
- Google Fonts (Inter), Font Awesome icons
- Single shared `style.css` and `main.js`

## Directory Structure
```
├── index.html              # Homepage
├── about.html              # About page
├── book.html               # Consultation request (contact form, mailto)
├── style.css               # All site styling (~160KB)
├── main.js                 # Shared JS (animations, nav, forms)
├── robots.txt              # Blocks /backend/
├── sitemap.xml             # All indexed URLs
├── CNAME                   # GitHub Pages custom domain
├── services/               # 7 service pages
│   ├── ai-automation.html
│   ├── email-automation.html
│   ├── sales-automation.html
│   ├── sales-marketing.html
│   ├── internal-systems.html
│   ├── web-design.html
│   └── system-integration.html
├── resources/              # Blog posts, blueprints
│   ├── blog.html           # News hub (external article links)
│   ├── blueprints.html     # Automation blueprints hub
│   ├── blog-*.html         # Individual blog posts
│   └── blueprint-*.html    # Individual blueprint pages
├── results/
│   └── case-studies.html   # Case studies hub
├── brand_assets/           # Images + case study pages
│   └── case-studies/       # 4 client case studies
├── backend/                # Admin dashboard (blocked from indexing)
└── .claude/                # Claude Code skills
    └── skills/             # Marketing & dev skills
```

## Services
- AI & Automation
- AI Support (live chat + email automation)
- Sales Automation
- Sales & Marketing Intelligence
- Internal Systems & Operations
- Web Design
- System Integration

## Tone of Voice
Direct, conversational, human. Not corporate, not salesy.
- Use contractions (we're, don't, it's)
- Short sentences mixed with longer ones
- Banned words: "comprehensive", "streamlined", "leveraging", "robust", "holistic", "empower", "bespoke", "cutting-edge", "seamlessly"
- Preferred words: "built", "set up", "sorted", "handles", "takes care of", "plugged in"

## SEO Requirements
Every page must include:
- Title tag with location (Halifax, West Yorkshire)
- Meta description with location keywords
- Meta keywords, author, robots tags
- Canonical URL
- Open Graph + Twitter Card tags
- JSON-LD schema with multi-city areaServed (Halifax, Leeds, Bradford, Huddersfield, West Yorkshire, UK)
- BreadcrumbList schema on service pages

Target search terms: "AI automation Halifax", "AI companies Halifax", "AI companies Leeds", "automation agency West Yorkshire", "AI automation help", "business automation UK"

## Key Rules
1. Never use WordPress, Shopify, or any CMS — everything is hand-coded
2. Navigation and footer must be consistent across all pages (system-integration included)
3. Keep style.css as one file — no CSS-in-JS or preprocessors
4. All external links open in new tab with `rel="noopener"`
5. Images go in `brand_assets/`
6. Backend pages are admin-only and blocked from SEO
7. Update `sitemap.xml` when adding/changing pages
8. Match the existing card/section design patterns
9. British English spelling (colour, optimise, analyse)
