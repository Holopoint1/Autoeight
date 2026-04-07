(function () {
  var K = 'ae_staff';
  var P = 'AE-Staff-2025';

  window.AEAuth = {
    check: function () {
      if (sessionStorage.getItem(K) !== '1') {
        window.location.href = 'login';
      }
    },
    login: function (pass) {
      if (pass === P) { sessionStorage.setItem(K, '1'); return true; }
      return false;
    },
    logout: function () {
      sessionStorage.removeItem(K);
      window.location.href = 'login';
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
