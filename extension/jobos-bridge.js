// ================================================================
// JobOS — Bridge Content Script v3.0
// Runs on: JobOS web app tabs (document_start)
// Purpose: Two-way bridge between the JobOS app and the extension
// ================================================================

'use strict';

const BRIDGE_SOURCE_WEB = 'jobos-web-app';
const BRIDGE_SOURCE_EXT = 'jobos-extension';
const APP_FETCH_TYPE     = 'CAREERPILOT_FETCH_JOB_DATA';
const APP_RESPONSE_TYPE  = 'CAREERPILOT_JOB_DATA_RESPONSE';
const SUPABASE_PROJECT_REF = 'jdplobgtxzncwxhordah';
const AUTH_KEY = `sb-${SUPABASE_PROJECT_REF}-auth-token`;

// ────────────────────────────────────────────────────────────────
// Web App → Extension messaging
// ────────────────────────────────────────────────────────────────
window.addEventListener('message', event => {
  if (event.source !== window) return;
  const msg = event.data;
  if (!msg) return;

  // ── Hand-off request as the JobOS app actually sends it ──
  // Trackers, Connections and the resume importer post
  //   { type: 'CAREERPILOT_FETCH_JOB_DATA', dataId }
  // and wait for { type: 'CAREERPILOT_JOB_DATA_RESPONSE', data }. The names are historical;
  // they are a contract with the app (see extension/CLAUDE.md).
  if (msg.type === APP_FETCH_TYPE) {
    if (typeof msg.dataId !== 'string' || !msg.dataId) return;
    try {
      if (!chrome.runtime?.id) throw new Error('Context invalidated');
      chrome.runtime.sendMessage({ action: 'getJobData', dataId: msg.dataId }, response => {
        // Reply only with real data. On a miss the app's own timeout falls back to the URL values.
        if (chrome.runtime.lastError || !response?.success || !response.data) return;
        window.postMessage(
          { type: APP_RESPONSE_TYPE, dataId: msg.dataId, data: response.data },
          window.location.origin
        );
      });
    } catch (err) {
      console.warn('[JobOS Bridge] Extension context invalidated. Please refresh the page.');
    }
    return;
  }

  if (msg.source !== BRIDGE_SOURCE_WEB) return;

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
  // Same origin only: hand-off data and session events are for the JobOS app, not other frames.
  window.postMessage({ source: BRIDGE_SOURCE_EXT, ...payload }, window.location.origin);
}

console.log('[JobOS Bridge] v2.0 loaded.');
