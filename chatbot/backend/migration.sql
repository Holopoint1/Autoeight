-- ============================================================
-- Autoeight Chatbot — Supabase schema
-- ============================================================
-- Apply this once in the Supabase SQL editor or via the CLI.
-- After this runs, deploy the /chat edge function.

-- Conversations: one per visitor chat session
CREATE TABLE IF NOT EXISTS chat_conversations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id        TEXT,                      -- browser fingerprint or anon id
  visitor_email     TEXT,                      -- optional
  visitor_name      TEXT,                      -- collected at start of chat
  visitor_company   TEXT,                      -- collected at start of chat
  started_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status            TEXT NOT NULL DEFAULT 'ai',       -- 'ai' | 'waiting_human' | 'human_active' | 'closed'
  requested_human_at TIMESTAMPTZ,
  page_url          TEXT,                      -- where the chat started
  user_agent        TEXT,
  notes             TEXT                       -- admin notes
);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_status ON chat_conversations(status);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_last_message ON chat_conversations(last_message_at DESC);

-- Messages: every message in a conversation
CREATE TABLE IF NOT EXISTS chat_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role            TEXT NOT NULL,           -- 'user' | 'assistant' | 'human'
  content         TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id, created_at);

-- RLS: lock everything down. Only the service role key (used by edge functions) can touch this data.
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- No public access policies. Edge function uses service_role which bypasses RLS.
-- The admin page uses a separate bearer token (ADMIN_TOKEN env var).
