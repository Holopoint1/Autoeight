# GitHub Copilot Instructions — Autoeight V2

Single source of truth: [`../AGENTS.md`](../AGENTS.md). Do not duplicate content
here — update `AGENTS.md` only.

When generating code for this repo:

- It is static HTML/CSS/JS, no framework, no build step, Cloudflare Pages at
  autoeight.ai. **Folder path = live URL — never move or rename
  pages or shared assets** (`style.css`, `main.js`, `includes.js`, `nav.html`,
  `footer.html`, …). Update `sitemap.xml` on page changes.
- Use semantic HTML (one H1/page), 2-space indent, existing CSS custom properties,
  hyphenated class names, existing components (`page-hero`, `page-section`,
  `blog-card`, `tier-card`, `stat-bar`, `feature-card`). Vanilla DOM JS only.
- British English. External links `target="_blank" rel="noopener"`.
- Brand voice: direct, conversational, human. Banned: comprehensive, streamlined,
  leveraging, robust, holistic, empower, bespoke, cutting-edge, seamlessly.
- Every public page needs the full SEO block (location title/meta/canonical, OG,
  Twitter, JSON-LD `areaServed`, BreadcrumbList on service pages).
- Never emit `.env`, credentials, or API keys.
