# Autoeight V2 — GitHub Copilot Instructions

## Project
This is the website for Autoeight, an AI and automation agency based in Halifax, West Yorkshire. Static HTML/CSS/JS hosted on GitHub Pages at autoeight.ai. No frameworks or build tools.

## Tech Stack
- HTML5, CSS3, vanilla JavaScript (no jQuery, no React, no Vue)
- Google Fonts (Inter), Font Awesome 6.5
- Single shared `style.css` and `main.js`

## When generating code
- Use semantic HTML with proper heading hierarchy
- Use existing CSS custom properties (--purple-light, --muted, --border, etc.)
- Use existing class patterns: `page-hero`, `page-section`, `blog-card`, `tier-card`, `stat-bar`, `feature-card`
- Hyphenated class names: `hero-content`, `nav-menu`, `cta-box`
- 2-space indentation
- British English spelling: colour, optimise, analyse, personalise, centre

## Tone of voice for any copy
- Direct, conversational, human
- Use contractions (we're, don't, it's)
- Never use: "comprehensive", "streamlined", "leveraging", "robust", "holistic", "empower", "bespoke", "cutting-edge", "seamlessly"
- Use: "built", "set up", "sorted", "handles", "takes care of", "plugged in"

## SEO requirements for new pages
- Title tag must include "Halifax" or "West Yorkshire"
- Meta description must include location keywords
- Include: meta keywords, meta author ("Autoeight"), meta robots ("index, follow"), canonical URL
- Include Open Graph and Twitter Card tags
- Include JSON-LD schema with areaServed: Halifax, Leeds, Bradford, Huddersfield, West Yorkshire, UK
- Add BreadcrumbList schema on service pages

## Key rules
- No frameworks, CMS, or build tools
- Nav and footer must list all 7 services including system-integration
- External links: `target="_blank" rel="noopener"`
- Update sitemap.xml when adding pages
- Never commit .env or credentials
