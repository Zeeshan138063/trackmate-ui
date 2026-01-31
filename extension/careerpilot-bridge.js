// This content script acts as a bridge between the CareerPilot web page and the extension.
// It allows the web page to request data stored in the extension's local storage.

// Listen for messages from the web page
window.addEventListener('message', (event) => {
  // Only accept messages from the same window
  if (event.source !== window) return;

  // Check if the message is intended for the extension
  if (event.data && event.data.source === 'careerpilot-web-app') {
    if (event.data.action === 'getJobData') {
      // Forward the request to the background script
      chrome.runtime.sendMessage({
        action: 'getJobData',
        dataId: event.data.dataId
      }, (response) => {
        // Send the response back to the web page
        window.postMessage({
          source: 'careerpilot-extension',
          action: 'jobDataResponse',
          success: response.success,
          data: response.data,
          error: response.error
        }, '*');
      });
    }
  }
});

// --- PORTAL-TO-EXTENSION LOGOUT SYNC ---
// Listen for changes to localStorage to detect when the user logs out from the portal
window.addEventListener('storage', (event) => {
  const projectRef = "jdplobgtxzncwxhordah";
  const storageKey = `sb-${projectRef}-auth-token`;

  // If the auth token is removed (logout), notify the extension background script
  if (event.key === storageKey && !event.newValue) {
    console.log("CareerPilot Bridge: Portal logout detected, notifying extension...");
    chrome.runtime.sendMessage({ action: 'portalLogout' });
  }
});
