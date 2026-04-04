// ================================================================
// JobOS — Background Service Worker v3.0  (Production)
// ================================================================

'use strict';

const SUPABASE_PROJECT_REF = 'jdplobgtxzncwxhordah';
const AUTH_STORAGE_KEY     = `sb-oevfiyocidpbeaycgnps-auth-token`; // Matches popup.js
const SUPABASE_URL         = 'https://jdplobgtxzncwxhordah.supabase.co';
const SUPABASE_KEY         = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkcGxvYmd0eHpuY3d4aG9yZGFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MzcwMzksImV4cCI6MjA3MTIxMzAzOX0.ior862XnLyAtFwo-h2Umhj8tADMlv1dZOUwLCZWOV-c';
const DATA_TTL_MS          = 60 * 60 * 1000; // 1 hour

// ── Native Side Panel Configuration ──
if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);
}

// ────────────────────────────────────────────────────────────────
// TAB STATE STORE
// Per-tab state: url, detected ATS, last extracted data, badge.
// ────────────────────────────────────────────────────────────────
const TabStore = (() => {
  const _store = new Map();
  function get(tabId)        { return _store.get(tabId) || {}; }
  function set(tabId, patch) { _store.set(tabId, { ..._store.get(tabId), ...patch, tabId }); }
  function del(tabId)        { _store.delete(tabId); }
  function prune() {
    chrome.tabs.query({}, tabs => {
      const live = new Set(tabs.map(t => t.id));
      for (const id of _store.keys()) if (!live.has(id)) _store.delete(id);
    });
  }
  return { get, set, del, prune };
})();
setInterval(() => TabStore.prune(), 5 * 60 * 1000);

// ────────────────────────────────────────────────────────────────
// BADGE MANAGER
// ────────────────────────────────────────────────────────────────
const Badge = {
  set(tabId, text, color = '#10b981') {
    chrome.action.setBadgeText({ text, tabId });
    chrome.action.setBadgeBackgroundColor({ color, tabId });
    TabStore.set(tabId, { badgeText: text });
  },
  clear(tabId) {
    chrome.action.setBadgeText({ text: '', tabId });
    TabStore.set(tabId, { badgeText: '' });
  },
  restore(tabId) {
    const state = TabStore.get(tabId);
    if (state?.badgeText) chrome.action.setBadgeText({ text: state.badgeText, tabId });
  },
};

function badgeFromUrl(url) {
  if (!url) return null;
  if (/linkedin\.com\/in\//.test(url))                                             return { text: 'PROF', color: '#3b82f6' };
  if (/linkedin\.com\/(company|school)\//.test(url))                               return { text: 'CO',   color: '#8b5cf6' };
  if (/linkedin\.com\/jobs\/|indeed\.|glassdoor\.|rozee\.pk|naukri\.com/.test(url)) return { text: 'JOB',  color: '#10b981' };
  if (/lever\.co|greenhouse\.io|myworkdayjobs\.com|icims\.com|workable\.com|smartrecruiters\.com|taleo\.net/.test(url))
    return { text: 'FILL', color: '#f59e0b' };
  return null;
}

// ────────────────────────────────────────────────────────────────
// TAB LIFECYCLE
// ────────────────────────────────────────────────────────────────
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!tab.url) return;
  if (changeInfo.url || changeInfo.status === 'loading') {
    TabStore.set(tabId, { url: tab.url, data: null, ats: null, isApplyPage: false, updatedAt: Date.now() });
  }
  if (changeInfo.status === 'complete') {
    const b = badgeFromUrl(tab.url);
    if (b) Badge.set(tabId, b.text, b.color);
    else   Badge.clear(tabId);
  }
});
chrome.tabs.onRemoved.addListener(tabId => TabStore.del(tabId));
chrome.tabs.onActivated.addListener(({ tabId }) => Badge.restore(tabId));

// ────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────
function uid(prefix = 'cp') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
function baseUrl(url) {
  return (url || 'http://localhost:8080').replace(/\/trackers\/?$/, '');
}
function storeTemp(id, data) {
  return new Promise(resolve => {
    chrome.storage.local.set({ [id]: data }, () => {
      setTimeout(() => chrome.storage.local.remove([id]), DATA_TTL_MS);
      resolve();
    });
  });
}
function buildSafeParams(dataId, overrides = {}) {
  return new URLSearchParams({ dataId, ...overrides });
}
async function captureScreenshot(tabId) {
  const tab = await chrome.tabs.get(tabId);
  if (!tab) throw new Error('Tab not found');
  
  // Try capturing using the specific window of the tab
  try {
    return await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'jpeg', quality: 80 });
  } catch (err) {
    // If that fails (e.g. permission or focus lost), try the focused window as a fallback
    return await chrome.tabs.captureVisibleTab(null, { format: 'jpeg', quality: 80 });
  }
}

// ────────────────────────────────────────────────────────────────
// MAIN MESSAGE LISTENER
// ────────────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const senderTabId = sender.tab?.id;

  // Content script asks to open native side panel
  if (request.action === 'openNativeSidePanel') {
    if (senderTabId && chrome.sidePanel && chrome.sidePanel.open) {
      chrome.sidePanel.open({ windowId: sender.tab.windowId });
    }
    return false;
  }

  // Content script → background: reactive job data update
  if (request.action === 'jobDataExtracted') {
    if (senderTabId) {
      TabStore.set(senderTabId, { data: request.data, updatedAt: Date.now() });
      const b = badgeFromUrl(sender.tab?.url);
      if (b) Badge.set(senderTabId, b.text, b.color);
    }
    return false;
  }

  // Content script → background: ATS detected
  if (request.action === 'atsDetected') {
    if (senderTabId) {
      TabStore.set(senderTabId, { ats: request.ats, isApplyPage: request.isApplyPage, updatedAt: Date.now() });
      Badge.set(senderTabId, 'FILL', '#f59e0b');
    }
    return false;
  }

  // Popup requests current tab state (instant — reads from store, no round-trip)
  if (request.action === 'getTabState') {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      const tabId = tabs[0]?.id;
      if (!tabId) { sendResponse({ success: false }); return; }
      sendResponse({ success: true, state: TabStore.get(tabId) });
    });
    return true;
  }

  // Screenshot
  if (request.action === 'captureScreenshot') {
    const tabId = request.tabId || senderTabId;
    if (!tabId) { sendResponse({ success: false, error: 'No tab ID' }); return true; }
    captureScreenshot(tabId)
      .then(s  => sendResponse({ success: true, screenshot: s }))
      .catch(e => sendResponse({ success: false, error: e.message }));
    return true;
  }

  // Save job locally
  if (request.action === 'saveJobData') {
    const jobData = { ...request.data, screenshot: request.screenshot || null, capturedAt: new Date().toISOString(), url: request.url || sender.tab?.url };
    chrome.storage.local.get(['savedJobs'], result => {
      const jobs = [...(result.savedJobs || []), jobData];
      chrome.storage.local.set({ savedJobs: jobs }, () => sendResponse({ success: true, jobId: jobs.length - 1 }));
    });
    return true;
  }

  if (request.action === 'getSavedJobs') {
    chrome.storage.local.get(['savedJobs'], result => sendResponse({ success: true, jobs: result.savedJobs || [] }));
    return true;
  }

  // Send to JobOS Trackers
  if (request.action === 'sendToJobOS') {
    const data = request.data;
    const id   = uid('cp_job');
    storeTemp(id, data).then(() => {
      const params = buildSafeParams(id, {
        action: 'addJob',
        position:  (data.position  || '').substring(0, 100),
        company:   (data.company   || '').substring(0, 100),
        jobUrl:    (data.jobUrl    || '').substring(0, 200),
        location:  (data.location  || '').substring(0, 100),
        minSalary: data.minSalary ? String(data.minSalary) : '',
        maxSalary: data.maxSalary ? String(data.maxSalary) : '',
        datePosted: (data.datePosted || '').substring(0, 50),
        deadline:   (data.deadline   || '').substring(0, 50),
        status:     data.status    || 'Bookmarked',
        excitement: data.excitement ? String(data.excitement) : '3',
      });
      chrome.tabs.create({ url: `${baseUrl(request.jobosUrl)}/trackers?${params}` });
      sendResponse({ success: true });
    });
    return true;
  }

  // Send to JobOS Connections
  if (request.action === 'sendContactToJobOS') {
    const data = request.data;
    const id   = uid('cp_contact');
    storeTemp(id, data).then(() => {
      const params = buildSafeParams(id, { action: 'addContact', name: (data.name || '').substring(0, 100), company: (data.company || '').substring(0, 100) });
      chrome.tabs.create({ url: `${baseUrl(request.jobosUrl)}/connections?${params}` });
      sendResponse({ success: true });
    });
    return true;
  }

  // Send to Resume Builder
  if (request.action === 'sendProfileToJobOS') {
    const data = request.data;
    const id   = uid('cp_profile');
    storeTemp(id, data).then(() => {
      const params = buildSafeParams(id, { action: 'importProfile', source: 'linkedin_extension' });
      chrome.tabs.create({ url: `${baseUrl(request.jobosUrl)}/resume?${params}` });
      sendResponse({ success: true });
    });
    return true;
  }

  // JobOS page fetches data by ID
  if (request.action === 'getJobData') {
    const id = request.dataId;
    if (!id) { sendResponse({ success: false, error: 'No dataId' }); return true; }
    chrome.storage.local.get([id], result => {
      if (result[id]) { sendResponse({ success: true, data: result[id] }); chrome.storage.local.remove([id]); }
      else             sendResponse({ success: false, error: 'Data not found or expired' });
    });
    return true;
  }

  // Portal login
  if (request.action === 'portalLogin') {
    const session = request.session;
    if (session) {
      chrome.storage.local.set({ [AUTH_STORAGE_KEY]: session }, () => {
        console.log('[JobOS] Session sync via portal login.');
        sendResponse({ success: true });
      });
    } else {
      sendResponse({ success: false, error: 'No session data' });
    }
    return true;
  }

  // Portal logout
  if (request.action === 'portalLogout') {
    chrome.storage.local.remove([AUTH_STORAGE_KEY], () => {
      console.log('[JobOS] Session cleared via portal logout.');
      sendResponse({ success: true });
    });
    return true;
  }

  // Check if job is already saved
  if (request.action === 'checkSavedJob') {
    chrome.storage.local.get([AUTH_STORAGE_KEY], result => {
      const sessionData = result[AUTH_STORAGE_KEY];
      if (!sessionData) { sendResponse({ saved: false }); return; }
      
      const sessionStr = typeof sessionData === 'string' ? sessionData : JSON.stringify(sessionData);
      let session;
      try { session = JSON.parse(sessionStr); } catch (e) { sendResponse({ saved: false }); return; }
      
      const token = session.access_token;
      if (!token) { sendResponse({ saved: false }); return; }

      // Strip query parameters for better matching, except for LinkedIn job IDs
      let cleanUrl = request.url;
      try {
        const u = new URL(request.url);
        if (u.hostname.includes('linkedin.com')) {
          const jobId = u.searchParams.get('currentJobId');
          if (jobId) cleanUrl = `https://www.linkedin.com/jobs/view/${jobId}/`;
          else cleanUrl = `${u.origin}${u.pathname}`;
        } else {
          cleanUrl = `${u.origin}${u.pathname}`; // Remove UTM params, etc.
        }
      } catch (e) {}
      
      const encodedUrl = encodeURIComponent(cleanUrl);

      fetch(`${SUPABASE_URL}/rest/v1/jobs?job_url=ilike.${encodedUrl}*&select=id&limit=1`, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => res.json())
      .then(data => {
        const saved = Array.isArray(data) && data.length > 0;
        sendResponse({ saved });
      })
      .catch(e => {
        sendResponse({ saved: false });
      });
    });
    return true;
  }

  return false;
});
