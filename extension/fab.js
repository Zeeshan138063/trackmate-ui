// ================================================================
// JobOS — Floating Action Button (FAB)
// Injected into job sites via content_scripts.
// Builds a Shadow DOM to isolate styles from the host page.
// Clicking the FAB tells the background script to open the native side panel.
// ================================================================

(function initJobOsFab() {
  'use strict';

  // Prevent multiple injections
  if (document.getElementById('jobos-root')) return;

  const host = document.createElement('div');
  host.id = 'jobos-root';
  // Ensure the root itself doesn't mess with page layout but stays on top
  host.style.position = 'absolute';
  host.style.top = '0';
  host.style.left = '0';
  host.style.width = '100%';
  host.style.height = '0';
  host.style.zIndex = '2147483647';
  host.style.pointerEvents = 'none'; // Let clicks pass through the root container itself
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = `
    :host {
      all: initial;
    }
    
    /* ── Floating Button ── */
    #jobos-fab {
      position: fixed;
      right: 20px;
      top: 50%;
      transform: translateY(-50%);
      width: 52px;
      height: 52px;
      background: linear-gradient(135deg, #0A0E1A 0%, #12172B 100%);
      border: 2px solid #6366F1;
      border-radius: 50%;
      box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s, border-color 0.2s;
      pointer-events: auto;
      z-index: 2;
    }
    
    #jobos-fab:hover {
      transform: translateY(-50%) scale(1.08);
      box-shadow: 0 6px 20px rgba(99, 102, 241, 0.6);
      border-color: #818CF8;
    }
    
    #jobos-fab svg {
      width: 26px;
      height: 26px;
      filter: drop-shadow(0 0 4px rgba(102,120,255,0.6));
    }
    
    /* Notification Badge */
    .badge {
      position: absolute;
      top: -4px;
      right: -4px;
      background: #10B981; /* Green */
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 10px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 10px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      border: 2px solid #0A0E1A;
      opacity: 0;
      transform: scale(0.5);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .badge.show {
      opacity: 1;
      transform: scale(1);
    }
  `;

  // FAB HTML (Hex Icon)
  const fab = document.createElement('div');
  fab.id = 'jobos-fab';
  fab.innerHTML = `
    <svg viewBox="0 0 96 96" fill="none">
      <defs>
        <linearGradient id="fabHexG" x1="0" y1="0" x2="96" y2="96" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#FFFFFF" />
          <stop offset="100%" stop-color="#C8D2FF" />
        </linearGradient>
      </defs>
      <polygon points="48,6 84,27 84,69 48,90 12,69 12,27" fill="none" stroke="url(#fabHexG)" stroke-width="6" stroke-linejoin="round" />
      <rect x="43" y="42" width="10" height="30" rx="3" fill="url(#fabHexG)" />
      <polygon points="48,20 62,44 34,44" fill="url(#fabHexG)" />
    </svg>
    <div class="badge" id="jobos-badge">✓</div>
  `;

  shadow.appendChild(style);
  shadow.appendChild(fab);

  // Instead of opening a local DOM panel, tell Chrome to open the Native Side Panel!
  fab.addEventListener('click', () => {
    try {
      chrome.runtime.sendMessage({ action: 'openNativeSidePanel' });
    } catch (e) {
      console.warn('JobOS: Extension context invalidated. Please refresh the page.');
    }
  });

  // Check if job is already saved so we can show the green badge
  try {
    chrome.runtime.sendMessage({ action: 'checkSavedJob', url: window.location.href }, (response) => {
      if (chrome.runtime.lastError) {
        // Ignore "context invalidated" errors dynamically from background
        return;
      }
      if (response?.saved) {
        shadow.getElementById('jobos-badge').classList.add('show');
      }
    });
  } catch (e) {
    // Ignore context invalidated
  }

  // Listen for 'jobSaved' from the background/popup to update badge instantly
  try {
    chrome.runtime.onMessage.addListener((request) => {
      if (request.action === 'jobSavedEvent') {
        shadow.getElementById('jobos-badge').classList.add('show');
      }
    });
  } catch (e) {
    // Ignore
  }

})();
