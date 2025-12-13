// Background service worker for screenshot capture and data handling

let capturedScreenshots = {};

// Listen for messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'captureScreenshot') {
    // Use tabId from request, or fallback to sender.tab.id
    const tabId = request.tabId || sender.tab?.id;

    if (!tabId) {
      sendResponse({ success: false, error: 'No tab ID available' });
      return true;
    }

    captureScreenshot(tabId)
      .then(screenshot => {
        sendResponse({ success: true, screenshot });
      })
      .catch(error => {
        console.error('Screenshot error:', error);
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
    const trackMateUrl = request.trackMateUrl || 'http://localhost:8080/trackers';

    // Generate a unique ID for this job data
    const jobDataId = 'trackmate_job_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    // Store full job data in extension storage (handles large descriptions/screenshots)
    chrome.storage.local.set({ [jobDataId]: jobData }, () => {
      // Only pass essential, small fields via URL to avoid 431 error
      // Truncate all fields to ensure URL stays under limit
      const params = new URLSearchParams({
        action: 'addJob',
        dataId: jobDataId, // Reference to stored data
        position: (jobData.position || '').substring(0, 100), // Truncate for URL safety
        company: (jobData.company || '').substring(0, 100),
        jobUrl: (jobData.jobUrl || '').substring(0, 200), // Truncate URL if too long
        location: (jobData.location || '').substring(0, 100),
        minSalary: jobData.minSalary ? String(jobData.minSalary) : '',
        maxSalary: jobData.maxSalary ? String(jobData.maxSalary) : '',
        datePosted: (jobData.datePosted || '').substring(0, 50),
        deadline: (jobData.deadline || '').substring(0, 50),
        status: jobData.status || 'Bookmarked',
        excitement: jobData.excitement ? String(jobData.excitement) : '3'
        // Description and screenshot are in storage, not URL - NEVER include them
      });

      // Ensure total URL length is reasonable (max ~2000 chars to be safe)
      const fullUrl = `${trackMateUrl}?${params.toString()}`;
      if (fullUrl.length > 2000) {
        console.warn('URL too long, truncating further');
        // Further truncate if needed
        params.set('position', (jobData.position || '').substring(0, 50));
        params.set('company', (jobData.company || '').substring(0, 50));
        params.set('jobUrl', (jobData.jobUrl || '').substring(0, 100));
        params.set('location', (jobData.location || '').substring(0, 50));
      }

      chrome.tabs.create({
        url: `${trackMateUrl}?${params.toString()}`
      });

      // Clean up stored data after 1 hour (in case user doesn't save)
      setTimeout(() => {
        chrome.storage.local.remove([jobDataId]);
      }, 3600000); // 1 hour
    });

    sendResponse({ success: true });
    return true;
  }

  if (request.action === 'sendContactToTrackMate') {
    const contactData = request.data;
    // Construct URL to Connections page
    const baseUrl = request.trackMateUrl.replace(/\/trackers\/?$/, ''); // strip /trackers
    const connectionsUrl = `${baseUrl}/connections`; // assume /connections route

    const dataId = 'trackmate_contact_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    chrome.storage.local.set({ [dataId]: contactData }, () => {
      const params = new URLSearchParams({
        action: 'addContact',
        dataId: dataId,
        name: (contactData.name || '').substring(0, 100),
        company: (contactData.company || '').substring(0, 100)
      });

      chrome.tabs.create({
        url: `${connectionsUrl}?${params.toString()}`
      });

      setTimeout(() => {
        chrome.storage.local.remove([dataId]);
      }, 3600000);
    });

    sendResponse({ success: true });
    return true;
  }

  // Allow TrackMate page to fetch full job data by ID
  if (request.action === 'getJobData') {
    const dataId = request.dataId;
    if (dataId) {
      chrome.storage.local.get([dataId], (result) => {
        if (result[dataId]) {
          sendResponse({ success: true, data: result[dataId] });
          // Optionally clean up after fetching
          chrome.storage.local.remove([dataId]);
        } else {
          sendResponse({ success: false, error: 'Job data not found' });
        }
      });
      return true;
    }
    sendResponse({ success: false, error: 'No data ID provided' });
    return true;
  }
});

// Capture screenshot of current tab
async function captureScreenshot(tabId) {
  try {
    // Get the window ID for the tab
    const tab = await chrome.tabs.get(tabId);
    if (!tab) {
      throw new Error('Tab not found');
    }

    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
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

