# Autoeight Chatbot

Custom AI chatbot for autoeight.ai with human handoff. Built on Supabase, Anthropic Claude, and native HTML/CSS/JS — no third-party SaaS, no monthly per-seat fees.

## What it does

- Floating chat widget on every page of autoeight.ai
- AI bot (Claude Haiku) trained on the full Autoeight knowledge base
- "Talk to a human" button that notifies Adam via email, push, or Telegram
- Admin dashboard at `/backend/chat-admin.html` to review conversations and reply
- Can be installed on Adam's phone as a PWA so he can reply from the home screen
- All conversations stored in Supabase for review and training

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  autoeight.ai (every page)                              │
│  ├─ chat-widget.js (loaded via <script> in includes.js) │
│  └─ Floating button + chat panel                        │
└──────────┬──────────────────────────────────────────────┘
           │ POST /chat
           ▼
┌─────────────────────────────────────────────────────────┐
│  Supabase Edge Function: /chat                          │
│  ├─ Stores messages in chat_messages table              │
│  ├─ Calls Anthropic API for AI responses                │
│  ├─ Handles "request human" action                      │
│  └─ Sends notifications (email, Pushover, Telegram)     │
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
├── knowledge-base.md               # All Autoeight info the AI uses
├── config/
│   └── system-prompt.md            # Bot personality and behaviour rules
├── backend/
│   ├── migration.sql               # Supabase schema
│   └── chat-function.ts            # Edge function (AI + notifications)
├── widget/
│   └── chat-widget.js              # Client-side chat widget
└── admin/                          # (admin page lives at /backend/chat-admin.html)
```

---

## Setup steps

Follow these in order. Total time: about 45 minutes.

### 1. Anthropic API key
1. Go to https://console.anthropic.com
2. Sign up / sign in
3. Create an API key → copy it
4. Add £5 credit (covers thousands of chat conversations)

### 2. Resend for email notifications (free tier)
1. Go to https://resend.com
2. Sign up with alfie@autoeight.ai
3. Verify your domain `autoeight.ai` (add DNS records they provide)
4. Create an API key → copy it

### 3. (Optional) Pushover for push notifications to your phone
1. Download "Pushover" app from App Store / Play Store (£4.99 one-off)
2. Sign up at https://pushover.net
3. Create an application called "Autoeight Chat"
4. Copy the **User Key** (under your name) and **API Token** (under the app)

### 4. (Optional, free) Telegram bot for instant notifications
1. Open Telegram, search for `@BotFather`
2. Send `/newbot` and follow prompts to create "Autoeight Chat Bot"
3. Copy the bot token
4. Send any message to your new bot
5. Visit `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates`
6. Find your chat ID in the response (`"chat":{"id":123456789`)

### 5. Apply the Supabase migration
1. Log into your Supabase dashboard
2. Go to SQL Editor → new query
3. Paste the contents of `chatbot/backend/migration.sql`
4. Run

### 6. Set environment variables in Supabase
Supabase dashboard → Edge Functions → Settings → Secrets. Add these:

| Variable | Value |
|---|---|
| `ANTHROPIC_API_KEY` | From step 1 |
| `RESEND_API_KEY` | From step 2 |
| `NOTIFY_EMAIL` | `alfie@autoeight.ai` |
| `PUSHOVER_TOKEN` | From step 3 (optional) |
| `PUSHOVER_USER` | From step 3 (optional) |
| `TELEGRAM_BOT_TOKEN` | From step 4 (optional) |
| `TELEGRAM_CHAT_ID` | From step 4 (optional) |
| `KB_CONTENT` | Paste the full contents of `chatbot/knowledge-base.md` |
| `SYSTEM_PROMPT` | Paste the full contents of `chatbot/config/system-prompt.md` |

### 7. Deploy the edge function
Using the Supabase CLI:
```bash
cd "C:\Users\ad504\Documents\VS Code Websites\Autoeight V2"

# Copy the function file into the supabase functions folder
cp chatbot/backend/chat-function.ts supabase/functions/chat/index.ts

# Deploy (you'll be prompted to log in first time)
supabase functions deploy chat
```

If you don't have the Supabase CLI:
1. Install: `npm install -g supabase` (or follow [instructions](https://supabase.com/docs/guides/cli))
2. Log in: `supabase login`
3. Link project: `supabase link --project-ref useohuvyxzshmskjngpo`

### 8. Add the widget to the site
Add this line to `includes.js` (or directly to each page if you prefer):

```html
<script src="/chatbot/widget/chat-widget.js" defer></script>
```

### 9. Install the admin as a PWA on your phone
1. Open `https://autoeight.ai/backend/chat-admin.html` in Safari (iPhone) or Chrome (Android)
2. Sign in with your Supabase `service_role` key from the dashboard (Settings → API)
3. **iPhone:** tap the Share button → "Add to Home Screen"
4. **Android:** tap the ⋮ menu → "Install app" or "Add to Home Screen"
5. You now have an "Autoeight Chat" icon on your phone home screen

### 10. Test it
1. Open autoeight.ai in an incognito window
2. Click the chat button in the bottom-right corner
3. Ask "How much does a website cost?" — should get an AI reply
4. Click "Talk to a human" → enter a name and email → submit
5. Check:
   - Email arrives at alfie@autoeight.ai
   - Pushover/Telegram notifications fire if configured
   - Conversation appears in `/backend/chat-admin.html` marked "waiting"
6. Reply from the admin page → message appears in the visitor chat

---

## How to update the bot's knowledge

When you want the bot to know about new services, case studies, or policies:

1. Edit `chatbot/knowledge-base.md`
2. Copy the new contents into the `KB_CONTENT` environment variable in Supabase
3. No redeploy needed — the edge function reads the env var on every request

## How to change the bot's personality/behaviour

1. Edit `chatbot/config/system-prompt.md`
2. Update `SYSTEM_PROMPT` env var in Supabase

## Costs

| Item | Cost |
|---|---|
| Anthropic API (Claude Haiku) | ~£0.01 per conversation (£1 = 100 chats) |
| Supabase | Free tier handles 500+ chats/day |
| Resend email | Free tier 100 emails/day |
| Pushover | £4.99 one-off (optional) |
| Telegram | Free (optional) |
| **Total typical month** | **£5-15** depending on chat volume |

## Troubleshooting

**Widget doesn't appear**
- Check browser console for errors
- Verify `/chatbot/widget/chat-widget.js` is loaded (Network tab)
- Clear cache / hard refresh

**AI returns errors**
- Check Anthropic API key is set in Supabase env
- Check you have Anthropic credit (console.anthropic.com → Billing)
- Check function logs: Supabase dashboard → Edge Functions → chat → Logs

**No email notifications when "Talk to a human" clicked**
- Check Resend API key is set
- Check `autoeight.ai` domain is verified in Resend
- Check function logs for errors

**Admin page won't load conversations**
- The admin page uses the Supabase `service_role` key (not anon key)
- Get it from: Supabase dashboard → Settings → API → service_role (secret)
- Paste it into the admin login

---

## Future improvements

- Add typing indicator when human is typing
- Add file upload support
- Add conversation export to CSV
- Add pre-chat form (company name, industry)
- Add conversation rating after close
- Route to different humans based on topic
- Train a fine-tuned model on resolved conversations
