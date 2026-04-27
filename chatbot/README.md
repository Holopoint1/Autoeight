# Autoeight Chat (free version)

Custom chat widget for autoeight.ai. Collects name + company + message from visitors and notifies Adam via email, Telegram, or Pushover. No AI, no per-message cost.

## What it does

- Floating chat widget on every page of autoeight.ai
- Guided flow: asks for name, company, then message
- Notifies Adam instantly (email via Resend, Telegram, Pushover)
- Admin dashboard at `/backend/chat-admin.html` to review and reply
- Can be installed on Adam's phone as a PWA so he can reply from the home screen
- All conversations stored in Supabase
- Visitor can keep sending follow-up messages; Adam's replies poll in every 8 seconds

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  autoeight.ai (every page)                              │
│  ├─ chat-widget.js (loaded via includes.js)             │
│  └─ Floating button + guided form flow                  │
└──────────┬──────────────────────────────────────────────┘
           │ POST /chat
           ▼
┌─────────────────────────────────────────────────────────┐
│  Supabase Edge Function: /chat                          │
│  ├─ submit_lead   — stores new conversation + notifies  │
│  ├─ append_message — stores follow-up + pings Adam      │
│  └─ history        — used by widget and admin polling   │
└──────────┬──────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────┐
│  Supabase Tables                                        │
│  ├─ chat_conversations (one per session)                │
│  └─ chat_messages (every message)                       │
└─────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────┐
│  Admin Dashboard: /backend/chat-admin.html              │
│  ├─ Reads conversations direct from Supabase            │
│  ├─ Adam replies as role="human"                        │
│  └─ Works as PWA on iPhone/Android                      │
└─────────────────────────────────────────────────────────┘
```

## Files

```
chatbot/
├── README.md                       # This file
├── knowledge-base.md               # Autoeight info (kept for future AI upgrade)
├── config/
│   └── system-prompt.md            # Bot personality (kept for future AI upgrade)
├── backend/
│   ├── migration.sql               # Supabase schema
│   └── chat-function.ts            # Edge function (form handler + notifications)
├── widget/
│   └── chat-widget.js              # Client-side chat widget
└── (admin page lives at /backend/chat-admin.html)
```

---

## Setup steps

Follow these in order. Total time: about 20 minutes.

### 1. Resend for email notifications (free tier)
1. Go to https://resend.com
2. Sign up with contact@autoeight.ai
3. Verify your domain `autoeight.ai` (add DNS records they provide)
4. Create an API key → copy it

### 2. (Optional) Pushover for push notifications to your phone
1. Download "Pushover" app from App Store / Play Store (£4.99 one-off)
2. Sign up at https://pushover.net
3. Create an application called "Autoeight Chat"
4. Copy the **User Key** (under your name) and **API Token** (under the app)

### 3. (Optional, free) Telegram bot for instant notifications
1. Open Telegram, search for `@BotFather`
2. Send `/newbot` and follow prompts to create "Autoeight Chat Bot"
3. Copy the bot token
4. Send any message to your new bot
5. Visit `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates`
6. Find your chat ID in the response (`"chat":{"id":123456789`)

### 4. Apply the Supabase migration
1. Log into your Supabase dashboard
2. Go to SQL Editor → new query
3. Paste the contents of `chatbot/backend/migration.sql`
4. Run

### 5. Set environment variables in Supabase
Supabase dashboard → Edge Functions → Settings → Secrets. Add these:

| Variable | Value |
|---|---|
| `RESEND_API_KEY` | From step 1 |
| `NOTIFY_EMAIL` | `contact@autoeight.ai` |
| `PUSHOVER_TOKEN` | From step 2 (optional) |
| `PUSHOVER_USER` | From step 2 (optional) |
| `TELEGRAM_BOT_TOKEN` | From step 3 (optional) |
| `TELEGRAM_CHAT_ID` | From step 3 (optional) |

> **No Anthropic API key required.** This free version has no AI — messages go straight to Adam.

### 6. Deploy the edge function
Using the Supabase CLI:
```bash
cd "C:\Users\ad504\Documents\VS Code Websites\Autoeight V2"

# Copy the function file into the supabase functions folder
cp chatbot/backend/chat-function.ts supabase/functions/chat/index.ts

# Deploy
supabase functions deploy chat
```

If you don't have the Supabase CLI:
1. Install: `npm install -g supabase`
2. Log in: `supabase login`
3. Link project: `supabase link --project-ref useohuvyxzshmskjngpo`

### 7. Confirm the widget is loaded
The widget is auto-loaded by `/includes.js` on every non-backend page. No further action needed.

### 8. Install the admin as a PWA on your phone
1. Open `https://autoeight.ai/backend/chat-admin.html` in Safari (iPhone) or Chrome (Android)
2. Sign in with your Supabase `service_role` key from the dashboard (Settings → API)
3. **iPhone:** tap the Share button → "Add to Home Screen"
4. **Android:** tap the ⋮ menu → "Install app" or "Add to Home Screen"

### 9. Test it
1. Open autoeight.ai in an incognito window
2. Click the chat button in the bottom-right corner
3. Enter a name → enter a company → type a message → send
4. Check:
   - Email arrives at contact@autoeight.ai
   - Pushover/Telegram notifications fire if configured
   - Conversation appears in `/backend/chat-admin.html` marked "waiting"
5. Reply from the admin page → message appears in the visitor chat within 8 seconds

---

## Costs

| Item | Cost |
|---|---|
| Supabase | Free tier handles 500+ chats/day |
| Resend email | Free tier 100 emails/day |
| Pushover | £4.99 one-off (optional) |
| Telegram | Free (optional) |
| **Total typical month** | **£0** |

## Upgrading to AI later

The knowledge base and system prompt files are kept in place for when you want to add an AI layer. To upgrade:

1. Add `ANTHROPIC_API_KEY`, `KB_CONTENT`, `SYSTEM_PROMPT` env vars in Supabase
2. Restore the AI branch in `chat-function.ts` (git history has the previous version)
3. Tell the widget to offer both an AI chat tab and a "talk to a human" button

Typical AI cost: ~£0.01 per conversation with Claude Haiku.

## Troubleshooting

**Widget doesn't appear**
- Check browser console for errors
- Verify `/chatbot/widget/chat-widget.js` is loaded (Network tab)
- Clear cache / hard refresh

**No email notifications**
- Check Resend API key is set in Supabase env
- Check `autoeight.ai` domain is verified in Resend
- Check function logs: Supabase dashboard → Edge Functions → chat → Logs

**Admin page won't load conversations**
- The admin page uses the Supabase `service_role` key (not anon key)
- Get it from: Supabase dashboard → Settings → API → service_role (secret)
- Paste it into the admin login
