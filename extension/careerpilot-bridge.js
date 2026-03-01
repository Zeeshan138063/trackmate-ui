// ================================================================
// JobOS — Bridge Content Script v3.0
// Runs on: JobOS web app tabs (document_start)
// Purpose: Two-way bridge between the JobOS app and the extension
// ================================================================

'use strict';

const BRIDGE_SOURCE_WEB = 'careerpilot-web-app';
const BRIDGE_SOURCE_EXT = 'careerpilot-extension';
const SUPABASE_PROJECT_REF = 'jdplobgtxzncwxhordah';
const AUTH_KEY = `sb-${SUPABASE_PROJECT_REF}-auth-token`;

// ────────────────────────────────────────────────────────────────
// Web App → Extension messaging
// ────────────────────────────────────────────────────────────────
window.addEventListener('message', event => {
  if (event.source !== window) return;
  const msg = event.data;
  if (!msg || msg.source !== BRIDGE_SOURCE_WEB) return;

  // ── Fetch stored job/contact/profile data by ID ──
  if (msg.action === 'getJobData' || msg.action === 'getData') {
    const dataId = msg.dataId;
    if (!dataId) {
      _reply({ action: 'dataResponse', success: false, error: 'No dataId provided' });
      return;
    }

    chrome.runtime.sendMessage({ action: 'getJobData', dataId }, response => {
      if (chrome.runtime.lastError) {
        _reply({ action: 'dataResponse', success: false, error: chrome.runtime.lastError.message });
        return;
      }
      _reply({
        action:  'dataResponse',
        dataId,
        success: response?.success || false,
        data:    response?.data    || null,
        error:   response?.error   || null,
      });
    });
  }

  // ── Extension presence check (web app can verify extension is installed) ──
  if (msg.action === 'ping') {
    _reply({ action: 'pong', version: chrome.runtime.getManifest().version });
  }
});

// ────────────────────────────────────────────────────────────────
// Portal logout → notify extension to clear its session
// ────────────────────────────────────────────────────────────────
window.addEventListener('storage', event => {
  if (event.key === AUTH_KEY && !event.newValue) {
    console.log('[JobOS Bridge] Portal logout detected — clearing extension session.');
    chrome.runtime.sendMessage({ action: 'portalLogout' }, () => {
      // Ignore errors (extension may be in the middle of something)
      void chrome.runtime.lastError;
    });
  }
});

// ────────────────────────────────────────────────────────────────
// Private: send reply to web app
// ────────────────────────────────────────────────────────────────
function _reply(payload) {
  window.postMessage({ source: BRIDGE_SOURCE_EXT, ...payload }, '*');
}

console.log('[JobOS Bridge] v2.0 loaded.');
