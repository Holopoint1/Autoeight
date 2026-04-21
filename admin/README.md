# Autoeight Admin Portal

Internal portal for the Autoeight team. Lives under `/admin/*` on the live site (autoeight.ai). Not indexed by search engines. Password-protected via Supabase.

## What it's for

The admin is **a sales tool**, not a product catalogue. It exists to help you:

1. **Reply to live chats** from website visitors (the most-used page)
2. **Monitor visitor intelligence** — which companies are visiting, what pages they read, how engaged they are
3. **Audit SEO** across every page of the public site
4. **Reference the sales playbook** — stats, scripts, objection answers, proof points
5. **Pitch services in-person** using the Pitch View pages as interactive demos

Every admin page assumes an authenticated staff user. No public-facing content belongs here.

---

## Page map

| URL | File | Purpose |
|---|---|---|
| `/admin` | `index.html` | Landing dashboard. Quick stats + pitch shortcuts. |
| `/admin/login` | `login/index.html` | Single sign-in for the whole portal. |
| `/admin/chat` | `chat/index.html` | Live chat admin — reply to visitor conversations. |
| `/admin/visitors` | `visitors/index.html` | Visitor intelligence — IP-to-company, pages viewed, engagement scoring. |
| `/admin/seo` | `seo/index.html` | Site-wide SEO audit (scans every public page). |
| `/admin/skills` | `skills/index.html` | Sales playbook — stats, scripts, objection answers, news references. |
| `/admin/sales` | `sales/index.html` | Pitch view: Sales Automation. |
| `/admin/support` | `support/index.html` | Pitch view: AI &amp; Automation. |
| `/admin/data` | `data/index.html` | Pitch view: CRM &amp; Integration. |
| `/admin/marketing` | `marketing/index.html` | Pitch view: Marketing. |
| `/admin/scheduling` | `scheduling/index.html` | Pitch view: Scheduling. |
| `/admin/projects` | `projects/index.html` | Pitch view: Project Management. |
| `/admin/impact` | `impact/index.html` | Pitch view: Business Impact summary. |

Old `/backend/*.html` URLs still work — they are redirect stubs that send the user to the matching `/admin/*` clean URL. Kept so bookmarks and older email links don't break.

---

## Authentication

One unified password for every admin page.

- **Stored as:** `ADMIN_PASSWORD` secret in Supabase → Edge Functions → Secrets
- **Validated by:** the `chat` edge function's `admin_login` action (server-side check)
- **Session flag:** `sessionStorage.ae_staff = '1'`
- **Reused password:** `sessionStorage.ae_chat_admin_pw` (so `/admin/chat` can call admin actions without prompting again)
- **Sign out:** clears both keys and sends to `/admin/login`

The previous hardcoded password in `auth.js` is gone. The Supabase service_role key never touches the browser.

### To change the password

1. Open https://supabase.com/dashboard/project/useohuvyxzshmskjngpo/functions/secrets
2. Edit the `ADMIN_PASSWORD` secret
3. All admin pages use the new value immediately on next sign-in

---

## Sidebar — identical across every page

Every admin page ships the exact same sidebar. Do not add per-page nav items. If a new page gets added, update every admin page in lockstep.

```
Tools
├── Dashboard             → /admin
├── Live Chat             → /admin/chat
├── Visitor Intelligence  → /admin/visitors   (New badge)
├── SEO & Site Health     → /admin/seo
└── AI Skills             → /admin/skills

Pitch Views
├── AI & Automation       → /admin/support
├── CRM & Integration     → /admin/data
└── Sales Automation      → /admin/sales

Footer
├── Live Site             → /
└── Sign Out              (clears session, goes to /admin/login)
```

**No sidebar link goes to a `/services/*` page.** Frontend service pages are for customers; admin is internal-only.

---

## Folder structure

```
admin/
├── README.md              ← this file
├── admin.css              ← shared stylesheet (dark + light theme vars)
├── auth.js                ← session + login helper (AEAuth)
├── index.html             ← /admin (landing dashboard)
├── login/
│   └── index.html         ← /admin/login
├── chat/
│   ├── index.html         ← /admin/chat (live chat admin)
│   └── manifest.json      ← PWA manifest for "add to home screen"
├── visitors/index.html
├── seo/index.html
├── skills/index.html
├── sales/index.html
├── support/index.html
├── data/index.html
├── marketing/index.html
├── scheduling/index.html
├── projects/index.html
└── impact/index.html
```

### Shared assets

- **`admin.css`** — all admin styling. CSS variables handle dark / light themes. Always link with `?v=N` cache-bust when changed.
- **`auth.js`** — `AEAuth.check()`, `AEAuth.login(pw)`, `AEAuth.logout()`, `AEAuth.getPassword()`. Every admin page includes this.

---

## How data flows

```
┌────────────────────────────────────────────────────────────────┐
│ Browser (staff user)                                           │
│ • /admin/chat, /admin/visitors, etc.                           │
└────────────────┬───────────────────────────────────────────────┘
                 │  HTTPS POST (password in body)
                 ▼
┌────────────────────────────────────────────────────────────────┐
│ Supabase Edge Functions                                        │
│ • /functions/v1/chat   ← reply to chats, file uploads, admin   │
│ • /functions/v1/track  ← visitor tracking beacon               │
│ • /functions/v1/dashboard ← legacy dashboard data              │
└────────────────┬───────────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────────────┐
│ Supabase Postgres                                              │
│ • chat_conversations / chat_messages                           │
│ • visitor_sessions / page_views                                │
│ • Storage bucket: chat-files                                   │
└────────────────────────────────────────────────────────────────┘
```

---

## Adding a new admin page

1. Copy `admin/visitors/index.html` as a template (sidebar + topbar + `AEAuth.check()` are already wired).
2. Rename the folder and update the breadcrumb in the topbar.
3. Add a link to the sidebar nav in **every** other admin page (keep them identical — see `/admin/README.md` rule above).
4. Link the new sidebar entry in this README's "Page map" and "Sidebar" sections.

---

## What NOT to put here

- Any content shown to the public (visitors, prospects, search engines) — that belongs at the site root or under `/services`, `/resources`, `/results`.
- Links from admin sidebars to `/services/*` or other frontend pages. If you need to demo a service, use the internal `/admin/*` Pitch View equivalent instead.
- Passwords or API keys in the HTML/JS source. All secrets live in Supabase env vars.

---

## Related docs

- Chatbot architecture: [`/chatbot/README.md`](../chatbot/README.md)
- Backend edge function code: [`/supabase/functions/chat/index.ts`](../supabase/functions/chat/index.ts)
- SQL schema: [`/chatbot/backend/migration.sql`](../chatbot/backend/migration.sql)
