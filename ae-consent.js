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
        '<p>We use cookies and analytics to see which companies visit our site. ' +
        'This includes your IP address and browsing behaviour to identify your organisation (not you personally). ' +
        '<a href="/privacy" style="color:var(--purple-l,#a78bfa);text-decoration:underline;">Privacy Policy</a></p>' +
        '<div class="ae-consent-actions">' +
          '<button id="ae-consent-accept" class="ae-consent-btn ae-consent-accept">Accept</button>' +
          '<button id="ae-consent-decline" class="ae-consent-btn ae-consent-decline">Decline</button>' +
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
