// ================================================================
// CareerPilot AI - Background Service Worker v2.0
// ================================================================

'use strict';

const SUPABASE_PROJECT_REF = 'jdplobgtxzncwxhordah';
const AUTH_STORAGE_KEY     = `sb-${SUPABASE_PROJECT_REF}-auth-token`;
const DATA_TTL_MS          = 60 * 60 * 1000; // 1 hour

// ────────────────────────────────────────────────────────────────
// Helper: generate unique data ID
// ────────────────────────────────────────────────────────────────
function uid(prefix = 'cp') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ────────────────────────────────────────────────────────────────
// Helper: strip /trackers from base URL
// ────────────────────────────────────────────────────────────────
function baseUrl(url) {
  return (url || 'http://localhost:8080').replace(/\/trackers\/?$/, '');
}

// ────────────────────────────────────────────────────────────────
// Helper: store data + auto-cleanup after TTL
// ────────────────────────────────────────────────────────────────
function storeTemp(id, data) {
  return new Promise(resolve => {
    chrome.storage.local.set({ [id]: data }, () => {
      setTimeout(() => chrome.storage.local.remove([id]), DATA_TTL_MS);
      resolve();
    });
  });
}

// ────────────────────────────────────────────────────────────────
// Helper: build URL-safe params (never include description/screenshot)
// ────────────────────────────────────────────────────────────────
function buildSafeParams(dataId, overrides = {}) {
  const params = new URLSearchParams({ dataId, ...overrides });
  return params;
}

// ────────────────────────────────────────────────────────────────
// Screenshot capture
// ────────────────────────────────────────────────────────────────
async function captureScreenshot(tabId) {
  const tab = await chrome.tabs.get(tabId);
  if (!tab) throw new Error('Tab not found');
  return chrome.tabs.captureVisibleTab(tab.windowId, { format: 'jpeg', quality: 80 });
}

// ────────────────────────────────────────────────────────────────
// Badge management
// ────────────────────────────────────────────────────────────────
const Badge = {
  set(tabId, text, color = '#10b981') {
    chrome.action.setBadgeText({ text, tabId });
    chrome.action.setBadgeBackgroundColor({ color, tabId });
  },
  clear(tabId) {
    chrome.action.setBadgeText({ text: '', tabId });
  },
};

// ────────────────────────────────────────────────────────────────
// Tab URL → badge
// ────────────────────────────────────────────────────────────────
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab.url) return;

  const url = tab.url;

  if (/linkedin\.com\/in\//.test(url))                              Badge.set(tabId, 'PROF', '#3b82f6');
  else if (/linkedin\.com\/(company|school)\//.test(url))          Badge.set(tabId, 'CO',   '#8b5cf6');
  else if (/linkedin\.com\/jobs\/|indeed\.com\/|glassdoor\.com\/|rozee\.pk\/|naukri\.com\//.test(url))
                                                                    Badge.set(tabId, 'JOB',  '#10b981');
  else if (/lever\.co\/|greenhouse\.io\/|myworkdayjobs\.com\/|icims\.com\/|workable\.com\//.test(url))
                                                                    Badge.set(tabId, 'FILL', '#f59e0b');
  else                                                              Badge.clear(tabId);
});

// ────────────────────────────────────────────────────────────────
// When content script detects ATS — update badge
// ────────────────────────────────────────────────────────────────
// (handled inside message listener below)

// ────────────────────────────────────────────────────────────────
// Main message listener
// ────────────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  // ── Screenshot ──
  if (request.action === 'captureScreenshot') {
    const tabId = request.tabId || sender.tab?.id;
    if (!tabId) { sendResponse({ success: false, error: 'No tab ID' }); return true; }

    captureScreenshot(tabId)
      .then(screenshot => sendResponse({ success: true, screenshot }))
      .catch(err       => sendResponse({ success: false, error: err.message }));
    return true;
  }

  // ── ATS detected by content script ──
  if (request.action === 'atsDetected') {
    const tabId = sender.tab?.id;
    if (tabId) Badge.set(tabId, 'FILL', '#f59e0b');
    return false;
  }

  // ── Job data extracted (cache notification) ──
  if (request.action === 'jobDataExtracted') {
    return false; // no response needed — just for popup to know it's ready
  }

  // ── Save job to local storage ──
  if (request.action === 'saveJobData') {
    const jobData = {
      ...request.data,
      screenshot: request.screenshot || null,
      capturedAt: new Date().toISOString(),
      url: request.url || sender.tab?.url,
    };
    chrome.storage.local.get(['savedJobs'], result => {
      const jobs = result.savedJobs || [];
      jobs.push(jobData);
      chrome.storage.local.set({ savedJobs: jobs }, () => {
        sendResponse({ success: true, jobId: jobs.length - 1 });
      });
    });
    return true;
  }

  // ── Get saved jobs ──
  if (request.action === 'getSavedJobs') {
    chrome.storage.local.get(['savedJobs'], result => {
      sendResponse({ success: true, jobs: result.savedJobs || [] });
    });
    return true;
  }

  // ── Send job to CareerPilot Trackers page ──
  if (request.action === 'sendToCareerPilot') {
    const data  = request.data;
    const cpUrl = `${baseUrl(request.careerPilotUrl)}/trackers`;
    const id    = uid('cp_job');

    storeTemp(id, data).then(() => {
      const params = buildSafeParams(id, {
        action:    'addJob',
        position:  (data.position  || '').substring(0, 100),
        company:   (data.company   || '').substring(0, 100),
        jobUrl:    (data.jobUrl    || '').substring(0, 200),
        location:  (data.location  || '').substring(0, 100),
        minSalary: data.minSalary ? String(data.minSalary) : '',
        maxSalary: data.maxSalary ? String(data.maxSalary) : '',
        datePosted: (data.datePosted || '').substring(0, 50),
        deadline:   (data.deadline   || '').substring(0, 50),
        status:     data.status     || 'Bookmarked',
        excitement: data.excitement ? String(data.excitement) : '3',
      });
      chrome.tabs.create({ url: `${cpUrl}?${params}` });
      sendResponse({ success: true });
    });
    return true;
  }

  // ── Send contact/profile to CareerPilot Connections page ──
  if (request.action === 'sendContactToCareerPilot') {
    const data  = request.data;
    const cpUrl = `${baseUrl(request.careerPilotUrl)}/connections`;
    const id    = uid('cp_contact');

    storeTemp(id, data).then(() => {
      const params = buildSafeParams(id, {
        action:  'addContact',
        name:    (data.name    || '').substring(0, 100),
        company: (data.company || '').substring(0, 100),
      });
      chrome.tabs.create({ url: `${cpUrl}?${params}` });
      sendResponse({ success: true });
    });
    return true;
  }

  // ── Send profile to CareerPilot Resume Builder ──
  if (request.action === 'sendProfileToCareerPilot') {
    const data  = request.data;
    const cpUrl = `${baseUrl(request.careerPilotUrl)}/resume`;
    const id    = uid('cp_profile');

    storeTemp(id, data).then(() => {
      const params = buildSafeParams(id, {
        action: 'importProfile',
        source: 'linkedin_extension',
      });
      chrome.tabs.create({ url: `${cpUrl}?${params}` });
      sendResponse({ success: true });
    });
    return true;
  }

  // ── CareerPilot page fetches full data by ID ──
  if (request.action === 'getJobData') {
    const id = request.dataId;
    if (!id) { sendResponse({ success: false, error: 'No dataId' }); return true; }

    chrome.storage.local.get([id], result => {
      if (result[id]) {
        sendResponse({ success: true, data: result[id] });
        chrome.storage.local.remove([id]); // clean up after fetch
      } else {
        sendResponse({ success: false, error: 'Data not found or expired' });
      }
    });
    return true;
  }

  // ── Portal logout → clear extension session ──
  if (request.action === 'portalLogout') {
    chrome.storage.local.remove([AUTH_STORAGE_KEY], () => {
      console.log('[CareerPilot] Extension session cleared via portal logout.');
      sendResponse({ success: true });
    });
    return true;
  }

  return false; // unhandled — don't keep channel open
});
