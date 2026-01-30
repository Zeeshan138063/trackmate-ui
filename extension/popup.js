// Popup script for TrackMate extension

// --- Supabase Initialization ---
const SUPABASE_URL = "https://jdplobgtxzncwxhordah.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkcGxvYmd0eHpuY3d4aG9yZGFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MzcwMzksImV4cCI6MjA3MTIxMzAzOX0.ior862XnLyAtFwo-h2Umhj8tADMlv1dZOUwLCZWOV-c";

// Custom storage adapter for Supabase to use chrome.storage.local
const chromeStorageAdapter = {
  getItem: (key) => {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (result) => {
        resolve(result[key] || null);
      });
    });
  },
  setItem: (key, value) => {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, () => {
        resolve();
      });
    });
  },
  removeItem: (key) => {
    return new Promise((resolve) => {
      chrome.storage.local.remove([key], () => {
        resolve();
      });
    });
  },
};

// Initialize Supabase client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: chromeStorageAdapter,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  }
});

let currentJobData = null;
let currentScreenshot = null;
let currentMode = 'auto'; // auto, job, company, profile
let detectedMode = 'job'; // default fallthrough

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  const extractBtn = document.getElementById('extractBtn');
  const extractBtnText = extractBtn.querySelector('span');
  const captureBtn = document.getElementById('captureBtn');
  const saveBtn = document.getElementById('saveBtn');
  const openBtn = document.getElementById('openBtn');
  const trackMateUrlInput = document.getElementById('trackMateUrl');
  const modeSelect = document.getElementById('modeSelect');

  // Login UI elements
  const loginView = document.getElementById('loginView');
  const appView = document.getElementById('appView');
  const userProfile = document.getElementById('userProfile');
  const userEmail = document.getElementById('userEmail');
  const loginEmail = document.getElementById('loginEmail');
  const loginPassword = document.getElementById('loginPassword');
  const loginSubmitBtn = document.getElementById('loginSubmitBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  // Check auth state
  const { data: { session } } = await supabaseClient.auth.getSession();
  updateAuthUI(session);

  async function updateAuthUI(session) {
    if (session) {
      if (loginView) loginView.style.display = 'none';
      if (appView) appView.style.display = 'block';
      if (userProfile) userProfile.style.display = 'flex';
      if (userEmail) userEmail.textContent = session.user.email;

      // Sync session to TrackMate tabs
      syncSessionToTabs(session);
    } else {
      if (loginView) loginView.style.display = 'block';
      if (appView) appView.style.display = 'none';
      if (userProfile) userProfile.style.display = 'none';
    }
  }

  // Login Handler
  if (loginSubmitBtn) {
    loginSubmitBtn.addEventListener('click', async () => {
      const email = loginEmail.value;
      const password = loginPassword.value;

      if (!email || !password) {
        alert('Please enter email and password');
        return;
      }

      loginSubmitBtn.disabled = true;
      loginSubmitBtn.textContent = 'Logging in...';

      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        alert('Login failed: ' + error.message);
        loginSubmitBtn.disabled = false;
        loginSubmitBtn.textContent = 'Log In';
      } else {
        updateAuthUI(data.session);
      }
    });
  }

  // Logout Handler
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        // Use local scope to avoid 403 on global invalidation if token is sensitive
        // We handle tab sync manually anyway
        await supabaseClient.auth.signOut({ scope: 'local' });
      } catch (err) {
        console.warn("Server-side logout failed, clearing local state anyway", err);
      } finally {
        updateAuthUI(null);
        // Also clear tokens in tabs
        syncSessionToTabs(null);
      }
    });
  }

  // Load saved TrackMate URL
  chrome.storage.local.get(['trackMateUrl'], (result) => {
    if (result.trackMateUrl) {
      trackMateUrlInput.value = result.trackMateUrl;
    }
  });

  // Display Version & Update Status
  const manifest = chrome.runtime.getManifest();
  const versionEl = document.getElementById('appVersion');
  if (versionEl) {
    versionEl.textContent = `v${manifest.version}`;
  }
  const statusEl = document.getElementById('updateStatus');
  if (statusEl) {
    statusEl.innerHTML = '✨ Unified Auth Active';
    statusEl.style.display = 'block';
  }

  // Save TrackMate URL when changed
  if (trackMateUrlInput) {
    trackMateUrlInput.addEventListener('change', () => {
      chrome.storage.local.set({ trackMateUrl: trackMateUrlInput.value });
    });
  }

  // Detect initial mode from URL
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.url) {
    if (tab.url.includes('linkedin.com/in/')) {
      detectedMode = 'profile';
    } else if (tab.url.includes('linkedin.com/company/') || tab.url.includes('linkedin.com/school/')) {
      detectedMode = 'company';
    } else {
      detectedMode = 'job';
    }
    updateUIMode(detectedMode);
  }

  if (modeSelect) {
    modeSelect.addEventListener('change', () => {
      const selected = modeSelect.value;
      if (selected === 'auto') {
        updateUIMode(detectedMode);
      } else {
        updateUIMode(selected);
      }
    });
  }

  function updateUIMode(mode) {
    currentMode = mode;
    if (extractBtnText) {
      if (mode === 'profile') {
        extractBtnText.textContent = '👤 Extract Contact';
        document.querySelector('.header p').textContent = 'Capture Contact';
      } else if (mode === 'company') {
        extractBtnText.textContent = '🏢 Extract Company';
        document.querySelector('.header p').textContent = 'Capture Dream Company';
      } else {
        extractBtnText.textContent = '📋 Extract Job Data';
        document.querySelector('.header p').textContent = 'Capture Job Details';
      }
    }
  }

  // Extract job data
  if (extractBtn) {
    extractBtn.addEventListener('click', async () => {
      const effectiveMode = modeSelect.value === 'auto' ? detectedMode : modeSelect.value;
      setStatus(`Extracting ${effectiveMode} data...`, 'info');
      extractBtn.disabled = true;

      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        chrome.tabs.sendMessage(tab.id, { action: 'extractJobData', mode: effectiveMode }, (response) => {
          if (chrome.runtime.lastError) {
            setStatus('Error: ' + chrome.runtime.lastError.message, 'error');
            extractBtn.disabled = false;
            return;
          }

          if (response && response.success) {
            currentJobData = response.data;
            if (effectiveMode !== 'auto') {
              currentJobData.type = effectiveMode;
            }

            if (currentJobData.type === 'profile') {
              displayContactData(currentJobData);
              setStatus('Profile data extracted successfully!', 'success');
              saveBtn.textContent = '💾 Save Contact';
            } else if (currentJobData.type === 'company') {
              displayCompanyData(currentJobData);
              setStatus('Company data extracted successfully!', 'success');
              saveBtn.textContent = '💾 Save Company';
            } else {
              displayJobData(currentJobData);
              setStatus('Job data extracted successfully!', 'success');
              saveBtn.textContent = '💾 Save Job';
            }

            saveBtn.style.display = 'block';
            openBtn.style.display = 'block';

            if (currentJobData.type === 'profile') {
              const importResumeBtn = document.getElementById('importResumeBtn');
              if (importResumeBtn) importResumeBtn.style.display = 'block';
            }
          } else {
            setStatus('Failed to extract data', 'error');
          }
          extractBtn.disabled = false;
        });
      } catch (error) {
        setStatus('Error: ' + error.message, 'error');
        extractBtn.disabled = false;
      }
    });
  }

  // Capture screenshot
  if (captureBtn) {
    captureBtn.addEventListener('click', async () => {
      setStatus('Capturing screenshot...', 'info');
      captureBtn.disabled = true;

      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.id) {
          setStatus('Error: Could not get active tab', 'error');
          captureBtn.disabled = false;
          return;
        }

        chrome.runtime.sendMessage(
          { action: 'captureScreenshot', tabId: tab.id },
          (response) => {
            if (chrome.runtime.lastError) {
              setStatus('Error: ' + chrome.runtime.lastError.message, 'error');
              captureBtn.disabled = false;
              return;
            }

            if (!response) {
              setStatus('Error: No response from background script', 'error');
              captureBtn.disabled = false;
              return;
            }

            if (response.success) {
              currentScreenshot = response.screenshot;
              displayScreenshot(response.screenshot);
              setStatus('Screenshot captured!', 'success');
            } else {
              setStatus('Failed: ' + (response.error || 'Unknown error'), 'error');
            }
            captureBtn.disabled = false;
          }
        );
      } catch (error) {
        setStatus('Error: ' + error.message, 'error');
        captureBtn.disabled = false;
      }
    });
  }

  // Save to TrackMate
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      if (!currentJobData) {
        setStatus('Please extract data first', 'error');
        return;
      }

      setStatus('Saving to TrackMate...', 'info');
      saveBtn.disabled = true;

      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const isProfile = currentJobData.type === 'profile';
        const isCompany = currentJobData.type === 'company';

        if (isProfile) {
          const getVal = (id) => document.getElementById(id).value || '';
          const contactDataToSend = {
            name: getVal('contactName'),
            position: getVal('contactPosition'),
            company: getVal('contactCompany'),
            location: getVal('contactLocation'),
            relationship: getVal('contactRelationship'),
            notes: getVal('contactNotes'),
            linkedin_url: getVal('contactLinkedin') || currentJobData.profileUrl || tab.url || '',
            photo_url: currentJobData.photoUrl || ''
          };

          const savedDirectly = await saveContactDirectly(contactDataToSend);
          if (savedDirectly) {
            setStatus('Contact saved successfully!', 'success');
            saveBtn.disabled = true;
            saveBtn.textContent = 'Saved';
          } else {
            saveBtn.disabled = false;
          }
        } else if (isCompany) {
          const getVal = (id) => document.getElementById(id).value || '';
          const companyDataToSend = {
            name: getVal('companyName'),
            industry: getVal('companyIndustry'),
            size: getVal('companySize'),
            location: getVal('companyLocation'),
            website: getVal('companyWebsite'),
            linkedinUrl: getVal('companyLinkedin') || currentJobData.linkedinUrl || tab.url || '',
            about: getVal('companyAbout'),
            logoUrl: currentJobData.logoUrl,
            foundedYear: currentJobData.foundedYear,
            employeeCount: currentJobData.employeeCount
          };

          const savedDirectly = await saveCompanyDirectly(companyDataToSend);
          if (savedDirectly) {
            setStatus('Company saved successfully!', 'success');
            saveBtn.disabled = true;
            saveBtn.textContent = 'Saved';
          } else {
            saveBtn.disabled = false;
          }
        } else {
          // Job Mode
          const jobDataToSend = {
            position: document.getElementById('position').value || '',
            company: document.getElementById('company').value || '',
            job_url: currentJobData.jobUrl || tab.url || '',
            location: document.getElementById('location').value || '',
            description: document.getElementById('description').value || '',
            min_salary: document.getElementById('minSalary').value ? parseInt(document.getElementById('minSalary').value) : null,
            max_salary: document.getElementById('maxSalary').value ? parseInt(document.getElementById('maxSalary').value) : null,
            date_posted: document.getElementById('datePosted').value || null,
            deadline: document.getElementById('deadline').value || null,
            status: 'Bookmarked',
            excitement: 3,
            screenshot_url: currentScreenshot || null,
            url: tab.url || ''
          };

          const savedDirectly = await saveJobDirectly(jobDataToSend);
          if (savedDirectly) {
            setStatus('Job saved successfully!', 'success');
            saveBtn.disabled = true;
            saveBtn.textContent = 'Saved';
          } else {
            saveBtn.disabled = false;
          }
        }
      } catch (error) {
        setStatus('Error: ' + error.message, 'error');
        saveBtn.disabled = false;
      }
    });
  }

  // Open TrackMate
  if (openBtn) {
    openBtn.addEventListener('click', () => {
      const trackMateUrl = trackMateUrlInput.value || 'http://localhost:5173/trackers';
      chrome.tabs.create({ url: trackMateUrl });
    });
  }

  // Import Resume Button
  if (importResumeBtn) {
    importResumeBtn.addEventListener('click', async () => {
      if (!currentJobData || currentJobData.type !== 'profile') return;
      setStatus('Sending profile to Resume Builder...', 'info');
      importResumeBtn.disabled = true;

      const trackMateUrl = trackMateUrlInput.value || 'http://localhost:8080/trackers';
      chrome.runtime.sendMessage(
        {
          action: 'sendProfileToTrackMate',
          data: currentJobData,
          trackMateUrl: trackMateUrl
        },
        (response) => {
          if (response && response.success) {
            setStatus('Opening Resume Builder...', 'success');
          } else {
            setStatus('Failed to send profile', 'error');
          }
          importResumeBtn.disabled = false;
        }
      );
    });
  }

  // Auto-extract on popup open
  setTimeout(() => {
    if (detectedMode && appView && appView.style.display !== 'none') {
      extractBtn.click();
    }
  }, 500);
});

// --- UI Display Functions ---
function displayJobData(data) {
  const jobDataDiv = document.getElementById('jobData');
  if (jobDataDiv) jobDataDiv.style.display = 'block';
  const contactData = document.getElementById('contactData');
  if (contactData) contactData.style.display = 'none';
  const companyData = document.getElementById('companyData');
  if (companyData) companyData.style.display = 'none';

  if (document.getElementById('position')) document.getElementById('position').value = data.position || '';
  if (document.getElementById('company')) document.getElementById('company').value = data.company || '';
  if (document.getElementById('location')) document.getElementById('location').value = data.location || '';
  if (document.getElementById('minSalary')) document.getElementById('minSalary').value = data.minSalary || '';
  if (document.getElementById('maxSalary')) document.getElementById('maxSalary').value = data.maxSalary || '';
  if (document.getElementById('datePosted')) document.getElementById('datePosted').value = data.datePosted || '';
  if (document.getElementById('deadline')) document.getElementById('deadline').value = data.deadline || '';
  if (document.getElementById('description')) document.getElementById('description').value = data.description || '';
}

function displayContactData(data) {
  const jobData = document.getElementById('jobData');
  if (jobData) jobData.style.display = 'none';
  const contactDiv = document.getElementById('contactData');
  if (contactDiv) contactDiv.style.display = 'block';
  const companyData = document.getElementById('companyData');
  if (companyData) companyData.style.display = 'none';

  if (document.getElementById('contactName')) document.getElementById('contactName').value = data.name || '';
  if (document.getElementById('contactPosition')) document.getElementById('contactPosition').value = data.position || '';
  if (document.getElementById('contactCompany')) document.getElementById('contactCompany').value = data.company || '';
  if (document.getElementById('contactLocation')) document.getElementById('contactLocation').value = data.location || '';
  if (document.getElementById('contactLinkedin')) document.getElementById('contactLinkedin').value = data.profileUrl || '';
  if (document.getElementById('contactNotes')) document.getElementById('contactNotes').value = data.about || '';

  const contactPhoto = document.getElementById('contactPhoto');
  if (contactPhoto) {
    if (data.photoUrl) {
      contactPhoto.src = data.photoUrl;
      contactPhoto.style.display = 'inline-block';
    } else {
      contactPhoto.style.display = 'none';
    }
  }
  const captureBtn = document.getElementById('captureBtn');
  if (captureBtn) captureBtn.style.display = 'none';
}

function displayCompanyData(data) {
  const jobData = document.getElementById('jobData');
  if (jobData) jobData.style.display = 'none';
  const contactData = document.getElementById('contactData');
  if (contactData) contactData.style.display = 'none';
  const companyDiv = document.getElementById('companyData');
  if (companyDiv) companyDiv.style.display = 'block';

  if (document.getElementById('companyName')) document.getElementById('companyName').value = data.name || '';
  if (document.getElementById('companyIndustry')) document.getElementById('companyIndustry').value = data.industry || '';
  if (document.getElementById('companySize')) document.getElementById('companySize').value = data.size || '';
  if (document.getElementById('companyLocation')) document.getElementById('companyLocation').value = data.location || '';
  if (document.getElementById('companyWebsite')) document.getElementById('companyWebsite').value = data.website || '';
  if (document.getElementById('companyLinkedin')) document.getElementById('companyLinkedin').value = data.linkedinUrl || '';
  if (document.getElementById('companyAbout')) document.getElementById('companyAbout').value = data.about || '';
  const captureBtn = document.getElementById('captureBtn');
  if (captureBtn) captureBtn.style.display = 'none';
}

function displayScreenshot(screenshot) {
  const preview = document.getElementById('screenshotPreview');
  const img = document.getElementById('screenshotImg');
  if (img) img.src = screenshot;
  if (preview) preview.style.display = 'block';
}

function setStatus(message, type) {
  const statusDiv = document.getElementById('status');
  const statusText = document.getElementById('statusText');

  if (statusDiv && statusText) {
    statusDiv.className = `status ${type}`;
    statusText.textContent = message;
    statusDiv.style.display = 'flex';

    if (type === 'info') {
      statusText.innerHTML = '<span class="loading"></span> ' + message;
    }
  }
}

// --- Sync Functions ---
async function syncSessionToTabs(session) {
  const trackMateUrlInput = document.getElementById('trackMateUrl');
  const baseUrl = (trackMateUrlInput && trackMateUrlInput.value) || 'http://localhost:5173';
  let origin;
  try {
    origin = new URL(baseUrl).origin;
  } catch (e) {
    origin = 'http://localhost:5173';
  }
  const projectRef = "jdplobgtxzncwxhordah";
  const storageKey = `sb-${projectRef}-auth-token`;

  const tabs = await chrome.tabs.query({ url: `${origin}/*` });

  for (const tab of tabs) {
    try {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (key, value) => {
          const current = localStorage.getItem(key);
          if (value) {
            if (current !== value) {
              console.log("TrackMate: Syncing session from extension...");
              localStorage.setItem(key, value);
              window.location.reload();
            }
          } else {
            if (current) {
              console.log("TrackMate: Clearing session via extension...");
              localStorage.removeItem(key);
              window.location.reload();
            }
          }
        },
        args: [storageKey, session ? JSON.stringify(session) : null]
      });
    } catch (e) {
      console.warn("Sync failed for tab", tab.id, e);
    }
  }
}

// --- Direct API Integration ---
async function saveContactDirectly(contactData) {
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
      setStatus("Error: Session expired. Please log in again.", "error");
      return false;
    }

    const token = session.access_token;
    const userId = session.user.id;

    let finalNotes = contactData.notes || '';
    if (contactData.photo_url) {
      finalNotes += `\n\nProfile Photo: ${contactData.photo_url}`;
    }

    const response = await fetch(`${SUPABASE_URL}/rest/v1/contacts`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        user_id: userId,
        name: contactData.name,
        company: contactData.company,
        position: contactData.position,
        address: contactData.location,
        relationship: contactData.relationship,
        notes: finalNotes,
        linkedin_url: contactData.linkedin_url,
        email: '',
        phone: '',
        country: ''
      })
    });

    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    return true;
  } catch (e) {
    console.error("Save failed:", e);
    setStatus(`Error: ${e.message}`, "error");
    return false;
  }
}

async function saveCompanyDirectly(companyData) {
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return false;

    const token = session.access_token;
    const userId = session.user.id;

    const response = await fetch(`${SUPABASE_URL}/rest/v1/dream_companies`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        user_id: userId,
        name: companyData.name,
        industry: companyData.industry,
        company_size: companyData.size,
        location: companyData.location,
        website_url: companyData.website,
        social_media: { linkedin: companyData.linkedinUrl || '' },
        notes: companyData.about || '',
        logo_url: companyData.logoUrl || '',
        founded_year: companyData.foundedYear ? parseInt(companyData.foundedYear) : null,
        employee_count: companyData.employeeCount ? parseInt(companyData.employeeCount) : null,
        status: 'researching'
      })
    });

    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    return true;
  } catch (e) {
    console.error("Save failed:", e);
    setStatus(`Error: ${e.message}`, "error");
    return false;
  }
}

async function saveJobDirectly(jobData) {
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return false;

    const token = session.access_token;
    const userId = session.user.id;

    const response = await fetch(`${SUPABASE_URL}/rest/v1/jobs`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        user_id: userId,
        position: jobData.position,
        company: jobData.company,
        job_url: jobData.job_url,
        location: jobData.location,
        description: jobData.description,
        min_salary: jobData.min_salary,
        max_salary: jobData.max_salary,
        date_posted: jobData.date_posted,
        deadline: jobData.deadline,
        status: jobData.status,
        excitement: jobData.excitement,
        screenshot_url: jobData.screenshot_url
      })
    });

    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    return true;
  } catch (e) {
    console.error("Save failed:", e);
    setStatus(`Error: ${e.message}`, "error");
    return false;
  }
}
