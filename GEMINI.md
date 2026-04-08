# Autoeight V2 — Gemini CLI Instructions

## Project
This is the website for Autoeight, an AI and automation agency based in Halifax, West Yorkshire, UK. Static HTML/CSS/JS hosted on GitHub Pages at autoeight.ai. No frameworks, no CMS, no build tools.

## Tech Stack
- HTML5, CSS3, vanilla JavaScript
- Google Fonts (Inter 300-800), Font Awesome 6.5
- Single shared `style.css` (~160KB) and `main.js`
- GitHub Pages with custom domain (CNAME)

## Directory Structure
```
index.html              Homepage
about.html              About page
book.html               Booking (Calendly embed)
services/               7 service pages (ai-automation, email-automation, sales-automation, sales-marketing, internal-systems, web-design, system-integration)
resources/              Blog hub, blueprint hub, individual posts
results/                Case studies hub
brand_assets/           Images + case study pages
backend/                Admin dashboard (not indexed)
.claude/skills/         Claude Code marketing/dev skills
```

## Services
AI & Automation, AI Support (live chat + email), Sales Automation, Sales & Marketing Intelligence, Internal Systems & Operations, Web Design, System Integration

## Brand Voice
Direct, conversational, human. Not corporate, not salesy.
- Use contractions (we're, don't, it's)
- Banned words: "comprehensive", "streamlined", "leveraging", "robust", "holistic", "empower", "bespoke", "cutting-edge", "seamlessly"
- Preferred: "built", "set up", "sorted", "handles", "takes care of", "plugged in"
- British English: colour, optimise, analyse, personalise, centre

## SEO (Critical)
Every page must include:
- Title tag with "Halifax" or "West Yorkshire"
- Meta description with location keywords
- Meta keywords, author ("Autoeight"), robots ("index, follow")
- Canonical URL, Open Graph tags, Twitter Card tags
- JSON-LD schema with areaServed: Halifax, Leeds, Bradford, Huddersfield, West Yorkshire, UK
- BreadcrumbList schema on service pages

Target search terms: "AI automation Halifax", "AI companies Halifax", "AI companies Leeds", "automation agency West Yorkshire", "AI automation help", "business automation UK"

## Code Conventions
- Semantic HTML, one H1 per page, proper heading hierarchy
- CSS custom properties (--purple-light, --muted, --border)
- Hyphenated class names (hero-content, blog-card, stat-bar)
- Vanilla JS only — no jQuery or libraries
- 2-space indent for HTML/CSS/JS
- External links: `target="_blank" rel="noopener"`

## Rules
1. No frameworks, CMS, templates, or build tools
2. Nav dropdown + footer must include all 7 services
3. Update sitemap.xml when adding/changing pages
4. Match existing design patterns (page-hero, page-section, blog-card, tier-card, feature-card)
5. Images in brand_assets/
6. Never commit .env or credentials

## Proof Points
- Matrix TSL: 3hrs saved per rep per day, 29 tools consolidated
- Learn With Lorna: 60% less admin, £200+/mo saved
- TM Joinery: 0 to ranking in 6 regions, 5-star Google rating
- The Dice Tavern: 0% marketplace fees, 4.9-star rating
