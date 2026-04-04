// ================================================================
// JobOS — Popup Script v3.0
// ================================================================

'use strict';

// ────────────────────────────────────────────────────────────────
// Supabase Initialization
// ────────────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://jdplobgtxzncwxhordah.supabase.co';
const SUPABASE_PROJECT_REF = 'oevfiyocidpbeaycgnps';
const AUTH_STORAGE_KEY     = `sb-${SUPABASE_PROJECT_REF}-auth-token`;
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkcGxvYmd0eHpuY3d4aG9yZGFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MzcwMzksImV4cCI6MjA3MTIxMzAzOX0.ior862XnLyAtFwo-h2Umhj8tADMlv1dZOUwLCZWOV-c';

// Safeguard for environments (like some SidePanel contexts) without WebSocket
if (typeof globalThis.WebSocket === 'undefined') {
  globalThis.WebSocket = class {
    constructor() {}
    send() {}
    close() {}
    addEventListener() {}
    removeEventListener() {}
  };
}
if (typeof window !== 'undefined' && typeof window.WebSocket === 'undefined') {
  window.WebSocket = globalThis.WebSocket;
}
const chromeStorageAdapter = {
  getItem:    key        => new Promise(res => chrome.storage.local.get([key],     r => res(r[key] ?? null))),
  setItem:    (key, val) => new Promise(res => chrome.storage.local.set({ [key]: val }, res)),
  removeItem: key        => new Promise(res => chrome.storage.local.remove([key], res)),
};

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: chromeStorageAdapter,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

// ────────────────────────────────────────────────────────────────
// State
// ────────────────────────────────────────────────────────────────
let currentJobData  = null;
let currentScreenshot = null;
let detectedMode    = 'job';   // auto-detected from URL
let activeMode      = 'job';   // currently active (may be overridden)
let currentATS      = null;    // detected ATS on the page

// ────────────────────────────────────────────────────────────────
// Utility: getEl
// ────────────────────────────────────────────────────────────────
const el = id => document.getElementById(id);
const val = id => el(id)?.value || '';

// ────────────────────────────────────────────────────────────────
// DOM Ready
// ────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // ── Sidebar Mode Check ──
  const params = new URLSearchParams(window.location.search);
  const isSidebar = params.get('mode') === 'sidebar';
  if (isSidebar) {
    document.body.classList.add('sidebar-mode');
    const closeBtn = document.getElementById('sidebarCloseBtn');
    if (closeBtn) {
      closeBtn.style.display = 'block';
      closeBtn.addEventListener('click', () => {
        window.parent.postMessage({ action: 'closeJobOsSidebar' }, '*');
      });
    }
  }

  // ── Version label ──
  const manifest = chrome.runtime.getManifest();
  if (el('appVersion')) el('appVersion').textContent = `v${manifest.version}`;

  // ── Set default date to today ──
  const today = new Date().toISOString().split('T')[0];
  if (el('datePosted')) el('datePosted').value = today;

  // ── Star Rating handler ──
  document.querySelectorAll('.star-rating span').forEach(star => {
    star.addEventListener('click', e => {
      const val = parseInt(e.target.dataset.value);
      if (el('excitement')) el('excitement').value = val;
      // Update UI: Light up stars up to the selected value
      document.querySelectorAll('#excitementRating span').forEach(s => {
        const sVal = parseInt(s.dataset.value);
        s.classList.toggle('active', sVal <= val);
        s.style.color = sVal <= val ? '#FBBF24' : '#D1D5DB';
      });
    });
  });

  // ── Check auth ──
  const { data: { session } } = await supabaseClient.auth.getSession();
  updateAuthUI(session);

  // ── Detect mode from active tab URL + load cached state instantly ──
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.url) {
    if (/linkedin\.com\/in\//.test(tab.url))                             detectedMode = 'profile';
    else if (/linkedin\.com\/(company|school)\//.test(tab.url))          detectedMode = 'company';
    else                                                                   detectedMode = 'job';
    updateUIMode(detectedMode);
  }

  // ── Load cached tab state from background (instant, no DOM round-trip) ──
  // If background already has data from the reactive engine, show it immediately.
  // Also detects ATS from stored state.
  if (session) {
    loadTabState(tab);
  }

  // ── Mode selector ──
  el('modeSelect')?.addEventListener('change', () => {
    const selected = el('modeSelect').value;
    activeMode = selected === 'auto' ? detectedMode : selected;
    updateUIMode(activeMode);
  });

  // ── Login ──
  el('loginTabBtn')?.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://app.jobos.dev/auth' });
  });

  // ── Logout ──
  el('logoutBtn')?.addEventListener('click', handleLogout);

  // ── Extract ──
  el('extractBtn')?.addEventListener('click', () => handleExtract(false));

  // ── Screenshot ──
  el('captureBtn')?.addEventListener('click', handleScreenshot);

  // ── Save ──
  el('saveBtn')?.addEventListener('click', handleSave);

  // ── Open JobOS ──
  el('openBtn')?.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://app.jobos.dev/trackers' });
  });

  // ── Import to Resume ──
  el('importResumeBtn')?.addEventListener('click', handleImportResume);

  // ── Autofill button ──
  el('autofillBtn')?.addEventListener('click', handleAutofill);

  // ── Auto-load tab state on popup open ──
  loadTabState();

  // ── Listen for real-time SPA navigation updates from content.js ──
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === 'jobDataExtracted' && msg.data) {
      console.log('Real-time data update received (SPA Nav):', msg.data);
      currentJobData = msg.data;
      _renderExtractedData(currentJobData);
    } else if (msg.action === 'atsDetected' && msg.ats) {
      currentATS = msg.ats;
      showATSBanner(currentATS);
    }
  });
});

// ────────────────────────────────────────────────────────────────
// LOAD TAB STATE (instant display from background store)
// Web App Login handled via Tab Redirect
// ────────────────────────────────────────────────────────────────
// Returns true only if data has at least one real field filled
function _hasUsefulData(data) {
  if (!data) return false;
  return !!(data.name || data.position || data.company || data.description);
}

async function loadTabState(tab) {
  // Fetch tab state robustly on init
  const fetchState = (isRetry = false) => {
    chrome.runtime.sendMessage({ action: 'getTabState' }, response => {
      const state = response?.state;
      if (response?.success && state) {
        updateAuthUI(state);
        const data      = state.data;
        const isStale   = (Date.now() - (state.updatedAt || 0)) > 30000;
        const isGood    = _hasUsefulData(data);

        if (state.ats || state.isApplyPage) {
          currentATS = state.ats;
          showATSBanner(state.ats);
        }

        if (data && !isStale && isGood) {
          currentJobData = data;
          _renderExtractedData(data);
        } else if (state.url?.includes('linkedin.com/jobs/')) {
          // Fresh extract if missing/stale on LinkedIn
          handleExtract(true); // Pass true for isAuto
        }
      } else if (!isRetry) {
        setTimeout(() => fetchState(true), 300);
      }
    });
  };
  fetchState();

  chrome.runtime.sendMessage({ action: 'getTabState' }, response => {
    if (!response?.success) {
      // No cached state yet — trigger a live extract
      el('extractBtn')?.click();
      return;
    }

    const state   = response.state;
    const isStale = !state?.updatedAt || (Date.now() - state.updatedAt) > 30_000;
    const isGood  = _hasUsefulData(state?.data);

    // Show ATS banner from stored state
    if (state?.ats || state?.isApplyPage) {
      currentATS = state.ats;
      showATSBanner(state.ats);
    }

    // Only use cached data if it's fresh AND has actual content.
    // Empty/skeleton data (LinkedIn hydration race) triggers a live extract instead.
    if (state?.data && !isStale && isGood) {
      currentJobData = state.data;
      _renderExtractedData(state.data);
    } else {
      // Stale, missing, or empty — do a fresh live extract
      // Small delay lets the popup finish rendering before messaging content script
      setTimeout(() => el('extractBtn')?.click(), 250);
    }
  });
}

function updateAuthUI(session) {
  const loggedIn = !!session;
  el('loginView')?.style  && (el('loginView').style.display   = loggedIn ? 'none'  : 'block');
  el('appView')?.style    && (el('appView').style.display     = loggedIn ? 'block' : 'none');
  el('userProfile')?.style && (el('userProfile').style.display = loggedIn ? 'flex'  : 'none');
  if (loggedIn && session?.user?.email && el('userEmail')) {
      el('userEmail').textContent = session.user.email;
      const loginNote = document.querySelector('.settings .note');
      if (loginNote) loginNote.style.display = 'none';
      syncSessionToTabs(session);
    }
}

async function handleLogout() {
  try {
    await supabaseClient.auth.signOut({ scope: 'local' });
  } catch (_) { /* ignore server-side errors */ }
  updateAuthUI(null);
  syncSessionToTabs(null);
  currentJobData    = null;
  currentScreenshot = null;
  // Hide data panels
  ['jobData', 'contactData', 'companyData', 'saveBtn', 'openBtn', 'importResumeBtn', 'autofillBtn', 'screenshotPreview'].forEach(id => {
    if (el(id)) el(id).style.display = 'none';
  });
  setStatus('Logged out', 'info');
}

// ────────────────────────────────────────────────────────────────
// MODE UI
// ────────────────────────────────────────────────────────────────
function updateUIMode(mode) {
  activeMode = mode;
  const extractSpan = el('extractBtn')?.querySelector('span');
  const headerP     = document.querySelector('.header p');
  const modeLabels  = {
    profile: { btn: '👤 Extract Contact',       header: 'Capture Contact'      },
    company: { btn: '🏢 Extract Company',        header: 'Capture Dream Company' },
    job:     { btn: '📋 Extract Job Data',        header: 'Capture Job Details'   },
  };
  const labels = modeLabels[mode] || modeLabels.job;
  if (extractSpan) extractSpan.textContent = labels.btn;
  if (headerP)     headerP.textContent     = labels.header;
}

// ────────────────────────────────────────────────────────────────
// ATS DETECTION
// ────────────────────────────────────────────────────────────────
async function detectATSOnTab(tabId) {
  try {
    chrome.tabs.sendMessage(tabId, { action: 'detectATS' }, response => {
      if (chrome.runtime.lastError) return;
      if (response?.ats) {
        currentATS = response.ats;
        showATSBanner(response.ats);
      }
    });
  } catch (_) {}
}

// ────────────────────────────────────────────────────────────────
// RENDER EXTRACTED DATA (shared by manual extract + background push)
// ────────────────────────────────────────────────────────────────
function _renderExtractedData(data) {
  if (!data) return;

  if (data.type === 'profile') {
    displayContactData(data);
    if (el('saveBtn')) { el('saveBtn').style.display = 'block'; el('saveBtn').querySelector('span').textContent = '💾 Save Contact'; }
    if (el('importResumeBtn')) el('importResumeBtn').style.display = 'block';
    setStatus('Profile ready ✓', 'success');
    renderTopSkills(null); // hide skills card for profiles
  } else if (data.type === 'company') {
    displayCompanyData(data);
    if (el('saveBtn')) { el('saveBtn').style.display = 'block'; el('saveBtn').querySelector('span').textContent = '💾 Save Company'; }
    setStatus('Company ready ✓', 'success');
    renderTopSkills(null);
  } else {
    displayJobData(data);
    if (el('saveBtn')) { el('saveBtn').style.display = 'block'; el('saveBtn').querySelector('span').textContent = '💾 Save Job'; }
    setStatus('Job ready ✓', 'success');
    // ── Extract top skills from description (client-side, instant) ──
    renderTopSkills(data.description || '');
  }
  if (el('openBtn')) el('openBtn').style.display = 'block';
}

// ────────────────────────────────────────────────────────────────
// TOP SKILLS CARD
// Client-side extraction via skills-db.js — zero API calls
// ────────────────────────────────────────────────────────────────
function renderTopSkills(description) {
  const card = el('topSkillsCard');
  if (!card) return;

  if (!description || description.length < 50 || typeof JobOSSkillsDB === 'undefined') {
    card.style.display = 'none';
    return;
  }

  const skills = JobOSSkillsDB.extractSkills(description, 8);
  if (!skills.length) { card.style.display = 'none'; return; }

  const chipsEl = el('topSkillsChips');
  if (!chipsEl) return;

  // Category color map
  const catColors = {
    languages:        { bg: '#EEF2FF', text: '#4338CA', dot: '#6366F1' },
    frontend:         { bg: '#F0FDF4', text: '#166534', dot: '#22C55E' },
    backend:          { bg: '#FFF7ED', text: '#9A3412', dot: '#F97316' },
    cloud:            { bg: '#ECFEFF', text: '#155E75', dot: '#06B6D4' },
    devops:           { bg: '#FDF4FF', text: '#7E22CE', dot: '#A855F7' },
    databases:        { bg: '#FFF1F2', text: '#9F1239', dot: '#F43F5E' },
    ai_ml:            { bg: '#FFFBEB', text: '#92400E', dot: '#F59E0B' },
    data_engineering: { bg: '#F0F9FF', text: '#0C4A6E', dot: '#0EA5E9' },
    mobile:           { bg: '#F0FDF4', text: '#14532D', dot: '#16A34A' },
    security:         { bg: '#FFF1F2', text: '#881337', dot: '#E11D48' },
    design:           { bg: '#FDF4FF', text: '#6B21A8', dot: '#C026D3' },
    soft_skills:      { bg: '#F8FAFC', text: '#475569', dot: '#94A3B8' },
    discovered:       { bg: '#FDF4FF', text: '#86198F', dot: '#D946EF' }, // magenta style for new tech
    other:            { bg: '#F9FAFB', text: '#374151', dot: '#9CA3AF' },
  };

  chipsEl.innerHTML = skills.map(({ skill, category }) => {
    const c = catColors[category] || catColors.other;
    return `<span class="skill-chip" style="background:${c.bg}; color:${c.text};">
      <span class="skill-dot" style="background:${c.dot};"></span>
      ${skill}
    </span>`;
  }).join('');

  card.style.display = 'block';
}

function showATSBanner(ats) {
  const banner = el('atsBanner');
  if (!banner) return;
  const atsNames = {
    workday:         'Workday',
    greenhouse:      'Greenhouse',
    lever:           'Lever',
    icims:           'iCIMS',
    smartrecruiters: 'SmartRecruiters',
    workable:        'Workable',
    taleo:           'Taleo (Oracle)',
    rozee:           'Rozee.pk',
    naukri:          'Naukri',
    generic:         'Generic ATS',
  };
  banner.textContent = `🎯 ATS detected: ${atsNames[ats] || ats} — Autofill available`;
  el('appView').style.display   = 'block';
    
  // Hide the 'Must be logged in' warning if we have a valid session
  const loginNote = document.querySelector('.settings .note');
  if (loginNote) loginNote.style.display = 'none';

  if (el('accountEmail')) {
    el('autofillBtn').style.display = 'block';
  }
  banner.style.display = 'block';
  if (el('autofillBtn')) el('autofillBtn').style.display = 'block';
}

// ────────────────────────────────────────────────────────────────
// EXTRACT
// ────────────────────────────────────────────────────────────────
async function handleExtract(isAuto = false) {
  const mode      = el('modeSelect')?.value === 'auto' ? detectedMode : (el('modeSelect')?.value || detectedMode);
  const extractBtn = el('extractBtn');
  extractBtn.disabled = true;
  if (!isAuto) setStatus(`Extracting ${mode} data…`, 'info');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(tab.id, { action: 'extractJobData', mode }, response => {
      extractBtn.disabled = false;

      if (chrome.runtime.lastError) {
        if (!isAuto) setStatus('Could not access this page. Try refreshing.', 'error');
        return;
      }
      if (!response?.success) {
        if (!isAuto) setStatus('Extraction failed. Is this a job page?', 'error');
        return;
      }

      currentJobData = response.data;
      if (mode !== 'auto') currentJobData.type = mode;
      _renderExtractedData(currentJobData);
    });
  } catch (err) {
    extractBtn.disabled = false;
    setStatus('Error: ' + err.message, 'error');
  }
}

// ────────────────────────────────────────────────────────────────
// SCREENSHOT
// ────────────────────────────────────────────────────────────────
async function handleScreenshot() {
  const btn = el('captureBtn');
  btn.disabled = true;
  setStatus('Capturing screenshot…', 'info');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.runtime.sendMessage({ action: 'captureScreenshot', tabId: tab.id }, response => {
      btn.disabled = false;
      if (response?.success) {
        currentScreenshot = response.screenshot;
        displayScreenshot(response.screenshot);
        setStatus('Screenshot captured!', 'success');
      } else {
        setStatus('Screenshot failed: ' + (response?.error || 'unknown'), 'error');
      }
    });
  } catch (err) {
    btn.disabled = false;
    setStatus('Error: ' + err.message, 'error');
  }
}

// ────────────────────────────────────────────────────────────────
// SAVE (direct Supabase API — no redirect needed)
// ────────────────────────────────────────────────────────────────
async function handleSave() {
  if (!currentJobData) { setStatus('Extract data first', 'error'); return; }

  const saveBtn = el('saveBtn');
  saveBtn.disabled = true;
  setStatus('Saving to JobOS…', 'info');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    let success = false;

    if (currentJobData.type === 'profile') {
      success = await saveContactDirectly({
        name:          val('contactName'),
        position:      val('contactPosition'),
        company:       val('contactCompany'),
        location:      val('contactLocation'),
        relationship:  val('contactRelationship'),
        notes:         val('contactNotes'),
        linkedin_url:  val('contactLinkedin') || currentJobData.profileUrl || tab.url || '',
        photo_url:     currentJobData.photoUrl || '',
      });
    } else if (currentJobData.type === 'company') {
      success = await saveCompanyDirectly({
        name:         val('companyName'),
        industry:     val('companyIndustry'),
        size:         val('companySize'),
        location:     val('companyLocation'),
        website:      val('companyWebsite'),
        linkedinUrl:  val('companyLinkedin') || currentJobData.linkedinUrl || tab.url || '',
        about:        val('companyAbout'),
        logoUrl:      currentJobData.logoUrl      || '',
        foundedYear:  currentJobData.foundedYear  || '',
        employeeCount: currentJobData.employeeCount || '',
      });
    } else {
      success = await saveJobDirectly({
        position:    val('position'),
        company:     val('company'),
        job_url:     currentJobData.jobUrl || tab.url || '',
        location:    val('location'),
        description: val('description'),
        min_salary:  val('minSalary') ? parseInt(val('minSalary')) : null,
        max_salary:  val('maxSalary') ? parseInt(val('maxSalary')) : null,
        date_posted: val('datePosted') || null,
        deadline:    val('deadline')   || null,
        status:      'Bookmarked',
        excitement:  parseInt(el('excitement')?.value) || 3,
      });
    }

    if (success) {
      setStatus('Saved successfully! ✓', 'success');
      saveBtn.querySelector('span').textContent = '✅ Saved to JobOS';
      saveBtn.style.background = '#10b981';
      if (el('extractBtn')) el('extractBtn').classList.add('btn-secondary');
      
      // Notify parent sidebar to update badge
      if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, { action: 'jobSavedEvent' }).catch(() => {});
      }
    } else {
      saveBtn.disabled = false;
    }
  } catch (err) {
    saveBtn.disabled = false;
    setStatus('Error: ' + err.message, 'error');
  }
}

// ────────────────────────────────────────────────────────────────
// AUTOFILL ATS FORM
// ────────────────────────────────────────────────────────────────
async function handleAutofill() {
  const btn = el('autofillBtn');
  btn.disabled = true;
  setStatus('Fetching your profile for autofill…', 'info');

  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) { setStatus('Please log in first', 'error'); btn.disabled = false; return; }

    // Fetch master profile from Supabase
    const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?user_id=eq.${session.user.id}&select=*&limit=1`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) throw new Error(`Profile fetch failed: ${res.status}`);
    const profiles = await res.json();
    const profile  = profiles[0];

    if (!profile) {
      setStatus('No profile found. Complete your JobOS profile first.', 'error');
      btn.disabled = false;
      return;
    }

    // Map JobOS profile schema → autofiller schema
    const autofillProfile = {
      firstName:    profile.first_name  || profile.name?.split(' ')[0] || '',
      lastName:     profile.last_name   || profile.name?.split(' ').slice(1).join(' ') || '',
      email:        profile.email       || session.user.email || '',
      phone:        profile.phone       || '',
      location:     profile.location    || '',
      city:         profile.city        || profile.location?.split(',')[0] || '',
      linkedinUrl:  profile.linkedin_url || '',
      githubUrl:    profile.github_url  || '',
      portfolioUrl: profile.website_url || profile.portfolio_url || '',
      resumePdfUrl: profile.resume_pdf_url || null,
      coverLetterText: null, // Could be fetched separately per job
    };

    setStatus(`Autofilling ${currentATS || 'form'}…`, 'info');

    // Send to content script
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(tab.id, { action: 'autofill', profile: autofillProfile }, response => {
      btn.disabled = false;
      if (response?.success) {
        setStatus(`✓ Autofilled ${response.ats || 'form'} successfully!`, 'success');
      } else {
        setStatus('Autofill failed: ' + (response?.reason || response?.error || 'unknown'), 'error');
      }
    });

  } catch (err) {
    btn.disabled = false;
    setStatus('Autofill error: ' + err.message, 'error');
  }
}

// ────────────────────────────────────────────────────────────────
// IMPORT PROFILE TO RESUME BUILDER
// ────────────────────────────────────────────────────────────────
async function handleImportResume() {
  if (!currentJobData || currentJobData.type !== 'profile') return;
  const btn = el('importResumeBtn');
  btn.disabled = true;
  setStatus('Opening Resume Builder…', 'info');

  chrome.runtime.sendMessage({
    action:        'sendProfileToJobOS',
    data:          currentJobData,
    jobosUrl: 'https://app.jobos.dev',
  }, response => {
    btn.disabled = false;
    if (!response?.success) setStatus('Failed to open Resume Builder', 'error');
  });
}

// ────────────────────────────────────────────────────────────────
// DISPLAY FUNCTIONS
// ────────────────────────────────────────────────────────────────
function displayJobData(data) {
  _showOnly('jobData');
  _setVal('position',    data.position    || '');
  _setVal('company',     data.company     || '');
  _setVal('location',    data.location    || '');
  _setVal('minSalary',   data.minSalary   || '');
  _setVal('maxSalary',   data.maxSalary   || '');
  
  const today = new Date().toISOString().split('T')[0];
  _setVal('datePosted',  data.datePosted  || el('datePosted').value || today);
  _setVal('deadline',    data.deadline    || '');
  _setVal('description', data.description || '');
  if (el('captureBtn')) el('captureBtn').style.display = 'block';
  
  // Handle Excitement level
  const exc = parseInt(data.excitement) || 3;
  if (el('excitement')) el('excitement').value = exc;
  document.querySelectorAll('#excitementRating span').forEach(s => {
    const sVal = parseInt(s.dataset.value);
    s.classList.toggle('active', sVal <= exc);
    s.style.color = sVal <= exc ? '#FBBF24' : '#D1D5DB';
  });
}

function displayContactData(data) {
  _showOnly('contactData');
  _setVal('contactName',         data.name       || '');
  _setVal('contactPosition',     data.position   || '');
  _setVal('contactCompany',      data.company    || '');
  _setVal('contactLocation',     data.location   || '');
  _setVal('contactLinkedin',     data.profileUrl || '');
  _setVal('contactNotes',        data.about      || '');

  const photo = el('contactPhoto');
  if (photo) {
    photo.src          = data.photoUrl || '';
    photo.style.display = data.photoUrl ? 'inline-block' : 'none';
  }
  if (el('captureBtn')) el('captureBtn').style.display = 'none';
}

function displayCompanyData(data) {
  _showOnly('companyData');
  _setVal('companyName',     data.name       || '');
  _setVal('companyIndustry', data.industry   || '');
  _setVal('companySize',     data.size       || '');
  _setVal('companyLocation', data.location   || '');
  _setVal('companyWebsite',  data.website    || '');
  _setVal('companyLinkedin', data.linkedinUrl || '');
  _setVal('companyAbout',    data.about      || '');
  if (el('captureBtn')) el('captureBtn').style.display = 'none';
}

function displayScreenshot(src) {
  const preview = el('screenshotPreview');
  const img     = el('screenshotImg');
  if (img)     img.src = src;
  if (preview) preview.style.display = 'block';
}

// ────────────────────────────────────────────────────────────────
// STATUS BAR
// ────────────────────────────────────────────────────────────────
function setStatus(message, type = 'info') {
  const statusDiv  = el('status');
  const statusText = el('statusText');
  if (!statusDiv || !statusText) return;

  statusDiv.className     = `status ${type}`;
  statusDiv.style.display = 'flex';

  if (type === 'info') {
    statusText.innerHTML = `<span class="loading"></span> ${message}`;
  } else {
    statusText.textContent = message;
  }
}

// ────────────────────────────────────────────────────────────────
// SUPABASE DIRECT API CALLS
// ────────────────────────────────────────────────────────────────
async function _getToken() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) { setStatus('Session expired. Please log in again.', 'error'); return null; }
  return { token: session.access_token, userId: session.user.id };
}

async function _post(endpoint, body) {
  const auth = await _getToken();
  if (!auth) return false;

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
    method:  'POST',
    headers: {
      apikey:          SUPABASE_KEY,
      Authorization:   `Bearer ${auth.token}`,
      'Content-Type':  'application/json',
      Prefer:          'return=minimal',
    },
    body: JSON.stringify({ user_id: auth.userId, ...body }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => res.status);
    throw new Error(`API ${res.status}: ${errText}`);
  }
  return true;
}

async function saveJobDirectly(data) {
  try {
    return await _post('jobs', {
      position:      data.position,
      company:       data.company,
      job_url:       data.job_url,
      location:      data.location,
      description:   data.description,
      min_salary:    data.min_salary,
      max_salary:    data.max_salary,
      date_posted:   data.date_posted,
      deadline:      data.deadline,
      status:        data.status,
      excitement:    data.excitement,
    });
  } catch (e) {
    console.error('saveJobDirectly:', e);
    setStatus(`Save failed: ${e.message}`, 'error');
    return false;
  }
}

async function saveContactDirectly(data) {
  try {
    let notes = data.notes || '';
    if (data.photo_url) notes += `\n\nProfile Photo: ${data.photo_url}`;

    return await _post('contacts', {
      name:         data.name,
      company:      data.company,
      position:     data.position,
      address:      data.location,
      relationship: data.relationship,
      notes:        notes,
      linkedin_url: data.linkedin_url,
      email:        '',
      phone:        '',
      country:      '',
    });
  } catch (e) {
    console.error('saveContactDirectly:', e);
    setStatus(`Save failed: ${e.message}`, 'error');
    return false;
  }
}

async function saveCompanyDirectly(data) {
  try {
    return await _post('dream_companies', {
      name:           data.name,
      industry:       data.industry,
      company_size:   data.size,
      location:       data.location,
      website_url:    data.website,
      social_media:   { linkedin: data.linkedinUrl || '' },
      notes:          data.about || '',
      logo_url:       data.logoUrl || '',
      founded_year:   data.foundedYear   ? parseInt(data.foundedYear)   : null,
      employee_count: data.employeeCount ? parseInt(data.employeeCount) : null,
      status:         'researching',
    });
  } catch (e) {
    console.error('saveCompanyDirectly:', e);
    setStatus(`Save failed: ${e.message}`, 'error');
    return false;
  }
}

// ────────────────────────────────────────────────────────────────
// SESSION SYNC TO JOBOS TABS
// ────────────────────────────────────────────────────────────────
async function syncSessionToTabs(session) {
  const cpUrl       = 'https://app.jobos.dev';
  const storageKey  = `sb-${SUPABASE_URL.split('//')[1].split('.')[0]}-auth-token`;

  let origin;
  try { origin = new URL(cpUrl).origin; } catch (_) { origin = 'https://app.jobos.dev'; }

  const tabs = await chrome.tabs.query({ url: `${origin}/*` });
  for (const tab of tabs) {
    try {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (key, value) => {
          if (value) {
            if (localStorage.getItem(key) !== value) {
              localStorage.setItem(key, value);
              window.location.reload();
            }
          } else {
            if (localStorage.getItem(key)) {
              localStorage.removeItem(key);
              window.location.reload();
            }
          }
        },
        args: [storageKey, session ? JSON.stringify(session) : null],
      });
    } catch (_) { /* tab may not be scriptable */ }
  }
}

// ────────────────────────────────────────────────────────────────
// PRIVATE HELPERS
// ────────────────────────────────────────────────────────────────
function _showOnly(panelId) {
  ['jobData', 'contactData', 'companyData'].forEach(id => {
    if (el(id)) el(id).style.display = id === panelId ? 'block' : 'none';
  });
}

function _setVal(id, value) {
  const input = el(id);
  if (input) input.value = value;
}
