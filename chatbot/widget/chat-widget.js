// ============================================================
// Autoeight Chat Widget — free version (no AI)
// ============================================================
// Flow: lead form (name*, company*, email optional) -> chat.

(function () {
  // Don't load on backend/admin pages
  if (location.pathname.includes('/backend/') || location.pathname.includes('chat-admin')) return;

  const CHAT_ENDPOINT = 'https://useohuvyxzshmskjngpo.supabase.co/functions/v1/chat';
  const STORAGE_KEY = 'ae_chat_conversation';
  const LEAD_KEY = 'ae_chat_lead';
  const DISMISS_KEY = 'ae_chat_dismissed';

  // Track whether the widget was dismissed for this session — hide UI but keep API available
  const wasDismissed = sessionStorage.getItem(DISMISS_KEY) === '1';

  // ── Styles ──
  const styles = `
    .ae-chat-wrap {
      position: fixed; bottom: 24px; right: 24px; z-index: 9998;
      display: flex; flex-direction: column; align-items: flex-end; gap: 8px;
    }
    .ae-chat-launcher {
      width: 56px; height: 56px; border-radius: 50%;
      background: linear-gradient(135deg, #7c5cfc, #6d4de6);
      box-shadow: 0 12px 32px rgba(109, 77, 230, 0.4);
      border: 0; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: 1.4rem;
      position: relative;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .ae-chat-launcher:hover { transform: scale(1.05); box-shadow: 0 16px 40px rgba(109, 77, 230, 0.5); }
    .ae-chat-launcher.open { transform: rotate(90deg); }
    .ae-chat-dot {
      position: absolute; top: 6px; right: 6px;
      width: 10px; height: 10px; border-radius: 50%;
      background: #4ade80; border: 2px solid #fff;
    }
    .ae-chat-dismiss {
      width: 22px; height: 22px; border-radius: 50%;
      background: rgba(30, 30, 40, 0.65);
      backdrop-filter: blur(6px);
      border: 0; cursor: pointer;
      color: #fff; font-size: 0.7rem;
      display: grid; place-items: center;
      opacity: 0.55;
      transition: opacity 0.15s, transform 0.15s, background 0.15s;
    }
    .ae-chat-dismiss:hover { opacity: 1; transform: scale(1.08); background: rgba(30, 30, 40, 0.85); }
    .ae-chat-dismiss[title]:hover::after {
      content: attr(title);
      position: absolute; right: 32px;
      background: rgba(30,30,40,0.9); color: #fff;
      padding: 4px 8px; border-radius: 6px;
      font-size: 0.68rem; white-space: nowrap;
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

    /* ── Intro (yes/no gate) ── */
    .ae-intro {
      flex: 1; overflow-y: auto;
      padding: 28px 22px;
      background: #f7f7fa;
      display: flex; flex-direction: column; justify-content: center;
    }
    .ae-intro-bubble {
      background: #fff;
      border: 1px solid rgba(0,0,0,0.06);
      border-radius: 14px;
      padding: 16px 18px;
      font-size: 0.95rem; line-height: 1.5;
      color: #1a1a2e;
      margin-bottom: 18px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.04);
    }
    .ae-intro-buttons {
      display: flex; gap: 10px;
    }
    .ae-intro-btn {
      flex: 1; padding: 12px 16px;
      border-radius: 12px; cursor: pointer;
      font-family: inherit; font-size: 0.9rem; font-weight: 600;
      border: 0;
      transition: transform 0.15s, box-shadow 0.15s, background 0.15s;
    }
    .ae-intro-btn-yes {
      background: linear-gradient(135deg, #7c5cfc, #6d4de6);
      color: #fff;
      box-shadow: 0 6px 16px rgba(109,77,230,0.25);
    }
    .ae-intro-btn-yes:hover { transform: translateY(-1px); box-shadow: 0 10px 22px rgba(109,77,230,0.35); }
    .ae-intro-btn-no {
      background: #fff;
      color: #52525b;
      border: 1px solid rgba(0,0,0,0.12);
    }
    .ae-intro-btn-no:hover { background: #f3f3f5; }

    /* ── Lead form (gate before chat) ── */
    .ae-lead-form {
      flex: 1; overflow-y: auto;
      padding: 24px 20px;
      background: #f7f7fa;
      display: none; flex-direction: column;
    }
    .ae-lead-form.active { display: flex; }
    .ae-lead-form h3 {
      font-size: 1.05rem; font-weight: 700; color: #1a1a2e;
      margin: 0 0 6px;
    }
    .ae-lead-form p {
      font-size: 0.85rem; color: #52525b;
      margin: 0 0 20px; line-height: 1.5;
    }
    .ae-lead-field { margin-bottom: 12px; }
    .ae-lead-field label {
      display: block; font-size: 0.78rem; font-weight: 600;
      color: #1a1a2e; margin-bottom: 6px;
    }
    .ae-lead-field label .opt { color: #8b8b95; font-weight: 500; margin-left: 4px; font-size: 0.72rem; }
    .ae-lead-field input {
      width: 100%; box-sizing: border-box;
      padding: 11px 14px;
      border: 1px solid rgba(0,0,0,0.12);
      border-radius: 10px;
      background: #fff;
      font-family: inherit; font-size: 0.88rem;
      outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .ae-lead-field input:focus {
      border-color: #7c5cfc;
      box-shadow: 0 0 0 3px rgba(124,92,252,0.1);
    }
    .ae-lead-submit {
      width: 100%; padding: 12px;
      background: linear-gradient(135deg, #7c5cfc, #6d4de6);
      color: #fff; font-family: inherit;
      font-size: 0.9rem; font-weight: 600;
      border: 0; border-radius: 12px;
      cursor: pointer;
      margin-top: 8px;
      box-shadow: 0 8px 20px rgba(109,77,230,0.25);
      transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
    }
    .ae-lead-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 12px 24px rgba(109,77,230,0.35); }
    .ae-lead-submit:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }
    .ae-lead-note {
      font-size: 0.72rem; color: #8b8b95;
      text-align: center; margin-top: 14px;
    }

    /* ── Chat view (shown after lead submitted) ── */
    .ae-chat-body { flex: 1; display: none; flex-direction: column; min-height: 0; }
    .ae-chat-body.active { display: flex; }

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
      white-space: pre-wrap;
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
      text-align: center;
    }
    .ae-msg a { color: inherit; text-decoration: underline; }

    .ae-waiting {
      align-self: center;
      display: flex; align-items: center; gap: 10px;
      background: rgba(124,92,252,0.08);
      color: #6d4de6;
      padding: 10px 16px;
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 500;
    }
    .ae-spinner {
      width: 14px; height: 14px;
      border: 2px solid rgba(124,92,252,0.25);
      border-top-color: #6d4de6;
      border-radius: 50%;
      animation: ae-spin 0.8s linear infinite;
    }
    @keyframes ae-spin { to { transform: rotate(360deg); } }

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
    .ae-chat-input:disabled { background: #f5f5f7; cursor: not-allowed; }
    .ae-chat-send {
      width: 40px; height: 40px; border-radius: 50%;
      background: linear-gradient(135deg, #7c5cfc, #6d4de6);
      border: 0; color: #fff; cursor: pointer;
      display: grid; place-items: center;
      flex-shrink: 0;
    }
    .ae-chat-send:disabled { opacity: 0.4; cursor: not-allowed; }

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

  const wrap = document.createElement('div');
  wrap.className = 'ae-chat-wrap';

  const dismissBtn = document.createElement('button');
  dismissBtn.className = 'ae-chat-dismiss';
  dismissBtn.setAttribute('aria-label', 'Dismiss chat');
  dismissBtn.setAttribute('title', 'Hide chat');
  dismissBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
  wrap.appendChild(dismissBtn);

  const launcher = document.createElement('button');
  launcher.className = 'ae-chat-launcher';
  launcher.setAttribute('aria-label', 'Open chat');
  launcher.innerHTML = '<i class="fa-solid fa-comment-dots"></i><span class="ae-chat-dot"></span>';
  wrap.appendChild(launcher);
  document.body.appendChild(wrap);

  // If dismissed this session, hide the floating UI until AE_CHAT_OPEN is called
  if (wasDismissed) wrap.style.display = 'none';

  const panel = document.createElement('div');
  panel.className = 'ae-chat-panel';
  panel.innerHTML = `
    <div class="ae-chat-header">
      <div class="avatar"><i class="fa-solid fa-bolt"></i></div>
      <div>
        <div class="title">Connect with us</div>
        <div class="subtitle">Usually replies within a working day</div>
      </div>
    </div>

    <div class="ae-intro" id="ae-intro">
      <div class="ae-intro-bubble">
        Hi! Would you like to speak to a human from the Autoeight team?
      </div>
      <div class="ae-intro-buttons">
        <button class="ae-intro-btn ae-intro-btn-no" id="ae-intro-no">No thanks</button>
        <button class="ae-intro-btn ae-intro-btn-yes" id="ae-intro-yes">Yes please</button>
      </div>
    </div>

    <div class="ae-lead-form" id="ae-lead-form">
      <h3>Let's get started</h3>
      <p>Drop your details and we'll start a live chat. We'll reply on-screen, and if you leave we'll email you back.</p>
      <div class="ae-lead-field">
        <label for="ae-lead-name">Your name</label>
        <input id="ae-lead-name" type="text" autocomplete="name" placeholder="Jane Smith" />
      </div>
      <div class="ae-lead-field">
        <label for="ae-lead-company">Your company</label>
        <input id="ae-lead-company" type="text" autocomplete="organization" placeholder="Acme Ltd" />
      </div>
      <div class="ae-lead-field">
        <label for="ae-lead-email">Your email <span class="opt">(optional)</span></label>
        <input id="ae-lead-email" type="email" autocomplete="email" placeholder="jane@acme.com" />
      </div>
      <button class="ae-lead-submit" id="ae-lead-submit" disabled>Start chat</button>
      <div class="ae-lead-note">Your details stay private. We use them only to reply.</div>
    </div>

    <div class="ae-chat-body" id="ae-chat-body">
      <div class="ae-chat-messages" id="ae-chat-messages"></div>
      <div class="ae-chat-input-wrap">
        <textarea class="ae-chat-input" id="ae-chat-input" placeholder="Type your message..." rows="1"></textarea>
        <button class="ae-chat-send" id="ae-chat-send" aria-label="Send"><i class="fa-solid fa-arrow-up"></i></button>
      </div>
    </div>
  `;
  document.body.appendChild(panel);

  // ── State ──
  // Stages: 'intro' (yes/no), 'lead' (form), 'first_message' (gated chat waiting for first msg), 'live' (ongoing)
  let stage = 'intro';
  let lead = loadLead();
  let conversationId = localStorage.getItem(STORAGE_KEY) || null;
  let sending = false;
  let pollTimer = null;
  let lastMessageTs = null;

  const intro = document.getElementById('ae-intro');
  const introYesBtn = document.getElementById('ae-intro-yes');
  const introNoBtn = document.getElementById('ae-intro-no');
  const leadForm = document.getElementById('ae-lead-form');
  const leadNameEl = document.getElementById('ae-lead-name');
  const leadCompanyEl = document.getElementById('ae-lead-company');
  const leadEmailEl = document.getElementById('ae-lead-email');
  const leadSubmitBtn = document.getElementById('ae-lead-submit');

  const chatBody = document.getElementById('ae-chat-body');
  const messagesEl = document.getElementById('ae-chat-messages');
  const inputEl = document.getElementById('ae-chat-input');
  const sendBtn = document.getElementById('ae-chat-send');

  // ── Helpers ──
  function loadLead() {
    try {
      const raw = localStorage.getItem(LEAD_KEY);
      return raw ? JSON.parse(raw) : { name: '', company: '', email: '' };
    } catch (e) { return { name: '', company: '', email: '' }; }
  }

  function saveLead() {
    try { localStorage.setItem(LEAD_KEY, JSON.stringify(lead)); } catch (e) { /* ignore */ }
  }

  function addMessage(role, content) {
    const el = document.createElement('div');
    el.className = 'ae-msg ' + role;
    el.textContent = content;
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  let waitingEl = null;
  function addWaiting() {
    removeWaiting();
    waitingEl = document.createElement('div');
    waitingEl.className = 'ae-waiting';
    waitingEl.innerHTML = '<div class="ae-spinner"></div><span>Someone\'s coming to reply…</span>';
    messagesEl.appendChild(waitingEl);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }
  function removeWaiting() {
    if (waitingEl && waitingEl.parentNode) waitingEl.parentNode.removeChild(waitingEl);
    waitingEl = null;
  }

  function getVisitorId() {
    let id = localStorage.getItem('ae_visitor_id');
    if (!id) {
      id = 'v_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem('ae_visitor_id', id);
    }
    return id;
  }

  async function apiCall(payload) {
    const res = await fetch(CHAT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  }

  function showIntro() {
    intro.style.display = 'flex';
    leadForm.classList.remove('active');
    chatBody.classList.remove('active');
  }

  function showChatBody() {
    intro.style.display = 'none';
    leadForm.classList.remove('active');
    chatBody.classList.add('active');
  }

  function showLeadForm() {
    intro.style.display = 'none';
    leadForm.classList.add('active');
    chatBody.classList.remove('active');
  }

  // ── Lead form gating ──
  function validateLead() {
    const nameOk = leadNameEl.value.trim().length > 0;
    const companyOk = leadCompanyEl.value.trim().length > 0;
    leadSubmitBtn.disabled = !(nameOk && companyOk);
  }

  leadNameEl.addEventListener('input', validateLead);
  leadCompanyEl.addEventListener('input', validateLead);

  // Pre-fill if we've stored a lead previously
  if (lead.name) leadNameEl.value = lead.name;
  if (lead.company) leadCompanyEl.value = lead.company;
  if (lead.email) leadEmailEl.value = lead.email;
  validateLead();

  leadSubmitBtn.addEventListener('click', () => {
    const name = leadNameEl.value.trim();
    const company = leadCompanyEl.value.trim();
    const email = leadEmailEl.value.trim();
    if (!name || !company) { validateLead(); return; }
    lead = { name, company, email };
    saveLead();

    stage = 'first_message';
    showChatBody();
    addMessage('assistant', "Thanks, " + name + ". What can we help with? Drop as much detail as you'd like about your project, timeline or budget.");
    inputEl.focus();
  });

  // ── Chat flow ──
  async function loadHistory() {
    if (!conversationId) return;
    try {
      const data = await apiCall({ action: 'history', conversation_id: conversationId });
      if (data.messages && data.messages.length > 0) {
        messagesEl.innerHTML = '';
        data.messages.forEach((m) => {
          addMessage(m.role, m.content);
          if (m.created_at) lastMessageTs = m.created_at;
        });
      }
    } catch (e) { /* ignore */ }
  }

  function startPolling() {
    if (pollTimer) return;
    pollTimer = setInterval(async () => {
      if (!conversationId) return;
      try {
        const data = await apiCall({
          action: 'history',
          conversation_id: conversationId,
          since: lastMessageTs,
        });
        if (data.messages && data.messages.length) {
          data.messages.forEach((m) => {
            if (m.role === 'human' || m.role === 'assistant') {
              removeWaiting();
              addMessage(m.role, m.content);
            }
            if (m.created_at) lastMessageTs = m.created_at;
          });
        }
      } catch (e) { /* ignore */ }
    }, 8000);
  }

  async function handleSend(text) {
    if (!text.trim() || sending) return;
    const value = text.trim();
    inputEl.value = '';
    inputEl.style.height = 'auto';

    if (stage === 'first_message') {
      addMessage('user', value);
      sending = true;
      sendBtn.disabled = true;
      inputEl.disabled = true;

      try {
        const data = await apiCall({
          action: 'submit_lead',
          visitor_id: getVisitorId(),
          name: lead.name,
          company: lead.company,
          email: lead.email || null,
          message: value,
          page_url: location.href,
          user_agent: navigator.userAgent,
        });

        if (data.conversation_id) {
          conversationId = data.conversation_id;
          localStorage.setItem(STORAGE_KEY, conversationId);
          if (data.last_message_at) lastMessageTs = data.last_message_at;
        }

        addWaiting();

        stage = 'live';
        inputEl.disabled = false;
        inputEl.setAttribute('placeholder', 'Add another message...');
        startPolling();
      } catch (e) {
        addMessage('system', "Couldn't send that. Please email alfie@autoeight.ai directly.");
        inputEl.disabled = false;
      } finally {
        sending = false;
        sendBtn.disabled = false;
        inputEl.focus();
      }
      return;
    }

    if (stage === 'live') {
      addMessage('user', value);
      sending = true;
      sendBtn.disabled = true;
      try {
        await apiCall({
          action: 'append_message',
          conversation_id: conversationId,
          message: value,
          page_url: location.href,
        });
      } catch (e) {
        addMessage('system', "Message didn't send. Try again in a moment.");
      } finally {
        sending = false;
        sendBtn.disabled = false;
        inputEl.focus();
      }
    }
  }

  // ── Event handlers ──
  let opened = false;
  launcher.addEventListener('click', () => {
    const isOpen = panel.classList.toggle('open');
    launcher.classList.toggle('open', isOpen);
    launcher.innerHTML = isOpen
      ? '<i class="fa-solid fa-xmark"></i>'
      : '<i class="fa-solid fa-comment-dots"></i><span class="ae-chat-dot"></span>';

    if (isOpen && !opened) {
      opened = true;
      // If returning visitor with a live conversation, skip intro and resume
      if (conversationId) {
        stage = 'live';
        showChatBody();
        loadHistory();
        startPolling();
      } else {
        // Show intro (yes/no) first
        stage = 'intro';
        showIntro();
      }
    }
  });

  // Intro buttons
  introYesBtn.addEventListener('click', () => {
    stage = 'lead';
    showLeadForm();
    setTimeout(() => {
      if (!leadNameEl.value) leadNameEl.focus();
      else if (!leadCompanyEl.value) leadCompanyEl.focus();
      else leadEmailEl.focus();
    }, 150);
  });

  introNoBtn.addEventListener('click', () => {
    // Close the panel and hide the launcher for the session
    panel.classList.remove('open');
    launcher.classList.remove('open');
    launcher.innerHTML = '<i class="fa-solid fa-comment-dots"></i><span class="ae-chat-dot"></span>';
    try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch (e) { /* ignore */ }
    wrap.remove();
    panel.remove();
  });

  sendBtn.addEventListener('click', () => handleSend(inputEl.value));
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(inputEl.value); }
  });
  inputEl.addEventListener('input', () => {
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 100) + 'px';
  });

  // Allow Enter on lead form inputs to advance
  [leadNameEl, leadCompanyEl, leadEmailEl].forEach((el) => {
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (!leadSubmitBtn.disabled) leadSubmitBtn.click();
      }
    });
  });

  // Dismiss button hides the floating UI for the session (but keeps AE_CHAT_OPEN working)
  dismissBtn.addEventListener('click', () => {
    try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch (e) { /* ignore */ }
    wrap.style.display = 'none';
    panel.classList.remove('open');
  });

  // Expose a way for other page elements (e.g. "Live chat" buttons) to open the widget
  window.AE_CHAT_OPEN = function () {
    try { sessionStorage.removeItem(DISMISS_KEY); } catch (e) { /* ignore */ }
    wrap.style.display = 'flex';
    if (!panel.classList.contains('open')) {
      launcher.click();
    }
  };
})();
