// Popup script for TrackMate extension

let currentJobData = null;
let currentScreenshot = null;
let currentMode = 'auto'; // auto, job, company, profile
let detectedMode = 'job'; // default fallthrough

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  const extractBtn = document.getElementById('extractBtn');
  const extractBtnText = extractBtn.querySelector('span'); // Assuming <span> inside button
  const captureBtn = document.getElementById('captureBtn');
  const saveBtn = document.getElementById('saveBtn');
  const openBtn = document.getElementById('openBtn');
  const trackMateUrlInput = document.getElementById('trackMateUrl');
  const modeSelect = document.getElementById('modeSelect');

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
  // Always show the update badge for this version to reassure user
  const statusEl = document.getElementById('updateStatus');
  if (statusEl) {
    statusEl.innerHTML = '✨ Dream Companies Fixed'; // Specific message
    statusEl.style.display = 'block';
  }

  // Save TrackMate URL when changed
  trackMateUrlInput.addEventListener('change', () => {
    chrome.storage.local.set({ trackMateUrl: trackMateUrlInput.value });
  });

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

  // specifics for manual mode
  modeSelect.addEventListener('change', () => {
    const selected = modeSelect.value;
    if (selected === 'auto') {
      updateUIMode(detectedMode);
    } else {
      updateUIMode(selected);
    }
  });

  function updateUIMode(mode) {
    currentMode = mode;
    // Update button text
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

  // Extract job data
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
          // Force type override if we manually selected a mode and the content script was confused (optional, but good safety)
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

  // Capture screenshot
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

      // Use a promise-based approach for better error handling
      chrome.runtime.sendMessage(
        { action: 'captureScreenshot', tabId: tab.id },
        (response) => {
          // Check for runtime errors first
          if (chrome.runtime.lastError) {
            setStatus('Error: ' + chrome.runtime.lastError.message, 'error');
            captureBtn.disabled = false;
            return;
          }

          // Check response
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

  // Save to TrackMate
  saveBtn.addEventListener('click', async () => {
    if (!currentJobData) {
      setStatus('Please extract data first', 'error');
      return;
    }

    setStatus('Opening TrackMate... Make sure you are logged in!', 'info');
    saveBtn.disabled = true;

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const trackMateUrl = trackMateUrlInput.value || 'http://localhost:8080/trackers';

      const isProfile = currentJobData.type === 'profile';
      const isCompany = currentJobData.type === 'company';

      if (isProfile) {
        // Contact Mode
        // Helper to get value
        const getVal = (id) => document.getElementById(id).value || '';

        const contactDataToSend = {
          name: getVal('contactName'),
          position: getVal('contactPosition'),
          company: getVal('contactCompany'),
          location: getVal('contactLocation'), // Will be mapped to address
          relationship: getVal('contactRelationship'),
          notes: getVal('contactNotes'),
          linkedin_url: getVal('contactLinkedin') || currentJobData.profileUrl || tab.url || '',
          photo_url: currentJobData.photoUrl || ''
        };

        // Attempt direct save
        const savedDirectly = await saveContactDirectly(contactDataToSend);

        if (savedDirectly) {
          setStatus('Contact saved directly to TrackMate!', 'success');
          // Disable save button to prevent double submits
          saveBtn.disabled = true;
          saveBtn.textContent = 'Saved';
        } else {
          // Fallback or error
          saveBtn.disabled = false;
        }
      } else if (isCompany) {
        // Company Mode
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

        // Attempt direct save
        const savedDirectly = await saveCompanyDirectly(companyDataToSend);

        if (savedDirectly) {
          setStatus('Company saved directly to TrackMate!', 'success');
          saveBtn.disabled = true;
          saveBtn.textContent = 'Saved';
        } else {
          saveBtn.disabled = false;
        }
      } else {
        // Job Mode (Existing logic)
        const jobDataToSend = {
          position: document.getElementById('position').value || '',
          company: document.getElementById('company').value || '',
          jobUrl: currentJobData.jobUrl || tab.url || '',
          location: document.getElementById('location').value || '',
          description: document.getElementById('description').value || '',
          minSalary: document.getElementById('minSalary').value ? parseInt(document.getElementById('minSalary').value) : null,
          maxSalary: document.getElementById('maxSalary').value ? parseInt(document.getElementById('maxSalary').value) : null,
          datePosted: document.getElementById('datePosted').value || null,
          deadline: document.getElementById('deadline').value || null,
          status: 'Bookmarked', // Default status
          excitement: 3, // Default excitement
          screenshot: currentScreenshot || null, // Will be stored, not in URL
          url: tab.url || ''
        };

        chrome.runtime.sendMessage(
          {
            action: 'sendToTrackMate',
            data: jobDataToSend,
            trackMateUrl: trackMateUrl
          },
          (response) => {
            if (response && response.success) {
              setStatus('Opening TrackMate with job data...', 'success');
              setTimeout(() => {
                setStatus('Job data sent to TrackMate!', 'success');
              }, 1000);
            } else {
              setStatus('Failed to send to TrackMate', 'error');
            }
            saveBtn.disabled = false;
          }
        );
      }
    } catch (error) {
      setStatus('Error: ' + error.message, 'error');
      saveBtn.disabled = false;
    }
  });

  // Open TrackMate
  openBtn.addEventListener('click', () => {
    const trackMateUrl = trackMateUrlInput.value || 'http://localhost:5173/trackers';
    chrome.tabs.create({ url: trackMateUrl });
  });

  // Import Resume Button
  const importResumeBtn = document.getElementById('importResumeBtn');
  if (importResumeBtn) {
    importResumeBtn.addEventListener('click', async () => {
      if (!currentJobData || currentJobData.type !== 'profile') return;

      setStatus('Sending profile to Resume Builder...', 'info');
      importResumeBtn.disabled = true;

      // Use background script
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

  // Auto-extract on popup open - DELAYED to allow detecting mode first
  setTimeout(() => {
    // Check if we have a saved result from lazy loading or just click it
    // But we want to respect the detected mode which happened quickly
    if (detectedMode) {
      // Maybe we don't auto-click if we want user to see the change? 
      // User requested "buttons not making full sense", so maybe seeing "Extract Company" is better than auto-clicking immediately.
      // But standard UX is speed. Let's auto-click but ensures text is updated first.
      extractBtn.click();
    }
  }, 500);
});

// Display job data in popup inputs
function displayJobData(data) {
  const jobDataDiv = document.getElementById('jobData');
  jobDataDiv.style.display = 'block';
  document.getElementById('contactData').style.display = 'none';
  document.getElementById('companyData').style.display = 'none';

  document.getElementById('position').value = data.position || '';
  document.getElementById('company').value = data.company || '';
  document.getElementById('location').value = data.location || '';
  document.getElementById('minSalary').value = data.minSalary || '';
  document.getElementById('maxSalary').value = data.maxSalary || '';
  document.getElementById('datePosted').value = data.datePosted || '';
  document.getElementById('deadline').value = data.deadline || '';
  document.getElementById('description').value = data.description || '';
}

// Display contact data
function displayContactData(data) {
  document.getElementById('jobData').style.display = 'none';
  const contactDiv = document.getElementById('contactData');
  contactDiv.style.display = 'block';
  document.getElementById('companyData').style.display = 'none';

  document.getElementById('contactName').value = data.name || '';
  document.getElementById('contactPosition').value = data.position || '';
  document.getElementById('contactCompany').value = data.company || '';
  document.getElementById('contactLocation').value = data.location || '';
  document.getElementById('contactLinkedin').value = data.profileUrl || '';
  document.getElementById('contactNotes').value = data.about || '';

  // Photo
  if (data.photoUrl) {
    document.getElementById('contactPhoto').src = data.photoUrl;
    document.getElementById('contactPhoto').style.display = 'inline-block';
  } else {
    document.getElementById('contactPhoto').style.display = 'none';
  }

  // Disable capture btn for profile mode if not needed, or keep it
  document.getElementById('captureBtn').style.display = 'none'; // Hide screenshot for profile for simplicity
}

// Display screenshot
function displayScreenshot(screenshot) {
  const preview = document.getElementById('screenshotPreview');
  const img = document.getElementById('screenshotImg');
  img.src = screenshot;
  preview.style.display = 'block';
}

// Set status message
function setStatus(message, type) {
  const statusDiv = document.getElementById('status');
  const statusText = document.getElementById('statusText');

  statusDiv.className = `status ${type}`;
  statusText.textContent = message;
  statusDiv.style.display = 'flex';

  if (type === 'info') {
    statusText.innerHTML = '<span class="loading"></span> ' + message;
  }
}

// --- Direct API Integration ---

const SUPABASE_URL = "https://jdplobgtxzncwxhordah.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkcGxvYmd0eHpuY3d4aG9yZGFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MzcwMzksImV4cCI6MjA3MTIxMzAzOX0.ior862XnLyAtFwo-h2Umhj8tADMlv1dZOUwLCZWOV-c";

async function saveContactDirectly(contactData) {
  try {
    setStatus('Looking for active TrackMate tab...', 'info');
    const token = await getAuthToken();

    if (!token) {
      console.log("No auth token found, falling back to redirect.");
      setStatus("Error: Please open TrackMate and log in.", "error");
      return false;
    }

    setStatus('Saving contact via API...', 'info');

    let userId = null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.sub;
    } catch (e) {
      console.error("Failed to decode token", e);
    }

    if (!userId) {
      setStatus("Error: Invalid auth token.", "error");
      return false;
    }

    // Append photo URL to notes since there isn't a dedicated column yet
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
        address: contactData.location, // Mapped from location to address
        relationship: contactData.relationship,
        notes: finalNotes,
        linkedin_url: contactData.linkedin_url,
        // Default empty fields for schema compliance
        email: '',
        phone: '',
        country: ''
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("API Error:", err);
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return true;

  } catch (e) {
    console.error("Direct save failed:", e);
    // More specific error messages for user
    if (e.message.includes("401") || e.message.includes("403")) {
      setStatus("Auth Error: Re-login to TrackMate tab.", "error");
    } else {
      setStatus(`Error saving: ${e.message}`, "error");
    }
    return false;
  }
}
async function getAuthToken() {
  // Find tabs matching TrackMate (localhost)
  const tabs = await chrome.tabs.query({ url: ['http://localhost:8080/*', 'http://localhost:5173/*', 'http://127.0.0.1:8080/*'] });

  for (const tab of tabs) {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          // Try standard Supabase key patterns
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
              const val = localStorage.getItem(key);
              try {
                const parsed = JSON.parse(val);
                return parsed.access_token;
              } catch (e) { }
            }
          }
          return null;
        }
      });

      if (results && results[0] && results[0].result) {
        return results[0].result;
      }
    } catch (e) {
      console.warn("Script exec failed on tab", tab.id, e);
    }
  }
  return null;
}


// Display company data
function displayCompanyData(data) {
  document.getElementById('jobData').style.display = 'none';
  document.getElementById('contactData').style.display = 'none';
  const companyDiv = document.getElementById('companyData');
  companyDiv.style.display = 'block';

  document.getElementById('companyName').value = data.name || '';
  document.getElementById('companyIndustry').value = data.industry || '';
  document.getElementById('companySize').value = data.size || '';
  document.getElementById('companyLocation').value = data.location || '';
  document.getElementById('companyWebsite').value = data.website || '';
  document.getElementById('companyLinkedin').value = data.linkedinUrl || '';
  document.getElementById('companyAbout').value = data.about || '';

  // Hide capture screenshot for company profiling
  document.getElementById('captureBtn').style.display = 'none';
}

async function saveCompanyDirectly(companyData) {
  try {
    setStatus('Looking for active TrackMate tab...', 'info');
    const token = await getAuthToken();

    if (!token) {
      console.log("No auth token found, falling back to redirect.");
      setStatus("Error: Please open TrackMate and log in.", "error");
      return false;
    }

    setStatus('Saving company via API...', 'info');

    // Parse company size to match constraint ('small', 'mid', 'large')
    let size = companyData.size || '';
    let mappedSize = 'mid'; // Default fallback

    // Normalize logic
    const lowerSize = size.toLowerCase().replace(/,/g, '');
    if (lowerSize) {
      // Check for numbers
      const match = lowerSize.match(/(\d+)/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num <= 50) mappedSize = 'small';
        else if (num <= 1000) mappedSize = 'mid';
        else mappedSize = 'large';
      } else if (lowerSize.includes('startup') || lowerSize.includes('small')) {
        mappedSize = 'small';
      } else if (lowerSize.includes('enterprise') || lowerSize.includes('corporate') || lowerSize.includes('large')) {
        mappedSize = 'large';
      }
    }

    let userId = null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.sub;
    } catch (e) {
      console.error("Failed to decode token", e);
    }

    if (!userId) return false;

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
        company_size: mappedSize,
        location: companyData.location,
        website_url: companyData.website,
        notes: (companyData.about || '') + (companyData.linkedinUrl ? `\n\nLinkedIn: ${companyData.linkedinUrl}` : ''),
        logo_url: companyData.logoUrl || '',
        founded_year: companyData.foundedYear ? parseInt(companyData.foundedYear) : null,
        employee_count: companyData.employeeCount ? parseInt(companyData.employeeCount) : null,
        status: 'Researching',
        priority: 'Medium'
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("API Error:", err);
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return true;

  } catch (e) {
    console.error("Direct save failed:", e);
    if (e.message.includes("401") || e.message.includes("403")) {
      setStatus("Auth Error: Re-login to TrackMate tab.", "error");
    } else {
      setStatus(`Error saving: ${e.message}`, "error");
    }
    return false;
  }
}
