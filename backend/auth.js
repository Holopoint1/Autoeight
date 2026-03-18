(function () {
  var K = 'ae_staff';
  var P = 'AE-Staff-2025';

  window.AEAuth = {
    check: function () {
      if (sessionStorage.getItem(K) !== '1') {
        window.location.href = 'login.html';
      }
    },
    login: function (pass) {
      if (pass === P) { sessionStorage.setItem(K, '1'); return true; }
      return false;
    },
    logout: function () {
      sessionStorage.removeItem(K);
      window.location.href = 'login.html';
    }
  };
})();

document.addEventListener('DOMContentLoaded', function () {
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
