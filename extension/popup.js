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
          displayJobData(currentJobData);
          setStatus('Job data extracted successfully!', 'success');
          saveBtn.style.display = 'block';
          openBtn.style.display = 'block';
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
      const jobDataToSend = {
        position: currentJobData.position || '',
        company: currentJobData.company || '',
        jobUrl: currentJobData.jobUrl || tab.url || '',
        location: currentJobData.location || '',
        description: currentJobData.description || '', // Will be stored, not in URL
        minSalary: currentJobData.minSalary || null,
        maxSalary: currentJobData.maxSalary || null,
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

  // Auto-extract on popup open
  setTimeout(() => {
    extractBtn.click();
  }, 500);
});

// Display job data in popup
function displayJobData(data) {
  const jobDataDiv = document.getElementById('jobData');
  jobDataDiv.style.display = 'block';

  const positionEl = document.getElementById('position');
  const companyEl = document.getElementById('company');
  const locationEl = document.getElementById('location');
  const salaryEl = document.getElementById('salary');
  const descriptionEl = document.getElementById('description');

  positionEl.textContent = data.position || 'Not found';
  positionEl.className = data.position ? 'value' : 'value empty';

  companyEl.textContent = data.company || 'Not found';
  companyEl.className = data.company ? 'value' : 'value empty';

  locationEl.textContent = data.location || 'Not found';
  locationEl.className = data.location ? 'value' : 'value empty';

  let salaryText = 'Not found';
  if (data.minSalary && data.maxSalary) {
    salaryText = `$${data.minSalary.toLocaleString()} - $${data.maxSalary.toLocaleString()}`;
  } else if (data.minSalary) {
    salaryText = `$${data.minSalary.toLocaleString()}+`;
  } else if (data.maxSalary) {
    salaryText = `Up to $${data.maxSalary.toLocaleString()}`;
  }
  salaryEl.textContent = salaryText;
  salaryEl.className = (data.minSalary || data.maxSalary) ? 'value' : 'value empty';

  const descText = data.description ? 
    (data.description.length > 200 ? data.description.substring(0, 200) + '...' : data.description) :
    'Not found';
  descriptionEl.textContent = descText;
  descriptionEl.className = data.description ? 'value' : 'value empty';
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

