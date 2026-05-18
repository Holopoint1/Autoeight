# CLAUDE.md

Single source of truth for this repo is **AGENTS.md**. Read it:

@AGENTS.md

Do not duplicate guidance here — update facts in `AGENTS.md` only. Humans start at
`README.md`; deployment/structure rationale is in `docs/ARCHITECTURE.md`.

## Claude Code specifics

- Marketing/dev skills live in `.claude/skills/` (gitignored, not deployed). Read
  `.claude/skills/product-context.md` first for tone/audience/proof points.
- The hard rule worth repeating: **no build step, Cloudflare Pages, folder = live URL,
  never move/rename pages or shared assets** (edge 301s exist via `_redirects`, but avoid URL churn). Full reasoning in
  `docs/ARCHITECTURE.md`.
