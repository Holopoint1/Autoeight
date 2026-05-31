/**
 * Autoeight — Cookie/Tracking Consent Banner
 * PECR/UK GDPR compliant — opt-in model.
 * Tracking only fires after explicit "Accept".
 */
(function () {
  'use strict';

  var CK = 'ae_consent';
  var BANNER_ID = 'ae-consent-banner';

  function getChoice() {
    try { return localStorage.getItem(CK); } catch (e) { return null; }
  }

  function show() {
    // Don't duplicate
    if (document.getElementById(BANNER_ID)) return;

    var banner = document.createElement('div');
    banner.id = BANNER_ID;
    banner.innerHTML =
      '<div class="ae-consent-inner">' +
        '<div class="ae-consent-header">' +
          '<div class="ae-consent-icon"><i class="fa-solid fa-cookie-bite"></i></div>' +
          '<div class="ae-consent-title">Cookies &amp; tracking</div>' +
        '</div>' +
        '<p>We use analytics to identify which companies visit our site, not individuals. ' +
        '<a href="/privacy">Read more</a>.</p>' +
        '<div class="ae-consent-actions">' +
          '<button id="ae-consent-decline" class="ae-consent-btn ae-consent-decline">Decline</button>' +
          '<button id="ae-consent-accept" class="ae-consent-btn ae-consent-accept">Accept</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(banner);

    document.getElementById('ae-consent-accept').addEventListener('click', function () {
      save('accepted');
      // Tell ae-track.js it can start
      window.dispatchEvent(new CustomEvent('ae:consent-granted'));
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

  // If already accepted, fire consent event so ae-track.js can initialise
  var existing = getChoice();
  if (existing === 'accepted') {
    // Defer so ae-track.js has time to register its listener
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        window.dispatchEvent(new CustomEvent('ae:consent-granted'));
      });
    } else {
      setTimeout(function () {
        window.dispatchEvent(new CustomEvent('ae:consent-granted'));
      }, 0);
    }
    return;
  }

  // If already declined, do nothing
  if (existing === 'declined') return;

  // No choice yet — show the banner after short delay
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(show, 1000); });
  } else {
    setTimeout(show, 1000);
  }

  // Allow "Manage Cookies" footer link to re-show the banner
  window.AE_CONSENT_SHOW = function () {
    try { localStorage.removeItem(CK); } catch (e) { /* ignore */ }
    show();
  };
})();
