// ============================================================
// Autoeight Admin — Shared Layout
// ============================================================
// ONE sidebar for every admin page. Drop this script into each
// admin HTML file and it will render/update the sidebar on load.
//
// Usage in each admin page:
//   <aside class="sidebar" data-admin-sidebar></aside>
//   <script src="/admin/layout.js"></script>
//
// Or, if an inline sidebar already exists, this script will
// overwrite its contents so every page shows the same nav.
(function () {
  'use strict';

  // The single source of truth for admin navigation.
  // To add/remove a menu item, edit this ONE list — every admin page
  // will pick it up automatically on the next load.
  var NAV = {
    tools: [
      { href: '/admin',           label: 'Dashboard',            icon: 'fa-house' },
      { href: '/admin/chat',      label: 'Live Chat',            icon: 'fa-comments' },
      { href: '/admin/visitors',  label: 'Visitor Intelligence', icon: 'fa-eye',    badge: 'New' },
      { href: '/admin/seo',       label: 'SEO & Site Health',    icon: 'fa-chart-simple' },
      { href: '/admin/skills',    label: 'Sales Playbook',       icon: 'fa-book' },
    ],
    // Pitch Views mirror actual frontend services (/services/*).
    // Do not add items here unless the equivalent service page exists on the public site.
    pitchViews: [
      { href: '/admin/support',   label: 'AI & Automation',      icon: 'fa-robot' },       // ↔ /services/ai-automation
      { href: '/admin/sales',     label: 'Sales Automation',     icon: 'fa-chart-line' },  // ↔ /services/sales-automation
      { href: '/admin/data',      label: 'CRM & Integration',    icon: 'fa-plug' },        // ↔ /services/crm-integration
      { href: '/admin/marketing', label: 'Sales & Marketing',    icon: 'fa-bullhorn' },    // ↔ /services/sales-marketing
    ],
    footer: [
      { href: '/',                label: 'Live Site',            icon: 'fa-globe' },
      { href: '#',                label: 'Sign Out',             icon: 'fa-right-from-bracket', onClick: 'AEAuth.logout();return false;' },
    ],
  };

  function currentPath() {
    var p = location.pathname.replace(/\/+$/, '');
    return p || '/admin';
  }

  function isActive(linkHref, curr) {
    if (linkHref === '/admin') return curr === '/admin' || curr === '';
    return curr === linkHref || curr.indexOf(linkHref + '/') === 0;
  }

  function buildLink(item, curr) {
    var active = isActive(item.href, curr) ? ' active' : '';
    var onClick = item.onClick ? ' onclick="' + item.onClick + '"' : '';
    var badge = item.badge ? ' <span class="sidebar-badge">' + item.badge + '</span>' : '';
    return (
      '<a href="' + item.href + '" class="sidebar-link' + active + '"' + onClick + '>' +
        '<i class="fa-solid ' + item.icon + '"></i> ' + item.label + badge +
      '</a>'
    );
  }

  function buildSidebarHtml() {
    var curr = currentPath();
    var html = '' +
      '<a href="/admin" class="sidebar-logo">' +
        '<img src="/brand_assets/logo.png?v=3" alt="Autoeight" />' +
        '<div class="sidebar-logo-text">' +
          '<span class="sidebar-logo-name">Autoeight</span>' +
          '<span class="sidebar-logo-sub">Internal Portal</span>' +
        '</div>' +
      '</a>' +
      '<div class="sidebar-section">Tools</div>' +
      '<nav class="sidebar-nav">' + NAV.tools.map(function (i) { return buildLink(i, curr); }).join('') + '</nav>' +
      '<div class="sidebar-section">Pitch Views</div>' +
      '<nav class="sidebar-nav">' + NAV.pitchViews.map(function (i) { return buildLink(i, curr); }).join('') + '</nav>' +
      '<div class="sidebar-footer">' + NAV.footer.map(function (i) { return buildLink(i, curr); }).join('') + '</div>';
    return html;
  }

  function render() {
    // Only replace sidebars that explicitly opt in. Pages with a custom
    // sidebar layout (e.g. the chat admin's conversation list) must NOT
    // get their contents clobbered.
    var sidebars = document.querySelectorAll('aside.sidebar[data-admin-sidebar]');
    if (!sidebars.length) {
      // Back-compat fallback: look for the standard admin layout sidebar
      // alongside a .main-content element (the shared admin page pattern).
      var legacy = document.querySelector('.app-layout > aside.sidebar');
      if (legacy) sidebars = [legacy];
    }
    sidebars.forEach(function (el) { el.innerHTML = buildSidebarHtml(); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }

  // Expose in case any page wants to force a redraw
  window.AELayout = { render: render };
})();
