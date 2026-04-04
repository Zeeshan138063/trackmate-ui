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

    /* ─────────────────────────────────────
       Keyframe Animations
    ───────────────────────────────────── */

    /* Gentle vertical float */
    @keyframes jobos-float {
      0%, 100% { transform: translateY(-50%) translateY(0px); }
      50%       { transform: translateY(-50%) translateY(-6px); }
    }

    /* Spinning conic-gradient border ring */
    @keyframes jobos-spin {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }

    /* Expanding pulse ring */
    @keyframes jobos-pulse {
      0%   { transform: scale(1);   opacity: 0.5; }
      100% { transform: scale(1.55); opacity: 0; }
    }

    /* Hex stroke dash animation — draws itself */
    @keyframes jobos-draw {
      from { stroke-dashoffset: 260; }
      to   { stroke-dashoffset: 0; }
    }

    /* Arrow bob up/down inside the hex */
    @keyframes jobos-arrow-bob {
      0%, 100% { transform: translateY(0px); }
      50%       { transform: translateY(-3px); }
    }

    /* Inner glow breathe */
    @keyframes jobos-glow-breathe {
      0%, 100% { opacity: 0.55; }
      50%       { opacity: 1; }
    }

    /* ─────────────────────────────────────
       Wrapper — positions everything
    ───────────────────────────────────── */
    #jobos-wrapper {
      position: fixed;
      right: 20px;
      top: 50%;
      width: 46px;
      height: 46px;
      pointer-events: auto;
      z-index: 2;
      /* Floating bob */
      animation: jobos-float 3s ease-in-out infinite;
    }

    /* Pulse rings — sit behind the button */
    .jobos-ring {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      border: 1.5px solid rgba(99, 102, 241, 0.55);
      animation: jobos-pulse 2.4s ease-out infinite;
      pointer-events: none;
    }
    .jobos-ring:nth-child(2) { animation-delay: 0.8s; }
    .jobos-ring:nth-child(3) { animation-delay: 1.6s; }

    /* Spinning conic ring pseudo-layer */
    .jobos-spin-ring {
      position: absolute;
      inset: -2px;
      border-radius: 50%;
      background: conic-gradient(
        from 0deg,
        transparent 0%,
        #6366F1 20%,
        #818CF8 40%,
        #C7D2FE 50%,
        transparent 70%
      );
      animation: jobos-spin 2.8s linear infinite;
      pointer-events: none;
    }
    /* Mask center so only border shows */
    .jobos-spin-ring::after {
      content: '';
      position: absolute;
      inset: 2px;
      border-radius: 50%;
      background: #0A0E1A;
    }

    /* ── Floating Button ── */
    #jobos-fab {
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 35% 35%, #1E2340 0%, #0A0E1A 100%);
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow:
        0 0 0 1px rgba(99,102,241,0.3),
        0 4px 20px rgba(99, 102, 241, 0.45),
        inset 0 1px 0 rgba(255,255,255,0.08);
      transition: box-shadow 0.25s ease, transform 0.2s ease;
      overflow: hidden;
    }

    /* Inner shimmer sweep on hover */
    #jobos-fab::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background: linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 60%);
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    #jobos-fab:hover::before { opacity: 1; }

    #jobos-fab:hover {
      box-shadow:
        0 0 0 1px rgba(99,102,241,0.6),
        0 6px 28px rgba(99,102,241,0.65),
        inset 0 1px 0 rgba(255,255,255,0.12);
      transform: scale(1.07);
    }
    #jobos-fab:active {
      transform: scale(0.94);
    }

    /* SVG wrapper so we can animate the arrow group separately */
    #jobos-fab svg {
      width: 28px;
      height: 28px;
      position: relative;
      z-index: 1;
    }

    /* Hex stroke self-draws on load */
    #jobos-hex-stroke {
      stroke-dasharray: 260;
      stroke-dashoffset: 260;
      animation: jobos-draw 1.2s cubic-bezier(0.4,0,0.2,1) 0.3s forwards;
    }

    /* Arrow inside bobs continuously */
    #jobos-arrow-group {
      animation: jobos-arrow-bob 2s ease-in-out infinite;
    }

    /* Glow behind the icon that breathes */
    #jobos-fab-glow {
      position: absolute;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(99,102,241,0.55) 0%, transparent 70%);
      animation: jobos-glow-breathe 2.2s ease-in-out infinite;
      pointer-events: none;
    }

    /* Dragging states */
    #jobos-wrapper.dragged  { animation: none; }
    #jobos-wrapper.dragging {
      animation: none !important;
      cursor: grabbing !important;
    }
    #jobos-wrapper.dragging #jobos-fab { transform: scale(1.07); }
    .jobos-ring, .jobos-spin-ring { pointer-events: none; }

    /* Notification Badge */
    .badge {
      position: absolute;
      top: -5px;
      right: -5px;
      background: linear-gradient(135deg, #10B981, #059669);
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 10px;
      font-weight: 700;
      width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(16,185,129,0.5);
      border: 2px solid #0A0E1A;
      opacity: 0;
      transform: scale(0.4);
      transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
      z-index: 10;
    }
    .badge.show {
      opacity: 1;
      transform: scale(1);
    }
  `;

  // ── Wrapper (handles floating + drag) ──
  const wrapper = document.createElement('div');
  wrapper.id = 'jobos-wrapper';

  // Three staggered pulse rings
  for (let i = 0; i < 3; i++) {
    const ring = document.createElement('div');
    ring.className = 'jobos-ring';
    wrapper.appendChild(ring);
  }

  // Spinning conic border ring
  const spinRing = document.createElement('div');
  spinRing.className = 'jobos-spin-ring';
  wrapper.appendChild(spinRing);

  // ── FAB button ──
  const fab = document.createElement('div');
  fab.id = 'jobos-fab';
  fab.innerHTML = `
    <div id="jobos-fab-glow"></div>
    <svg viewBox="0 0 96 96" fill="none">
      <defs>
        <linearGradient id="fabHexG" x1="0" y1="0" x2="96" y2="96" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stop-color="#FFFFFF" />
          <stop offset="100%" stop-color="#C7D2FE" />
        </linearGradient>
      </defs>
      <!-- Animated hex border: draws itself in on load -->
      <polygon
        id="jobos-hex-stroke"
        points="48,5 85,27 85,69 48,91 11,69 11,27"
        fill="none"
        stroke="url(#fabHexG)"
        stroke-width="5"
        stroke-linejoin="round"
      />
      <!-- Arrow group bobs up/down continuously -->
      <g id="jobos-arrow-group">
        <rect x="44" y="44" width="8" height="26" rx="3" fill="url(#fabHexG)" />
        <polygon points="48,18 64,44 32,44" fill="url(#fabHexG)" />
      </g>
    </svg>
    <div class="badge" id="jobos-badge">✓</div>
  `;

  wrapper.appendChild(fab);
  shadow.appendChild(style);
  shadow.appendChild(wrapper);

  // ── Drag Logic (targets wrapper) ──
  let isDragging = false;
  let dragTriggered = false;
  let startX, startY, initialLeft, initialTop;

  wrapper.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    const rect = wrapper.getBoundingClientRect();
    startX = e.clientX;
    startY = e.clientY;
    initialLeft = rect.left;
    initialTop = rect.top;
    isDragging = true;
    dragTriggered = false;
    e.preventDefault();
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (!dragTriggered && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
      dragTriggered = true;
      wrapper.classList.add('dragged', 'dragging');
      wrapper.style.left = initialLeft + 'px';
      wrapper.style.top = initialTop + 'px';
      wrapper.style.right = 'auto';
    }

    if (dragTriggered) {
      const maxX = window.innerWidth - wrapper.offsetWidth;
      const maxY = window.innerHeight - wrapper.offsetHeight;
      wrapper.style.left = Math.max(0, Math.min(initialLeft + dx, maxX)) + 'px';
      wrapper.style.top = Math.max(0, Math.min(initialTop + dy, maxY)) + 'px';
    }
  });

  window.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      wrapper.classList.remove('dragging');
    }
  });

  // ── Open Side Panel on click (not after drag) ──
  wrapper.addEventListener('click', (e) => {
    if (dragTriggered) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    try {
      chrome.runtime.sendMessage({ action: 'openNativeSidePanel' });
    } catch (err) {
      console.warn('JobOS: Extension context invalidated. Please refresh the page.');
    }
  });

  // ── Check if job already saved → show badge ──
  try {
    chrome.runtime.sendMessage({ action: 'checkSavedJob', url: window.location.href }, (response) => {
      if (chrome.runtime.lastError) return;
      if (response?.saved) {
        shadow.getElementById('jobos-badge').classList.add('show');
      }
    });
  } catch (e) { /* ignore */ }

  // ── Relay badge update when popup saves a job ──
  try {
    chrome.runtime.onMessage.addListener((request) => {
      if (request.action === 'jobSavedEvent') {
        shadow.getElementById('jobos-badge').classList.add('show');
      }
    });
  } catch (e) { /* ignore */ }

})();
