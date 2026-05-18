# Spec Conformance — Autoeight V2

Measures this project against the **"Structuring a Complex Site on Cloudflare"**
spec. Hard constraint: **the live site must not change** (folder path = live URL,
no build step, indexed commercial site). So the spec is applied where safe,
and every deviation is recorded with a reason — not silently ignored.

## Stack track (spec §1)

**Track A — Static + Pages Functions (vanilla).** *Not* Track B (Astro).
Track B is the spec's default and most of the spec assumes it, but adopting it
means a build pipeline and `src/pages/*` routing, which **changes every live
URL**. Track A is the only track compatible with "don't change the live site".
Everything below is judged against that decision.

## Section-by-section

| Spec § | Status | Notes |
|---|---|---|
| §1 Stack track | ✅ Decided | Track A, recorded above. |
| §2 Folder structure | ⛔ Deviated (intentional) | The `src/` tree changes live URLs. Flat layout *is* the URL contract — see [`ARCHITECTURE.md`](ARCHITECTURE.md). |
| §3 `wrangler.toml` | ✅ Done | Minimal; no D1/KV/R2 bindings invented (site uses Supabase). |
| §4 Routing | ✅ Conforms (Track A form) | File path = route already. Legacy `/backend/*` handled by `_redirects`. |
| §5 HTML/templating | ⚠️ Partial | Shared nav/footer via `includes.js` injection. No layout/component system (needs a build). Acceptable for Track A. |
| §6 CSS architecture | ⚠️ Deviated | Single `style.css` with CSS custom-property tokens (not Tailwind). Re-architecting risks the live site for no user gain. |
| §7 JS architecture | ✅ Conforms (Track A form) | Vanilla, no globals leak via `includes.js`. No ES-module build (Track A). |
| §8 API / Functions | ✅ N/A by design | No host endpoints; dynamic logic is Supabase Edge Functions. No empty `functions/` dir (would be cargo-cult). |
| §9 Data layer | ✅ N/A by design | Supabase Postgres, not D1/KV/R2. No CF storage bindings. |
| §10 Forms/validation | ⚠️ Partial | Contact = form/mailto; chat = Supabase. No shared Zod schema (no build). |
| §11 Auth | ✅ Conforms (intent) | Admin auth validated server-side in Supabase; no secret in browser. |
| §12 Edge concerns | ✅ Done | `_headers` (security + caching) + `_redirects` added. **CSP deferred** — must be tested Report-Only first (would break fonts/icons/chat). |
| §13 Environments/secrets | ✅ Conforms | No secrets in repo; live in Supabase. `.dev.vars` gitignored. |
| §14 Local development | ✅ Done | `npx wrangler pages dev .` documented in `README.md`. |
| §15 Deployment | ⏳ Pending (user) | Repo prepped. Cloudflare dashboard + DNS cutover is manual — checklist in `ARCHITECTURE.md`. |
| §16 Observability | ⚠️ Partial | Cloudflare Web Analytics via `ae-track.js`. Structured logging/error tracking lives in Supabase functions, not the static host. |
| §17 Request shape | ✅ Documented | Chat flow already mapped in `chatbot/README.md`. |

## Spec checklist status

- [x] Pick the stack track → **A**
- [⛔] Create the folder structure → intentionally not (live URLs)
- [x] `wrangler.toml` with bindings → done (no bindings needed)
- [x] `.dev.vars` + `.gitignore` it → done
- [N/A] D1 + `0001_initial.sql` → Supabase, not D1
- [N/A] `lib/env.ts` / `lib/log.ts` / `lib/db/client.ts` → no build, no host backend
- [⚠️] BaseLayout w/ tokens/fonts/analytics/security → partial: `includes.js` + tokens in `style.css` + `_headers`
- [N/A] One feature end-to-end → no host backend feature to build
- [x] `_headers` and `_redirects` → done
- [ ] Hook up Cloudflare Pages to repo → **user, dashboard**
- [ ] Verify preview deployments → **user, after hookup**
- [N/A] Production secrets via `wrangler pages secret put` → secrets are in Supabase
- [x] Document dev & deploy commands in `README.md` → done

## The honest summary

For a live-locked vanilla static site, **"fully implement the spec" would mean
cargo-culting an Astro/D1/`lib/` skeleton the site never uses** — which is the
exact AI-mess this whole exercise is meant to remove. Conformance here =
the safe subset applied + deviations documented. That subset is now done; the
only outstanding spec item is the manual Cloudflare Pages dashboard cutover.
