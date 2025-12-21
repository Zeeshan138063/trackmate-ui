// Content script to bridge communication between extension and TrackMate page
// This runs on the TrackMate domain to fetch job data from extension storage

(function () {
  // Only run on TrackMate pages (trackers or resume)
  if (!window.location.href.includes('/trackers') && !window.location.href.includes('/resume')) {
    return;
  }

  // Listen for messages from the page
  window.addEventListener('message', (event) => {
    // Only accept messages from same origin
    if (event.origin !== window.location.origin) {
      return;
    }

    if (event.data.type === 'TRACKMATE_FETCH_JOB_DATA') {
      const dataId = event.data.dataId;

      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
        chrome.runtime.sendMessage(
          chrome.runtime.id,
          { action: 'getJobData', dataId: dataId },
          (response) => {
            // Send response back to page
            window.postMessage({
              type: 'TRACKMATE_JOB_DATA_RESPONSE',
              success: response && response.success,
              data: response && response.data
            }, window.location.origin);
          }
        );
      } else {
        window.postMessage({
          type: 'TRACKMATE_JOB_DATA_RESPONSE',
          success: false,
          data: null
        }, window.location.origin);
      }
    }
  });
})();

