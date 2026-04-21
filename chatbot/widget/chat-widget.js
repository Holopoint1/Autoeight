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
    .ae-chat-body { flex: 1; display: none; flex-direction: column; min-height: 0; position: relative; }
    .ae-chat-body.active { display: flex; }

    /* ── Drag-and-drop overlay ── */
    .ae-drop-overlay {
      position: absolute; inset: 0; z-index: 5;
      display: none;
      align-items: center; justify-content: center;
      flex-direction: column; gap: 8px;
      background: rgba(124,92,252,0.12);
      border: 2px dashed #7c5cfc;
      border-radius: 12px;
      margin: 8px;
      color: #6d4de6; font-weight: 600; font-size: 0.92rem;
      pointer-events: none;
    }
    .ae-chat-body.dragging .ae-drop-overlay { display: flex; }
    .ae-drop-overlay i { font-size: 2rem; }

    .ae-chat-messages {
      flex: 1; overflow-y: auto;
      padding: 20px 16px;
      background: #f7f7fa;
      display: flex; flex-direction: column; gap: 2px;
    }
    .ae-chat-messages::-webkit-scrollbar { width: 5px; }
    .ae-chat-messages::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 3px; }

    /* Label above each message so it's obvious who sent it */
    .ae-role {
      font-size: 0.78rem; font-weight: 700;
      margin: 12px 4px 4px;
      display: flex; align-items: center; gap: 8px;
    }
    .ae-role.user { align-self: flex-end; color: #6d4de6; }
    .ae-role.them { align-self: flex-start; color: #2fa96a; }
    .ae-role .ae-dot {
      display: inline-block; width: 8px; height: 8px; border-radius: 50%;
    }
    .ae-role.user .ae-dot { background: #6d4de6; box-shadow: 0 0 0 2px rgba(109,77,230,0.18); }
    .ae-role.them .ae-dot { background: #2fa96a; box-shadow: 0 0 0 2px rgba(47,169,106,0.18); }

    .ae-msg {
      max-width: 82%; padding: 10px 14px; border-radius: 14px;
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
      margin-top: 6px;
    }
    .ae-msg a { color: inherit; text-decoration: underline; }

    /* Hours banner inside chat header */
    .ae-hours {
      font-size: 0.7rem;
      opacity: 0.9;
      margin-top: 4px;
      display: inline-flex; align-items: center; gap: 6px;
    }
    .ae-hours .dot { width: 7px; height: 7px; border-radius: 50%; }
    .ae-hours.open .dot { background: #4ade80; box-shadow: 0 0 0 2px rgba(74,222,128,0.25); }
    .ae-hours.closed .dot { background: #fbbf24; box-shadow: 0 0 0 2px rgba(251,191,36,0.25); }

    /* Out-of-hours panel */
    .ae-offhours {
      flex: 1; overflow-y: auto;
      padding: 28px 24px;
      background: #f7f7fa;
      display: flex; flex-direction: column; justify-content: center;
      text-align: center;
    }
    .ae-offhours h3 {
      font-size: 1rem; font-weight: 700; color: #1a1a2e;
      margin: 0 0 8px;
    }
    .ae-offhours p {
      font-size: 0.88rem; color: #52525b;
      line-height: 1.55; margin: 0 0 14px;
    }
    .ae-offhours .hours-card {
      background: #fff;
      border: 1px solid rgba(0,0,0,0.08);
      border-radius: 12px;
      padding: 14px 16px;
      margin: 8px 0 18px;
      text-align: left;
    }
    .ae-offhours .hours-card .hrow {
      display: flex; justify-content: space-between;
      font-size: 0.82rem; color: #1a1a2e;
      padding: 3px 0;
    }
    .ae-offhours .hours-card .hrow.today { font-weight: 700; }
    .ae-offhours .hours-card .hrow span + span { color: #6b6b7c; }
    .ae-offhours .cta-book {
      display: inline-flex; align-items: center; justify-content: center;
      gap: 8px; padding: 12px 18px;
      background: linear-gradient(135deg, #7c5cfc, #6d4de6);
      color: #fff; font-size: 0.9rem; font-weight: 600;
      text-decoration: none; border-radius: 12px;
      box-shadow: 0 8px 20px rgba(109,77,230,0.25);
    }
    .ae-offhours .cta-book:hover { transform: translateY(-1px); }
    .ae-offhours .note { font-size: 0.72rem; color: #8b8b95; margin-top: 14px; }

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
    .ae-chat-attach {
      width: 40px; height: 40px; border-radius: 50%;
      background: rgba(0,0,0,0.04); color: #6d4de6;
      border: 0; cursor: pointer;
      display: grid; place-items: center; font-size: 1rem;
      flex-shrink: 0; transition: background 0.15s;
    }
    .ae-chat-attach:hover { background: rgba(124,92,252,0.12); }
    .ae-chat-attach:disabled { opacity: 0.5; cursor: not-allowed; }

    .ae-msg.user .ae-attach, .ae-msg.human .ae-attach, .ae-msg.assistant .ae-attach {
      display: flex; align-items: center; gap: 8px;
      margin-top: 6px; padding: 8px 10px;
      background: rgba(0,0,0,0.06);
      border-radius: 10px;
      color: inherit; text-decoration: none;
      font-size: 0.82rem;
    }
    .ae-msg.user .ae-attach { background: rgba(255,255,255,0.18); color: #fff; }
    .ae-msg .ae-attach-img {
      display: block; max-width: 100%; max-height: 240px;
      border-radius: 10px; margin-top: 6px;
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
        <div class="subtitle" id="ae-chat-subtitle">Mon–Fri · 9am–5pm UK time</div>
        <div class="ae-hours" id="ae-hours-status"><span class="dot"></span><span class="txt"></span></div>
      </div>
    </div>

    <div class="ae-offhours" id="ae-offhours" style="display:none;">
      <h3>We're offline right now</h3>
      <p>Our live chat is staffed <strong>Monday to Friday, 9am–5pm UK time</strong>. Leave your details on the contact form and we'll reply within one working day.</p>
      <div class="hours-card" id="ae-hours-card"></div>
      <a href="/book" class="cta-book">
        <i class="fa-solid fa-envelope-open-text"></i>
        Send us a message
      </a>
      <p class="note">Or email <a href="mailto:alfie@autoeight.ai" style="color:#6d4de6;">alfie@autoeight.ai</a> directly.</p>
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
      <div class="ae-drop-overlay" aria-hidden="true">
        <i class="fa-solid fa-cloud-arrow-up"></i>
        <span>Drop to attach</span>
      </div>
      <div class="ae-chat-messages" id="ae-chat-messages"></div>
      <div class="ae-chat-input-wrap">
        <input type="file" id="ae-chat-file" style="display:none" accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip" />
        <button class="ae-chat-attach" id="ae-chat-attach" aria-label="Attach file" title="Attach file"><i class="fa-solid fa-paperclip"></i></button>
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

  const offhoursEl = document.getElementById('ae-offhours');
  const hoursStatusEl = document.getElementById('ae-hours-status');
  const hoursCardEl = document.getElementById('ae-hours-card');
  const chatBody = document.getElementById('ae-chat-body');
  const messagesEl = document.getElementById('ae-chat-messages');
  const inputEl = document.getElementById('ae-chat-input');
  const sendBtn = document.getElementById('ae-chat-send');
  const fileInput = document.getElementById('ae-chat-file');
  const attachBtn = document.getElementById('ae-chat-attach');

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

  // Insert a role label above a new message unless the previous visible
  // message was from the same speaker (keeps consecutive replies clean).
  function maybeAddRoleLabel(role) {
    if (role === 'system') return;
    // 'human' (from Adam) and 'assistant' (bot) both appear as "Autoeight"
    // from the visitor's perspective. 'user' is "You".
    const group = (role === 'user') ? 'user' : 'them';
    const lastRow = messagesEl.lastElementChild;
    if (lastRow && lastRow.classList && lastRow.classList.contains('ae-role') && lastRow.classList.contains(group)) return;
    // Find the previous ae-msg to see who sent it
    let prev = lastRow;
    while (prev && !(prev.classList && prev.classList.contains('ae-msg'))) {
      prev = prev.previousElementSibling;
    }
    if (prev) {
      const prevGroup = prev.classList.contains('user') ? 'user' : (prev.classList.contains('system') ? 'system' : 'them');
      if (prevGroup === group) return; // same speaker, skip label
    }
    const label = document.createElement('div');
    label.className = 'ae-role ' + group;
    label.innerHTML = '<span class="ae-dot"></span>' + (group === 'user' ? 'You' : 'Autoeight');
    messagesEl.appendChild(label);
  }

  function addMessage(role, content, attachment) {
    maybeAddRoleLabel(role);
    const el = document.createElement('div');
    el.className = 'ae-msg ' + role;
    if (content) {
      const textEl = document.createElement('div');
      textEl.textContent = content;
      el.appendChild(textEl);
    }
    if (attachment && attachment.url) {
      const isImage = (attachment.type || '').startsWith('image/');
      if (isImage) {
        const img = document.createElement('img');
        img.src = attachment.url;
        img.alt = attachment.name || 'attachment';
        img.className = 'ae-attach-img';
        img.loading = 'lazy';
        el.appendChild(img);
      } else {
        const link = document.createElement('a');
        link.href = attachment.url;
        link.target = '_blank';
        link.rel = 'noopener';
        link.className = 'ae-attach';
        link.innerHTML = '<i class="fa-solid fa-paperclip"></i><span></span>';
        link.querySelector('span').textContent = attachment.name || 'attachment';
        el.appendChild(link);
      }
    }
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

  // ── Working hours: Mon–Fri 09:00–17:00 UK time ──
  const HOURS = {
    tz: 'Europe/London',
    days: [1, 2, 3, 4, 5], // 0=Sun ... 6=Sat → Mon-Fri
    openHour: 9,
    closeHour: 17, // exclusive: 17:00 means closes at 5pm sharp
  };
  function ukNow() {
    const fmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: HOURS.tz, weekday: 'short', hour: '2-digit', hour12: false, minute: '2-digit',
    });
    const parts = fmt.formatToParts(new Date());
    const map = {};
    parts.forEach((p) => { map[p.type] = p.value; });
    const dayIdx = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(map.weekday);
    return { dayIdx, hour: parseInt(map.hour, 10), minute: parseInt(map.minute, 10) };
  }
  function isWorkingHours() {
    const n = ukNow();
    if (!HOURS.days.includes(n.dayIdx)) return false;
    if (n.hour < HOURS.openHour) return false;
    if (n.hour >= HOURS.closeHour) return false;
    return true;
  }
  function renderHoursCard() {
    const labels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const today = ukNow().dayIdx;
    hoursCardEl.innerHTML = labels.map((d, i) => {
      const isWeekday = HOURS.days.includes(i);
      const text = isWeekday ? `${HOURS.openHour}:00 – ${HOURS.closeHour}:00` : 'Closed';
      return `<div class="hrow ${i === today ? 'today' : ''}"><span>${d}</span><span>${text}</span></div>`;
    }).join('');
  }
  function updateHoursStatus() {
    const open = isWorkingHours();
    hoursStatusEl.className = 'ae-hours ' + (open ? 'open' : 'closed');
    hoursStatusEl.querySelector('.txt').textContent = open ? 'Online now' : 'Offline — leave a message';
  }

  function showIntro() {
    intro.style.display = 'flex';
    leadForm.classList.remove('active');
    chatBody.classList.remove('active');
    offhoursEl.style.display = 'none';
  }

  function showOffhours() {
    intro.style.display = 'none';
    leadForm.classList.remove('active');
    chatBody.classList.remove('active');
    offhoursEl.style.display = 'flex';
    renderHoursCard();
  }

  function showChatBody() {
    intro.style.display = 'none';
    leadForm.classList.remove('active');
    chatBody.classList.add('active');
    offhoursEl.style.display = 'none';
  }

  function showLeadForm() {
    intro.style.display = 'none';
    leadForm.classList.add('active');
    chatBody.classList.remove('active');
    offhoursEl.style.display = 'none';
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
  function attachmentFrom(m) {
    if (!m.attachment_url) return null;
    return { url: m.attachment_url, name: m.attachment_name, type: m.attachment_type };
  }

  async function loadHistory() {
    if (!conversationId) return;
    try {
      const data = await apiCall({ action: 'history', conversation_id: conversationId });
      if (data.messages && data.messages.length > 0) {
        messagesEl.innerHTML = '';
        data.messages.forEach((m) => {
          addMessage(m.role, m.content, attachmentFrom(m));
          if (m.created_at) lastMessageTs = m.created_at;
        });
        // If the visitor's last message is still unanswered, re-show the waiting indicator
        const msgs = data.messages;
        let awaiting = false;
        for (let i = msgs.length - 1; i >= 0; i--) {
          if (msgs[i].role === 'user') { awaiting = true; break; }
          if (msgs[i].role === 'human' || msgs[i].role === 'assistant') break;
        }
        if (awaiting) addWaiting();
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
              addMessage(m.role, m.content, attachmentFrom(m));
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

    if (isOpen) updateHoursStatus();
    if (isOpen && !opened) {
      opened = true;
      // Returning visitor with a live conversation always gets the chat
      // (their messages are already in flight — we should show them).
      if (conversationId) {
        stage = 'live';
        showChatBody();
        loadHistory();
        startPolling();
        return;
      }
      // Outside UK working hours → direct to contact form instead of chat
      if (!isWorkingHours()) {
        showOffhours();
        return;
      }
      // Online — show intro (yes/no) first
      stage = 'intro';
      showIntro();
    }
  });

  // Keep the online/offline dot accurate if the widget stays open across
  // the boundary (user parks it on screen at 4:58pm)
  setInterval(updateHoursStatus, 60000);
  updateHoursStatus();

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

  // Drag & drop file upload
  async function handleDroppedFile(file) {
    if (!file) return;
    if (stage !== 'live' && stage !== 'first_message') {
      addMessage('system', 'Send your first message first, then you can attach files.');
      return;
    }
    if (!conversationId) return;
    if (file.size > 5 * 1024 * 1024) {
      addMessage('system', 'That file is over 5MB. Please send a smaller one.');
      return;
    }
    attachBtn.disabled = true;
    addMessage('system', 'Uploading ' + file.name + '...');
    try {
      const b64 = await fileToBase64(file);
      const data = await apiCall({
        action: 'upload_file',
        conversation_id: conversationId,
        filename: file.name,
        content_type: file.type || 'application/octet-stream',
        file_base64: b64,
        sender: 'user',
      });
      if (data && data.url) {
        const systemMsgs = messagesEl.querySelectorAll('.ae-msg.system');
        if (systemMsgs.length) systemMsgs[systemMsgs.length - 1].remove();
        addMessage('user', '', { url: data.url, name: file.name, type: file.type });
      } else {
        addMessage('system', (data && data.error) || "Couldn't upload that file.");
      }
    } catch (e) {
      addMessage('system', "Upload failed. Please try again.");
    } finally {
      attachBtn.disabled = false;
    }
  }

  chatBody.addEventListener('dragover', (e) => {
    if (stage !== 'live' && stage !== 'first_message') return;
    e.preventDefault();
    chatBody.classList.add('dragging');
  });
  chatBody.addEventListener('dragleave', (e) => {
    if (e.target === chatBody) chatBody.classList.remove('dragging');
  });
  chatBody.addEventListener('drop', (e) => {
    e.preventDefault();
    chatBody.classList.remove('dragging');
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) handleDroppedFile(file);
  });

  // Prevent the browser from opening the file if dropped outside the overlay
  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', (e) => {
    if (!chatBody.contains(e.target)) e.preventDefault();
  });

  // File attachment flow
  attachBtn.addEventListener('click', () => {
    if (stage !== 'live' && stage !== 'first_message') {
      alert('Please complete the form first, then you can send files.');
      return;
    }
    if (stage === 'first_message') {
      alert('Send your first message first, then you can attach files.');
      return;
    }
    fileInput.click();
  });

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    fileInput.value = '';
    if (!conversationId) return;
    if (file.size > 5 * 1024 * 1024) {
      addMessage('system', 'That file is over 5MB. Please send a smaller one.');
      return;
    }
    attachBtn.disabled = true;
    addMessage('system', 'Uploading ' + file.name + '...');
    try {
      const b64 = await fileToBase64(file);
      const data = await apiCall({
        action: 'upload_file',
        conversation_id: conversationId,
        filename: file.name,
        content_type: file.type || 'application/octet-stream',
        file_base64: b64,
        sender: 'user',
      });
      if (data && data.url) {
        // Remove the "Uploading…" system message
        const systemMsgs = messagesEl.querySelectorAll('.ae-msg.system');
        if (systemMsgs.length) systemMsgs[systemMsgs.length - 1].remove();
        addMessage('user', '', { url: data.url, name: file.name, type: file.type });
      } else {
        addMessage('system', (data && data.error) || "Couldn't upload that file.");
      }
    } catch (e) {
      addMessage('system', "Upload failed. Please try again.");
    } finally {
      attachBtn.disabled = false;
    }
  });

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result || '';
        const comma = result.indexOf(',');
        resolve(comma >= 0 ? result.slice(comma + 1) : result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

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
