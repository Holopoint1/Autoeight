# Architecture & Structure

Why this repo is shaped the way it is, and the constraints that decide what you
may safely change. Conventions live in [`../AGENTS.md`](../AGENTS.md); this file
is about *structure and deployment*.

## Deployment model

Static site, **no build step**, served by **Cloudflare Pages** from the repo root,
connected to the GitHub repo. Cloudflare also manages DNS for autoeight.ai. Push
to `main` = production deploy; every branch/PR = a preview deployment.

The consequence that still governs everything:

> **Folder path = public URL.** There is no build, so nothing rewrites paths.

Cloudflare Pages *can* issue edge 301s via `_redirects` (GitHub Pages could not),
so a future restructure is now *technically* possible — but only with a complete,
correct redirect map, and it is still discouraged: churning indexed URLs loses
SEO for no real gain. The layout is intentionally flat-ish because that *is* the
URL contract; treat it as published API, not free-choice code organisation.

## Cloudflare Pages config files

| File | Purpose |
|---|---|
| `wrangler.toml` | Pages project config. No build, `pages_build_output_dir = "."`. **No D1/KV/R2 bindings** — the only backend is Supabase, called over HTTPS. Don't add bindings the site doesn't use. |
| `_headers` | Security headers (safe, non-breaking) + caching. CSP is intentionally **not enforced** — see the file's comments; test as Report-Only first. |
| `_redirects` | Edge 301s for legacy `/backend/*` → `/admin/*`, mirroring the stubs' own targets exactly. Catch-all `/backend/*` rule must stay last. |

These files are inert on GitHub Pages, so they were safe to commit before cutover
and become active automatically once Cloudflare Pages serves the site.

## Migrating GitHub Pages → Cloudflare Pages (one-time, dashboard/DNS — manual)

The repo side is done. These steps are done by a human in the dashboards:

1. **Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git.**
   Pick `Holopoint1/Autoeight`, branch `main`.
2. **Build settings:** Framework preset **None**, Build command **empty**,
   Build output directory **`/`**. Save & deploy.
3. **Verify the `*.pages.dev` preview** before touching DNS: spot-check several
   pages, nav/footer injection, the chat widget, an `/admin/*` page + login, and
   a `/backend/...` URL (must 301 to `/admin/...`).
4. **Custom domain:** Pages project → Custom domains → add `autoeight.ai` (and
   `www` if used). Cloudflare manages the DNS, so it wires the records itself.
   This is the cutover — traffic now serves from Cloudflare Pages.
5. **Decommission GitHub Pages:** GitHub repo → Settings → Pages → set source to
   None (prevents two origins). The repo `CNAME` file is now inert on Cloudflare
   Pages — harmless; leave it or delete it later, no rush.
6. **Supabase is unaffected** (separate project, separate deploy).

Until step 4, the live site is still GitHub Pages and nothing here changes its
behaviour — committing the config is non-breaking.

## What is served vs. what is not

| Lives in repo | Served to the public? |
|---|---|
| Root pages, `services/`, `resources/`, `results/`, `brand_assets/`, `admin/`, `backend/` | Yes (`admin/`+`backend/` robots-blocked) |
| `chatbot/widget/chat-widget.js` | Yes (loaded by `includes.js`) |
| `chatbot/backend/*`, `supabase/**` | No — source for Supabase, deployed via Supabase CLI |
| `.claude/`, `.tmp/`, `supabase/.temp/`, `.dev.vars` | No (gitignored / local state) |

> No-build means the deploy root is the repo root, so docs/source files (`*.md`,
> `supabase/`) are technically reachable — same as under GitHub Pages, no
> regression. The repo is public on GitHub anyway. Excluding them would require
> introducing a build, which is explicitly out of scope.

## Asset reference rules (why moving assets is still unsafe)

- Root pages reference `style.css` / `main.js` (relative, no leading slash)
- Subfolder pages reference `../style.css` / `../main.js` (depth-sensitive)
- `includes.js`, `nav.html`, `footer.html`, the logo, the chat widget use `/` paths
- `robots.txt` hard-codes `/backend/`, `/nav.html`, `/footer.html`, `/includes.js`

Moving a shared asset means correctly rewriting ~50+ mixed relative/absolute
references *and* `robots.txt` — high risk, zero user benefit. Don't.

## `backend/` — intentional, not a mistake

13 HTML stubs that redirect `/backend/<x>` → `/admin/<x>` (the admin portal moved
to clean `/admin/*` URLs). On Cloudflare Pages, `_redirects` does this as real
edge 301s; the stubs remain as a harmless fallback. Blocked in `robots.txt`. The
name is misleading but renaming defeats its only purpose (back-compat). If you
add/rename an admin page, update **both** `_redirects` and the matching stub.

## Supabase relationship

`supabase/` (and `chatbot/backend/`) hold Postgres migrations and Edge Function
source for chat, visitor tracking, and admin auth. Deployed to Supabase
separately (`supabase functions deploy …`), never by Cloudflare Pages. The
browser calls hardcoded `https://<project>.supabase.co/functions/v1/*`. Secrets
live in Supabase Edge Function env vars, never in this repo.

## Documentation model

One source of truth: [`../AGENTS.md`](../AGENTS.md). Every AI-tool config
(`CLAUDE.md`, `GEMINI.md`, `.cursorrules`, `.windsurfrules`, `system_prompt.md`,
`.github/copilot-instructions.md`) is a **thin pointer** to it — they stay at
their required fixed paths but carry no duplicated body, so they can't drift out
of sync again. Domain READMEs (`admin/README.md`, `chatbot/README.md`) stay
**co-located with their code** — correct colocation, don't centralise them.

## Known residual issues (accepted, with reasons)

- **`backend/` is misleadingly named** — kept for backward-compat (see above).
- **Shared assets sit at repo root** — ideal would be `/assets/`, but the
  reference/`robots.txt` coupling makes the move pure risk for no gain.
- **`sitemap.xml` is hand-maintained** — update it by hand on page changes.
- **CSP not yet enforced** — needs per-page Report-Only testing first (see
  `_headers`); the site predates having any response headers at all.
- **No automated tests/linting** — acceptable for a hand-coded static brochure
  site this size; revisit only if it grows app-like.
