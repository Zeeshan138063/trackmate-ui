// ================================================================
// JobOS — Bridge Content Script v3.0
// Runs on: JobOS web app tabs (document_start)
// Purpose: Two-way bridge between the JobOS app and the extension
// ================================================================

'use strict';

const BRIDGE_SOURCE_WEB = 'jobos-web-app';
const BRIDGE_SOURCE_EXT = 'jobos-extension';
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

    try {
      if (!chrome.runtime?.id) throw new Error('Context invalidated');
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
    } catch (err) {
      _reply({ action: 'dataResponse', success: false, error: 'Extension context invalidated. Please refresh.' });
    }
  }

  // ── Extension presence check (web app can verify extension is installed) ──
  if (msg.action === 'ping') {
    try {
      if (!chrome.runtime?.id) throw new Error('Context invalidated');
      _reply({ action: 'pong', version: chrome.runtime.getManifest().version });
    } catch (e) {
      _reply({ action: 'pong', error: 'Context invalidated' });
    }
  }
});

// ────────────────────────────────────────────────────────────────
// Portal login/logout → notify extension to sync session
// ────────────────────────────────────────────────────────────────
function _checkSession() {
  const sessionData = localStorage.getItem(AUTH_KEY);
  if (sessionData) {
    try {
      const session = JSON.parse(sessionData);
      console.log('[JobOS Bridge] Active portal session found — syncing.');
      chrome.runtime.sendMessage({ action: 'portalLogin', session });
    } catch (e) {
      if (e.message.includes('context invalidated')) {
        console.warn('[JobOS Bridge] Extension context invalidated. Please refresh the page.');
      } else {
        console.warn('[JobOS Bridge] Failed to parse/sync session:', e);
      }
    }
  }
}

// Check session on load
setTimeout(_checkSession, 1000); 

window.addEventListener('storage', event => {
  if (event.key === AUTH_KEY) {
    try {
      if (!chrome.runtime?.id) return; // Silent exit if invalidated

      if (!event.newValue) {
        console.log('[JobOS Bridge] Portal logout detected — clearing extension session.');
        chrome.runtime.sendMessage({ action: 'portalLogout' });
      } else {
        try {
          const session = JSON.parse(event.newValue);
          console.log('[JobOS Bridge] Portal login/update detected — syncing.');
          chrome.runtime.sendMessage({ action: 'portalLogin', session });
        } catch (e) {
          console.warn('[JobOS Bridge] Failed to parse session on storage event:', e);
        }
      }
    } catch (err) {
       console.warn('[JobOS Bridge] Extension context invalidated during storage sync. Please refresh.');
    }
  }
});

// ────────────────────────────────────────────────────────────────
// Private: send reply to web app
// ────────────────────────────────────────────────────────────────
function _reply(payload) {
  window.postMessage({ source: BRIDGE_SOURCE_EXT, ...payload }, '*');
}

console.log('[JobOS Bridge] v2.0 loaded.');
