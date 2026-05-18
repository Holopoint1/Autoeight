(function () {
  // One password for everything. Checked by the Supabase edge function,
  // which stores it as the ADMIN_PASSWORD secret. Browser never sees the
  // password in source — it only knows whether the server accepted it.
  var K = 'ae_staff';
  var PW_KEY = 'ae_chat_admin_pw'; // same key the chat admin uses, shared across panels
  var CHAT_ENDPOINT = 'https://useohuvyxzshmskjngpo.supabase.co/functions/v1/chat';

  window.AEAuth = {
    check: function () {
      if (sessionStorage.getItem(K) !== '1') {
        window.location.href = '/admin/login';
      }
    },
    // Async — returns a promise
    login: async function (pass) {
      try {
        var res = await fetch(CHAT_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'admin_login', password: pass }),
        });
        if (!res.ok) return false;
        sessionStorage.setItem(K, '1');
        sessionStorage.setItem(PW_KEY, pass);
        return true;
      } catch (e) {
        return false;
      }
    },
    // Read the stored password so other admin pages (chat) can reuse it
    getPassword: function () {
      return sessionStorage.getItem(PW_KEY) || '';
    },
    logout: function () {
      sessionStorage.removeItem(K);
      sessionStorage.removeItem(PW_KEY);
      window.location.href = '/admin/login';
    }
  };
})();

// ── Theme toggle ──
(function () {
  var TK = 'ae_theme';
  var saved = localStorage.getItem(TK) || 'dark';
  document.documentElement.setAttribute('data-theme', saved);

  window.AETheme = {
    toggle: function () {
      var current = document.documentElement.getAttribute('data-theme') || 'dark';
      var next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem(TK, next);
    }
  };
})();

document.addEventListener('DOMContentLoaded', function () {
  // Inject theme toggle into topbar if present
  var topbarActions = document.querySelector('.topbar-actions');
  if (topbarActions) {
    var btn = document.createElement('button');
    btn.className = 'theme-toggle';
    btn.title = 'Toggle light/dark theme';
    btn.innerHTML = '<i class="fa-solid fa-moon"></i><i class="fa-solid fa-sun"></i>';
    btn.addEventListener('click', AETheme.toggle);
    topbarActions.insertBefore(btn, topbarActions.firstChild);
  }

  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var target = btn.getAttribute('data-tab');
      document.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
      document.querySelectorAll('.tab-content').forEach(function (c) { c.classList.remove('active'); });
      btn.classList.add('active');
      var el = document.getElementById(target);
      if (el) el.classList.add('active');
    });
  });

  // Objection accordion toggles
  document.querySelectorAll('.objection-header').forEach(function (h) {
    h.addEventListener('click', function () {
      var ans = h.nextElementSibling;
      var icon = h.querySelector('.toggle-icon');
      ans.classList.toggle('open');
      if (icon) icon.textContent = ans.classList.contains('open') ? '−' : '+';
    });
  });
});
