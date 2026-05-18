# Architecture & Structure

Why this repo is shaped the way it is. Conventions live in
[`../AGENTS.md`](../AGENTS.md); this file is about *structure and deployment*.

> **State:** migrated to Astro (Track B) on branch
> `restructure/astro-track-b`. `main` is still the old no-build flat site and
> is what's live until a manual Cloudflare cutover. Both models documented
> below.

## Deployment model (Astro / Track B — the migrated branch)

Astro static build. `npm run build` → `dist/` → Cloudflare Pages serves
`dist/`. `build.format:'file'` emits `about.html` etc., which Cloudflare
serves at the clean URL `/about` (301s `/about.html`). **This is how every
existing indexed URL is preserved 1:1 with no redirect map.**

Cloudflare Pages settings for go-live: framework **Astro**, build command
**`npm run build`**, output dir **`dist`**. This *replaces* the previous
no-build setup.

There is no SSR adapter and no D1/KV/R2: all dynamic logic (chat, tracking,
admin auth) is external Supabase Edge Functions called over HTTPS. Don't add
bindings the site doesn't use.

## Source layout

```
src/
  pages/        file-based routes; path = URL (privacy.astro → /privacy)
    services/  resources/  results/  admin/
  layouts/      BaseLayout (head/SEO) → MarketingLayout (public nav/footer/
                scripts) and AdminLayout (auth-gated, noindex, admin.css)
  components/   Nav.astro, Footer.astro (verbatim from old fragments)
  lib/          env.ts (public client config), log.ts
  styles/       tokens.css (scaffold; not yet wired — see §6 deferral)
public/         served verbatim at site root, URLs unchanged:
                style.css, main.js, ae-track.js, ae-consent.js,
                brand_assets/, chatbot/widget/, _headers, _redirects,
                robots.txt, sitemap.xml, CNAME
```

SEO meta is enforced once in `BaseLayout` via props — pages pass
title/description/canonical/og/twitter; no more hand-copied `<head>` blocks.

## URL preservation

`src/pages/<path>.astro` → `<path>.html` → Cloudflare clean URL `/<path>`.
Every legacy URL maps 1:1. `_redirects` only handles legacy `/backend/*` →
`/admin/*` (mirrors the old stubs, now real edge 301s; stubs deleted).

## What's served vs not

| In repo | Public? |
|---|---|
| `src/pages/**` (built), `public/**` | Yes (`admin/*` is `noindex`; `_redirects`/`robots` cover `/backend/`) |
| `chatbot/backend/*`, `supabase/**` | No — Supabase source, deployed via Supabase CLI |
| `node_modules/`, `dist/`, `.astro/`, `.dev.vars` | No (gitignored) |

## Deliberate deviations (recorded, not accidental)

- **CSS** stays the legacy `style.css` to keep the look identical; Tailwind
  preflight disabled. Tokenising is gradual future work (`SPEC-CONFORMANCE.md`).
- **Sitemap** is the static `public/sitemap.xml` (still valid — URLs
  unchanged). `@astrojs/sitemap` v3 is incompatible with `build.format:'file'`.
- **Admin portal** migrated but highest-risk (auth, runtime sidebar via
  `/admin/layout.js`, chat PWA) — smoke-test before relying on it.
- No automated tests/lint — acceptable for a static brochure site this size.

## Legacy model (old `main` — pre-migration)

No build; flat HTML at repo root served by GitHub/Cloudflare Pages; nav/footer
injected at runtime by `includes.js`. Folder path = URL, so pages couldn't be
moved. The Astro branch supersedes this once cut over.
