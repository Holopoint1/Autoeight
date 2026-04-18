// ============================================================
// Autoeight Chat Widget
// ============================================================
// Floating chat widget that loads on every page.
// Connects to the /chat Supabase edge function.

(function () {
  // Don't load on backend/admin pages
  if (location.pathname.includes('/backend/') || location.pathname.includes('chat-admin')) return;

  const CHAT_ENDPOINT = 'https://useohuvyxzshmskjngpo.supabase.co/functions/v1/chat';
  const STORAGE_KEY = 'ae_chat_conversation';

  // ── Styles ──
  const styles = `
    .ae-chat-launcher {
      position: fixed; bottom: 24px; right: 24px; z-index: 9998;
      width: 56px; height: 56px; border-radius: 50%;
      background: linear-gradient(135deg, #7c5cfc, #6d4de6);
      box-shadow: 0 12px 32px rgba(109, 77, 230, 0.4);
      border: 0; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: 1.4rem;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .ae-chat-launcher:hover { transform: scale(1.05); box-shadow: 0 16px 40px rgba(109, 77, 230, 0.5); }
    .ae-chat-launcher.open { transform: rotate(90deg); }
    .ae-chat-dot {
      position: absolute; top: 6px; right: 6px;
      width: 10px; height: 10px; border-radius: 50%;
      background: #4ade80; border: 2px solid #fff;
    }

    .ae-chat-panel {
      position: fixed; bottom: 92px; right: 24px; z-index: 9999;
      width: 380px; max-width: calc(100vw - 32px);
      height: 560px; max-height: calc(100vh - 120px);
      background: #ffffff;
      border-radius: 18px;
      box-shadow: 0 24px 80px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05);
      display: none; flex-direction: column;
      overflow: hidden;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      animation: ae-chat-in 0.25s ease;
    }
    .ae-chat-panel.open { display: flex; }
    @keyframes ae-chat-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }

    .ae-chat-header {
      padding: 16px 20px;
      background: linear-gradient(135deg, #7c5cfc, #6d4de6);
      color: #fff;
      display: flex; align-items: center; gap: 12px;
    }
    .ae-chat-header .avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: rgba(255,255,255,0.2);
      display: grid; place-items: center;
      font-size: 0.95rem;
    }
    .ae-chat-header .title { font-size: 0.95rem; font-weight: 700; }
    .ae-chat-header .subtitle { font-size: 0.72rem; opacity: 0.85; margin-top: 2px; }

    .ae-chat-messages {
      flex: 1; overflow-y: auto;
      padding: 20px 16px;
      background: #f7f7fa;
      display: flex; flex-direction: column; gap: 10px;
    }
    .ae-chat-messages::-webkit-scrollbar { width: 5px; }
    .ae-chat-messages::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 3px; }

    .ae-msg {
      max-width: 80%; padding: 10px 14px; border-radius: 14px;
      font-size: 0.88rem; line-height: 1.5;
      word-wrap: break-word;
    }
    .ae-msg.user {
      align-self: flex-end;
      background: linear-gradient(135deg, #7c5cfc, #6d4de6);
      color: #fff;
      border-bottom-right-radius: 4px;
    }
    .ae-msg.assistant, .ae-msg.human {
      align-self: flex-start;
      background: #fff;
      color: #1a1a2e;
      border: 1px solid rgba(0,0,0,0.06);
      border-bottom-left-radius: 4px;
    }
    .ae-msg.human { border-left: 3px solid #4ade80; }
    .ae-msg.system {
      align-self: center;
      background: rgba(124,92,252,0.08);
      color: #6d4de6;
      font-size: 0.78rem;
      padding: 8px 14px;
    }

    .ae-typing {
      align-self: flex-start;
      background: #fff; border: 1px solid rgba(0,0,0,0.06);
      padding: 14px 16px; border-radius: 14px;
      display: none;
    }
    .ae-typing.show { display: block; }
    .ae-typing span {
      display: inline-block; width: 6px; height: 6px; border-radius: 50%;
      background: #999; margin: 0 2px;
      animation: ae-dot 1.4s infinite ease-in-out;
    }
    .ae-typing span:nth-child(1) { animation-delay: 0s; }
    .ae-typing span:nth-child(2) { animation-delay: 0.2s; }
    .ae-typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes ae-dot { 0%,60%,100% { transform: scale(0.6); opacity: 0.4; } 30% { transform: scale(1); opacity: 1; } }

    .ae-chat-actions {
      padding: 0 16px 8px;
      background: #f7f7fa;
    }
    .ae-chat-human-btn {
      width: 100%; padding: 10px;
      background: rgba(124,92,252,0.08);
      border: 1px solid rgba(124,92,252,0.2);
      border-radius: 10px;
      color: #6d4de6; font-size: 0.82rem; font-weight: 600;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      transition: background 0.15s;
    }
    .ae-chat-human-btn:hover { background: rgba(124,92,252,0.15); }
    .ae-chat-human-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .ae-chat-input-wrap {
      padding: 12px 16px 16px;
      background: #fff;
      border-top: 1px solid rgba(0,0,0,0.06);
      display: flex; gap: 8px; align-items: flex-end;
    }
    .ae-chat-input {
      flex: 1;
      border: 1px solid rgba(0,0,0,0.1);
      border-radius: 12px;
      padding: 10px 14px;
      font-family: inherit; font-size: 0.88rem;
      resize: none; outline: none;
      max-height: 100px;
      min-height: 40px;
      line-height: 1.4;
    }
    .ae-chat-input:focus { border-color: #7c5cfc; box-shadow: 0 0 0 3px rgba(124,92,252,0.1); }
    .ae-chat-send {
      width: 40px; height: 40px; border-radius: 50%;
      background: linear-gradient(135deg, #7c5cfc, #6d4de6);
      border: 0; color: #fff; cursor: pointer;
      display: grid; place-items: center;
      flex-shrink: 0;
    }
    .ae-chat-send:disabled { opacity: 0.4; cursor: not-allowed; }

    .ae-human-modal {
      position: absolute; inset: 0; z-index: 10;
      background: rgba(255,255,255,0.95);
      backdrop-filter: blur(8px);
      display: none; flex-direction: column; justify-content: center;
      padding: 28px 24px;
    }
    .ae-human-modal.open { display: flex; }
    .ae-human-modal h3 { font-size: 1.05rem; font-weight: 700; margin-bottom: 6px; color: #1a1a2e; }
    .ae-human-modal p { font-size: 0.85rem; color: #52525b; margin-bottom: 20px; line-height: 1.5; }
    .ae-human-modal input {
      width: 100%; padding: 10px 14px; margin-bottom: 10px;
      border: 1px solid rgba(0,0,0,0.12); border-radius: 10px;
      font-family: inherit; font-size: 0.88rem; outline: none;
    }
    .ae-human-modal input:focus { border-color: #7c5cfc; }
    .ae-human-modal .btns { display: flex; gap: 8px; margin-top: 10px; }
    .ae-human-modal button {
      flex: 1; padding: 11px; border-radius: 10px; cursor: pointer;
      font-family: inherit; font-size: 0.88rem; font-weight: 600; border: 0;
    }
    .ae-human-modal .btn-primary { background: linear-gradient(135deg, #7c5cfc, #6d4de6); color: #fff; }
    .ae-human-modal .btn-ghost { background: transparent; color: #52525b; border: 1px solid rgba(0,0,0,0.12); }

    @media (max-width: 480px) {
      .ae-chat-panel {
        width: calc(100vw - 16px);
        right: 8px; bottom: 80px;
        height: calc(100vh - 100px);
      }
      .ae-chat-launcher { right: 16px; bottom: 16px; }
    }
  `;

  // ── Build widget ──
  const styleEl = document.createElement('style');
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);

  const launcher = document.createElement('button');
  launcher.className = 'ae-chat-launcher';
  launcher.setAttribute('aria-label', 'Open chat');
  launcher.innerHTML = '<i class="fa-solid fa-comment-dots"></i><span class="ae-chat-dot"></span>';
  document.body.appendChild(launcher);

  const panel = document.createElement('div');
  panel.className = 'ae-chat-panel';
  panel.innerHTML = `
    <div class="ae-chat-header">
      <div class="avatar"><i class="fa-solid fa-bolt"></i></div>
      <div>
        <div class="title">Autoeight Assistant</div>
        <div class="subtitle">Ask anything. Or tap below to reach Adam.</div>
      </div>
    </div>
    <div class="ae-chat-messages" id="ae-chat-messages">
      <div class="ae-typing" id="ae-typing"><span></span><span></span><span></span></div>
    </div>
    <div class="ae-chat-actions">
      <button class="ae-chat-human-btn" id="ae-chat-human-btn">
        <i class="fa-solid fa-user-headset" style="font-size:0.78rem;"></i> Talk to a human
      </button>
    </div>
    <div class="ae-chat-input-wrap">
      <textarea class="ae-chat-input" id="ae-chat-input" placeholder="Type your message..." rows="1"></textarea>
      <button class="ae-chat-send" id="ae-chat-send" aria-label="Send"><i class="fa-solid fa-arrow-up"></i></button>
    </div>

    <div class="ae-human-modal" id="ae-human-modal">
      <h3>Connect with Adam</h3>
      <p>Drop your name and email so he can reply. He usually responds within one working day.</p>
      <input id="ae-human-name" placeholder="Your name" />
      <input id="ae-human-email" type="email" placeholder="Your email" />
      <div class="btns">
        <button class="btn-ghost" id="ae-human-cancel">Cancel</button>
        <button class="btn-primary" id="ae-human-submit">Connect me</button>
      </div>
    </div>
  `;
  document.body.appendChild(panel);

  // ── State ──
  let conversationId = localStorage.getItem(STORAGE_KEY) || null;
  let sending = false;
  let status = 'ai';

  const messagesEl = document.getElementById('ae-chat-messages');
  const typingEl = document.getElementById('ae-typing');
  const inputEl = document.getElementById('ae-chat-input');
  const sendBtn = document.getElementById('ae-chat-send');
  const humanBtn = document.getElementById('ae-chat-human-btn');
  const humanModal = document.getElementById('ae-human-modal');

  // ── Helpers ──
  function addMessage(role, content) {
    const el = document.createElement('div');
    el.className = 'ae-msg ' + role;
    el.textContent = content;
    messagesEl.insertBefore(el, typingEl);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function showTyping() { typingEl.classList.add('show'); messagesEl.scrollTop = messagesEl.scrollHeight; }
  function hideTyping() { typingEl.classList.remove('show'); }

  async function apiCall(payload) {
    const res = await fetch(CHAT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  }

  async function loadHistory() {
    if (!conversationId) {
      addMessage('assistant', "Hi, I'm the Autoeight assistant. I can answer questions about our services, process, case studies, or pricing. What can I help with?");
      return;
    }
    try {
      const data = await apiCall({ action: 'history', conversation_id: conversationId });
      if (data.messages && data.messages.length > 0) {
        data.messages.forEach((m) => addMessage(m.role, m.content));
      } else {
        addMessage('assistant', "Hi, welcome back. What can I help with?");
      }
    } catch (e) {
      addMessage('assistant', "Hi, I'm the Autoeight assistant. What can I help with?");
    }
  }

  async function sendMessage(text) {
    if (!text.trim() || sending) return;
    sending = true;
    sendBtn.disabled = true;
    addMessage('user', text);
    inputEl.value = '';
    inputEl.style.height = 'auto';
    showTyping();

    try {
      const data = await apiCall({
        action: 'message',
        conversation_id: conversationId,
        visitor_id: getVisitorId(),
        message: text,
        page_url: location.href,
        user_agent: navigator.userAgent,
      });

      hideTyping();

      if (data.conversation_id) {
        conversationId = data.conversation_id;
        localStorage.setItem(STORAGE_KEY, conversationId);
      }
      if (data.status) status = data.status;

      if (data.reply) {
        addMessage('assistant', data.reply);
      } else if (status === 'waiting_human' || status === 'human_active') {
        addMessage('system', "Adam will pick this up shortly.");
      }
    } catch (e) {
      hideTyping();
      addMessage('assistant', "Sorry, something went wrong. Try the 'Talk to a human' button above.");
    } finally {
      sending = false;
      sendBtn.disabled = false;
      inputEl.focus();
    }
  }

  function getVisitorId() {
    let id = localStorage.getItem('ae_visitor_id');
    if (!id) {
      id = 'v_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem('ae_visitor_id', id);
    }
    return id;
  }

  // ── Event handlers ──
  launcher.addEventListener('click', async () => {
    const isOpen = panel.classList.toggle('open');
    launcher.classList.toggle('open', isOpen);
    launcher.innerHTML = isOpen
      ? '<i class="fa-solid fa-xmark"></i>'
      : '<i class="fa-solid fa-comment-dots"></i><span class="ae-chat-dot"></span>';
    if (isOpen && messagesEl.children.length <= 1) {
      await loadHistory();
    }
  });

  sendBtn.addEventListener('click', () => sendMessage(inputEl.value));
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(inputEl.value); }
  });
  inputEl.addEventListener('input', () => {
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 100) + 'px';
  });

  humanBtn.addEventListener('click', () => humanModal.classList.add('open'));
  document.getElementById('ae-human-cancel').addEventListener('click', () => humanModal.classList.remove('open'));
  document.getElementById('ae-human-submit').addEventListener('click', async () => {
    const name = document.getElementById('ae-human-name').value.trim();
    const email = document.getElementById('ae-human-email').value.trim();
    if (!email) { alert('Please add your email so Adam can reply.'); return; }
    if (!conversationId) { await sendMessage('Hi, I would like to talk to someone.'); }
    humanModal.classList.remove('open');
    humanBtn.disabled = true;
    humanBtn.innerHTML = '<i class="fa-solid fa-check"></i> Adam has been notified';
    try {
      await apiCall({
        action: 'request_human',
        conversation_id: conversationId,
        name, email,
      });
      addMessage('system', 'Adam has been notified. He will reply here shortly.');
    } catch (e) {
      addMessage('system', 'Something went wrong. Email alfie@autoeight.ai directly.');
    }
  });
})();
