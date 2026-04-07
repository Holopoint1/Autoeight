/**
 * Autoeight — Cookie/Tracking Consent Banner
 * Minimal PECR-compliant consent UI.
 */
(function () {
  'use strict';

  var CK = 'ae_consent';
  var BANNER_ID = 'ae-consent-banner';

  // Already made a choice
  try {
    if (localStorage.getItem(CK)) return;
  } catch (e) { return; }

  // Build banner
  function show() {
    var banner = document.createElement('div');
    banner.id = BANNER_ID;
    banner.innerHTML =
      '<div class="ae-consent-inner">' +
        '<p>We use cookies and similar technologies to understand which companies visit our site and improve your experience. ' +
        'No personal data is collected.</p>' +
        '<div class="ae-consent-actions">' +
          '<button id="ae-consent-accept" class="ae-consent-btn ae-consent-accept">Accept</button>' +
          '<button id="ae-consent-decline" class="ae-consent-btn ae-consent-decline">Decline</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(banner);

    document.getElementById('ae-consent-accept').addEventListener('click', function () {
      save('accepted');
    });
    document.getElementById('ae-consent-decline').addEventListener('click', function () {
      save('declined');
    });
  }

  function save(value) {
    try { localStorage.setItem(CK, value); } catch (e) { /* ignore */ }
    var el = document.getElementById(BANNER_ID);
    if (el) el.remove();
  }

  // Show after a short delay to not block page render
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(show, 1000); });
  } else {
    setTimeout(show, 1000);
  }
})();
