// Background service worker for screenshot capture and data handling

let capturedScreenshots = {};

// Listen for messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'captureScreenshot') {
    captureScreenshot(sender.tab.id)
      .then(screenshot => {
        sendResponse({ success: true, screenshot });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep channel open for async response
  }

  if (request.action === 'saveJobData') {
    // Save job data with screenshot to storage
    const jobData = {
      ...request.data,
      screenshot: request.screenshot,
      capturedAt: new Date().toISOString(),
      url: request.url || sender.tab?.url
    };

    chrome.storage.local.get(['savedJobs'], (result) => {
      const jobs = result.savedJobs || [];
      jobs.push(jobData);
      chrome.storage.local.set({ savedJobs: jobs }, () => {
        sendResponse({ success: true, jobId: jobs.length - 1 });
      });
    });
    return true;
  }

  if (request.action === 'getSavedJobs') {
    chrome.storage.local.get(['savedJobs'], (result) => {
      sendResponse({ success: true, jobs: result.savedJobs || [] });
    });
    return true;
  }

  if (request.action === 'sendToTrackMate') {
    // Send job data to TrackMate UI
    const jobData = request.data;
    const trackMateUrl = request.trackMateUrl || 'http://localhost:5173/trackers';
    
    // Open TrackMate with job data as URL parameters or in a new tab
    const params = new URLSearchParams({
      action: 'addJob',
      position: jobData.position || '',
      company: jobData.company || '',
      jobUrl: jobData.jobUrl || '',
      location: jobData.location || '',
      minSalary: jobData.minSalary || '',
      maxSalary: jobData.maxSalary || '',
      description: jobData.description?.substring(0, 500) || '',
      screenshot: jobData.screenshot || ''
    });

    chrome.tabs.create({
      url: `${trackMateUrl}?${params.toString()}`
    });

    sendResponse({ success: true });
    return true;
  }
});

// Capture screenshot of current tab
async function captureScreenshot(tabId) {
  try {
    const dataUrl = await chrome.tabs.captureVisibleTab(null, {
      format: 'png',
      quality: 100
    });
    return dataUrl;
  } catch (error) {
    console.error('Screenshot capture failed:', error);
    throw error;
  }
}

// Listen for tab updates to detect job pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const jobSites = [
      'linkedin.com/jobs',
      'indeed.com/viewjob',
      'glassdoor.com/Job',
      'lever.co',
      'greenhouse.io'
    ];
    
    if (jobSites.some(site => tab.url.includes(site))) {
      // Notify that we're on a job page
      chrome.action.setBadgeText({ text: 'J', tabId });
      chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
    }
  }
});

