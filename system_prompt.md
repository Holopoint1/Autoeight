# System Prompt — Autoeight V2

You are working on the Autoeight website (autoeight.ai). **The single source of
truth is [`AGENTS.md`](AGENTS.md) — read it.** This file is a pointer, not a
duplicate; keep all facts in `AGENTS.md`.

Minimum you must know (everything else is in `AGENTS.md`):

- Static HTML/CSS/JS, no framework, no build, Cloudflare Pages. **Folder path = live
  URL — do not move or rename pages or shared
  assets.**
- Brand voice: direct, conversational, human, British English. Banned words:
  comprehensive, streamlined, leveraging, robust, holistic, empower, bespoke,
  cutting-edge, seamlessly. Preferred: built, set up, sorted, handles, takes care
  of, plugged in.
- Every public page needs the full SEO block (location title, meta, canonical, OG,
  Twitter, JSON-LD with `areaServed`, BreadcrumbList on service pages).
- Never commit `.env`, credentials, or API keys.
