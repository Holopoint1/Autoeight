/**
 * Autoeight Visitor Intelligence — Tracking Script
 * Lightweight (<3KB min), zero-dependency visitor tracker.
 * Configure via window.AE_TRACK = { apiKey, endpoint }
 */
(function () {
  'use strict';

  var cfg = window.AE_TRACK;
  if (!cfg || !cfg.apiKey || !cfg.endpoint) return;

  var SK = 'ae_sid';        // sessionStorage key for session ID
  var FK = 'ae_fid';        // localStorage key for fingerprint
  var CK = 'ae_consent';    // localStorage consent state

  // ── Consent check ──
  function hasConsent() {
    try { return localStorage.getItem(CK) !== 'declined'; } catch (e) { return true; }
  }

  // ── UUID v4 generator ──
  function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  // ── Session management ──
  function getSessionKey() {
    var key;
    try { key = sessionStorage.getItem(SK); } catch (e) { /* private mode */ }
    if (key) return { key: key, isNew: false };
    key = uuid();
    try { sessionStorage.setItem(SK, key); } catch (e) { /* ignore */ }
    return { key: key, isNew: true };
  }

  // ── Fingerprint (best-effort, not bulletproof) ──
  function getFingerprint() {
    if (!hasConsent()) return null;
    var fp;
    try { fp = localStorage.getItem(FK); } catch (e) { /* ignore */ }
    if (fp) return fp;

    var parts = [
      screen.width, screen.height, screen.colorDepth,
      new Date().getTimezoneOffset(),
      navigator.language,
      navigator.platform,
      navigator.hardwareConcurrency || 0
    ];

    // Simple hash
    var str = parts.join('|');
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    fp = 'fp_' + Math.abs(hash).toString(36);
    try { localStorage.setItem(FK, fp); } catch (e) { /* ignore */ }
    return fp;
  }

  // ── UTM extraction ──
  function getUTM() {
    var params;
    try { params = new URLSearchParams(location.search); } catch (e) { return null; }
    var utm = {};
    var found = false;
    ['source', 'medium', 'campaign', 'term', 'content'].forEach(function (k) {
      var v = params.get('utm_' + k);
      if (v) { utm[k] = v; found = true; }
    });
    return found ? utm : null;
  }

  // ── Device detection ──
  function getDevice() {
    var ua = navigator.userAgent;
    var type = 'desktop';
    if (/Mobi|Android/i.test(ua)) type = 'mobile';
    else if (/Tablet|iPad/i.test(ua)) type = 'tablet';

    var browser = 'Unknown';
    if (/Edg\//i.test(ua)) browser = 'Edge';
    else if (/Chrome\//i.test(ua)) browser = 'Chrome';
    else if (/Firefox\//i.test(ua)) browser = 'Firefox';
    else if (/Safari\//i.test(ua)) browser = 'Safari';

    var os = 'Unknown';
    if (/Windows/i.test(ua)) os = 'Windows';
    else if (/Mac OS/i.test(ua)) os = 'macOS';
    else if (/Linux/i.test(ua)) os = 'Linux';
    else if (/Android/i.test(ua)) os = 'Android';
    else if (/iOS|iPhone|iPad/i.test(ua)) os = 'iOS';

    return { type: type, browser: browser, os: os, sw: screen.width, sh: screen.height };
  }

  // ── Send event ──
  function send(data, isUnload) {
    data.api_key = cfg.apiKey;
    var body = JSON.stringify(data);

    // Use sendBeacon only on unload (where fetch may be cancelled).
    // For normal events use fetch with keepalive for proper CORS handling.
    if (isUnload && navigator.sendBeacon) {
      navigator.sendBeacon(cfg.endpoint, new Blob([body], { type: 'text/plain' }));
    } else if (typeof fetch !== 'undefined') {
      fetch(cfg.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body,
        keepalive: true,
        mode: 'cors'
      }).catch(function () {});
    } else {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', cfg.endpoint, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(body);
    }
  }

  // ── Track page view ──
  var session = getSessionKey();
  var startTime = Date.now();

  var event = {
    type: 'pageview',
    session_key: session.key,
    fingerprint: getFingerprint(),
    url: location.href,
    path: location.pathname,
    title: document.title,
    referrer: document.referrer || null,
    is_new_session: session.isNew
  };

  // Only include UTM and device on new sessions to save bandwidth
  if (session.isNew) {
    event.utm = getUTM();
    event.device = getDevice();
  }

  send(event);

  // ── Heartbeat on page unload ──
  function heartbeat() {
    var duration = Math.round((Date.now() - startTime) / 1000);
    if (duration < 1) return;

    send({
      type: 'heartbeat',
      session_key: session.key,
      url: location.href,
      path: location.pathname,
      duration: duration
    }, true);
  }

  // Use visibilitychange as primary (more reliable than unload)
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') heartbeat();
  });

  // Fallback for older browsers
  window.addEventListener('pagehide', heartbeat);

})();
