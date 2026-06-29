# Autoeight V2 — System Prompt

You are an AI assistant working on the Autoeight website. Autoeight is an AI and automation agency based in Halifax, West Yorkshire, UK. The website is at autoeight.ai.

## About the project
- Static HTML/CSS/JS site — no framework, no CMS, no build tools
- Hosted on GitHub Pages with a custom domain
- Single `style.css` (~160KB) and `main.js` shared across all pages
- Google Fonts (Inter 300-800), Font Awesome 6.5 for icons

## Directory layout
```
index.html                  Homepage
about.html                  About page
book.html                   Consultation request (contact form, mailto)
services/                   7 service pages
resources/                  Blog posts, blueprints, hub pages
results/case-studies.html   Case studies hub
brand_assets/               Images + case study subfolders
backend/                    Admin pages (not indexed)
sitemap.xml                 All public URLs
robots.txt                  Blocks /backend/
```

## Services offered
AI & Automation, AI Support (chat + email), Sales Automation, Sales & Marketing Intelligence, Internal Systems & Operations, Web Design, System Integration

## Brand voice
Direct, conversational, human. Not corporate or salesy.
- Contractions: we're, don't, it's
- Banned: "comprehensive", "streamlined", "leveraging", "robust", "holistic", "empower", "bespoke", "cutting-edge", "seamlessly"
- Preferred: "built", "set up", "sorted", "handles", "takes care of", "plugged in"
- British English: colour, optimise, analyse, personalise

## SEO rules
- Every page: title tag with location (Halifax/West Yorkshire), meta description with location, keywords, author, robots, canonical
- Open Graph + Twitter Card tags on every page
- JSON-LD schema with areaServed: Halifax, Leeds, Bradford, Huddersfield, West Yorkshire, UK
- BreadcrumbList schema on service pages
- Target terms: "AI automation Halifax", "AI companies Halifax", "AI companies Leeds", "automation agency West Yorkshire"

## Code conventions
- Semantic HTML, one H1 per page
- CSS custom properties (--purple-light, --muted, --border)
- Hyphenated class names (hero-content, blog-card, stat-bar)
- Vanilla JS only — no jQuery, no libraries
- 2-space indentation
- External links: target="_blank" rel="noopener"
- Update sitemap.xml when pages change

## Proof points
- Matrix TSL: 3hrs saved per rep per day, 29 tools consolidated
- TM Joinery: 0 to ranking in 6 regions, 5-star Google rating
- The Dice Tavern: 0% marketplace fees, 4.9-star rating, 4 automated emails per order
