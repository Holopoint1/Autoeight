// Load chat widget (skip on backend pages)
if (!location.pathname.includes('/backend/')) {
  var chatScript = document.createElement('script');
  chatScript.src = '/chatbot/widget/chat-widget.js?v=2026-04-21-labels';
  chatScript.defer = true;
  document.head.appendChild(chatScript);
}

// Shared nav and footer loader
// Pages ship with inline nav/footer as fallback. This script
// fetches the latest nav.html/footer.html and swaps them in,
// so a single-file edit updates every page on next load.
// If this script fails, the inline fallback still renders.
(function () {
  // Replace inline nav with fetched version
  var inlineNav = document.getElementById('nav');
  var inlineToggle = document.getElementById('mobile-nav-toggle');
  if (inlineNav) {
    fetch('/nav.html')
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
      .then(function (html) {
        // Create a temp container to parse the fetched HTML
        var temp = document.createElement('div');
        temp.innerHTML = html;
        var newToggle = temp.querySelector('#mobile-nav-toggle');
        var newNav = temp.querySelector('#nav');
        if (newNav) {
          if (inlineToggle && newToggle) inlineToggle.replaceWith(newToggle);
          inlineNav.replaceWith(newNav);
          inlineNav = newNav;
        }
        initNav();
      })
      .catch(function () {
        // Fetch failed — inline nav is already rendered, just init it
        initNav();
      });
  } else {
    initNav();
  }

  // Replace inline footer with fetched version
  var inlineFooter = document.querySelector('footer');
  if (inlineFooter) {
    fetch('/footer.html')
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
      .then(function (html) {
        var temp = document.createElement('div');
        temp.innerHTML = html;
        var newFooter = temp.querySelector('footer');
        if (newFooter) inlineFooter.replaceWith(newFooter);
      })
      .catch(function () { /* inline footer already there */ });
  }

  function initNav() {
    var navNode = document.getElementById('nav');
    if (navNode) {
      navNode.classList.toggle('scrolled', window.scrollY > 12);
      window.addEventListener('scroll', function () {
        navNode.classList.toggle('scrolled', window.scrollY > 12);
      });
    }

    var t = document.getElementById('mobile-nav-toggle');
    if (!t) return;
    var menuOpen = false;
    t.addEventListener('change', function () {
      if (t.checked && !menuOpen) {
        menuOpen = true;
        history.pushState({ menu: 'open' }, '');
      } else if (!t.checked && menuOpen) {
        menuOpen = false;
        if (history.state && history.state.menu === 'open') history.back();
      }
    });
    window.addEventListener('popstate', function () {
      if (menuOpen && t.checked) { t.checked = false; menuOpen = false; }
    });
    document.querySelectorAll('#nav-menu a').forEach(function (link) {
      link.addEventListener('click', function () {
        if (t.checked) {
          t.checked = false;
          if (menuOpen) { menuOpen = false; if (history.state && history.state.menu === 'open') history.back(); }
        }
      });
    });
  }
})();
