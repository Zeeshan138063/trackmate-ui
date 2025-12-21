// Popup script for TrackMate extension

let currentJobData = null;
let currentScreenshot = null;

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  const extractBtn = document.getElementById('extractBtn');
  const captureBtn = document.getElementById('captureBtn');
  const saveBtn = document.getElementById('saveBtn');
  const openBtn = document.getElementById('openBtn');
  const trackMateUrlInput = document.getElementById('trackMateUrl');

  // Load saved TrackMate URL
  chrome.storage.local.get(['trackMateUrl'], (result) => {
    if (result.trackMateUrl) {
      trackMateUrlInput.value = result.trackMateUrl;
    }
  });

  // Save TrackMate URL when changed
  trackMateUrlInput.addEventListener('change', () => {
    chrome.storage.local.set({ trackMateUrl: trackMateUrlInput.value });
  });

  // Extract job data
  extractBtn.addEventListener('click', async () => {
    setStatus('Extracting job data...', 'info');
    extractBtn.disabled = true;

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      chrome.tabs.sendMessage(tab.id, { action: 'extractJobData' }, (response) => {
        if (chrome.runtime.lastError) {
          setStatus('Error: ' + chrome.runtime.lastError.message, 'error');
          extractBtn.disabled = false;
          return;
        }

        if (response && response.success) {
          currentJobData = response.data;

          if (currentJobData.type === 'profile') {
            displayContactData(currentJobData);
            setStatus('Profile data extracted successfully!', 'success');
            document.querySelector('.header p').textContent = 'Capture Contact';
          } else if (currentJobData.type === 'company') {
            displayCompanyData(currentJobData);
            setStatus('Company data extracted successfully!', 'success');
            document.querySelector('.header p').textContent = 'Capture Dream Company';
          } else {
            displayJobData(currentJobData);
            setStatus('Job data extracted successfully!', 'success');
            document.querySelector('.header p').textContent = 'Capture Job Details';
          }

          saveBtn.style.display = 'block';
          openBtn.style.display = 'block';

          if (currentJobData.type === 'profile') {
            const importResumeBtn = document.getElementById('importResumeBtn');
            if (importResumeBtn) importResumeBtn.style.display = 'block';
            saveBtn.textContent = '💾 Save Contact';
          }
        } else {
          setStatus('Failed to extract job data', 'error');
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
      setStatus('Please extract job data first', 'error');
      return;
    }

    setStatus('Opening TrackMate... Make sure you are logged in!', 'info');
    saveBtn.disabled = true;

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const trackMateUrl = trackMateUrlInput.value || 'http://localhost:8080/trackers';

      // Ensure we're not sending large data - it will be stored in extension storage
      // Gather data from inputs (allowing user edits)
      // Determine mode
      const isProfile = currentJobData.type === 'profile';

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
      } else if (currentJobData.type === 'company') {
        // Company Mode
        const getVal = (id) => document.getElementById(id).value || '';

        const companyDataToSend = {
          name: getVal('companyName'),
          industry: getVal('companyIndustry'),
          size: getVal('companySize'),
          location: getVal('companyLocation'),
          website: getVal('companyWebsite'),
          linkedinUrl: getVal('companyLinkedin') || currentJobData.linkedinUrl || tab.url || '',
          about: getVal('companyAbout')
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

      const trackMateUrl = trackMateUrlInput.value || 'http://localhost:8080/trackers';

      // Use background script to open tab with data
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
    extractBtn.click();
  }, 500);
});

// Display job data in popup inputs
function displayJobData(data) {
  const jobDataDiv = document.getElementById('jobData');
  jobDataDiv.style.display = 'block';

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
      return false;
    }

    setStatus('Saving contact via API...', 'info');

    // Check if user exists (and get user_id from token hopefully, but Supabase standard JWT has sub)
    // Actually, we need to decode JWT to get 'sub' (user_id) OR just trust RLS to assign it?
    // Supabase REST API automatically assigns user_id matching the authenticated user? 
    // Typically: Yes if the table column has default value `auth.uid()`, OR we must send it.
    // Let's check if we need to send user_id. 
    // Standard pattern: Table `contacts` usually has `user_id` text/uuid. 
    // If RLS is enabled and policies are "insert with check (auth.uid() = user_id)", we must enable RLS.
    // We will assume the API handles it or we decode the token.

    let userId = null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.sub;
    } catch (e) {
      console.error("Failed to decode token", e);
    }

    if (!userId) return false;

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
        notes: contactData.notes,
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
      return false;
    }

    setStatus('Saving company via API...', 'info');

    let userId = null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.sub;
    } catch (e) {
      console.error("Failed to decode token", e);
    }

    if (!userId) return false;

    // Parse array fields
    const targetRoles = [];
    const tags = [];
    const locations = companyData.location ? [companyData.location] : [];

    // Note: status, priority default to Researching/Medium in schema defaults if not sent
    // But we might want to set defaults here

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
        location: companyData.location, // string
        website_url: companyData.website,
        // linkedin_company_url does not exist in the schema, so we append to notes
        notes: companyData.about + (companyData.linkedinUrl ? `\n\nLinkedIn: ${companyData.linkedinUrl}` : ''),
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
