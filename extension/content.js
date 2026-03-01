// ================================================================
// CareerPilot AI - Content Script v3.0  (Production)
// Responsibilities:
//   1. Detect which site/ATS we're on
//   2. Extract job / profile / company data
//   3. Autofill ATS application forms with profile data
//   4. React to URL changes (SPA navigation) without page reload
//   5. React to DOM mutations (lazy-loaded content, expand sections)
//   6. Debounce rapid changes to avoid thrashing
// ================================================================

'use strict';

// ────────────────────────────────────────────────────────────────
// PAGE STATE MANAGER
// Single source of truth for all reactive logic.
// ────────────────────────────────────────────────────────────────
const PageState = (() => {
  let _currentUrl    = window.location.href;
  let _currentData   = null;   // last successfully extracted data
  let _currentAts    = null;   // last detected ATS
  let _domObserver   = null;   // MutationObserver instance
  let _debounceTimer = null;
  let _extractTimer  = null;
  let _retryCount    = 0;
  const MAX_RETRIES  = 5;      // max retries waiting for page to hydrate
  const DEBOUNCE_MS  = 600;    // wait 600ms after last DOM change before re-extracting
  const STABLE_MS    = 2000;   // wait 2s after navigation (LinkedIn hydration takes ~1.5-2s)
  const RETRY_MS     = 1500;   // retry interval when data comes back empty

  // ── Called on every meaningful change (URL or DOM) ──
  function _onChanged(reason) {
    clearTimeout(_debounceTimer);
    _debounceTimer = setTimeout(() => _runExtraction(reason), DEBOUNCE_MS);
  }

  function _hasUsefulData(data) {
    if (!data) return false;
    // Require at least one of these to be non-empty to consider extraction valid
    return !!(data.name || data.position || data.company || data.description);
  }

  function _runExtraction(reason) {
    // Bust cache — always fresh on change
    extractor.invalidate();

    const data        = extractor.getJobData('auto');
    const ats         = ATSDetector.detect();
    const isApplyPage = ATSDetector.isApplyPage();

    // ── Quality gate: ignore empty/skeleton extractions ──
    // LinkedIn's React app renders a skeleton loader first; we must wait for
    // real content. If data has no meaningful fields, schedule a retry.
    if (!isApplyPage && !_hasUsefulData(data)) {
      if (_retryCount < MAX_RETRIES) {
        _retryCount++;
        clearTimeout(_extractTimer);
        _extractTimer = setTimeout(() => _runExtraction(reason + '-retry'), RETRY_MS);
      }
      return;
    }
    _retryCount = 0; // reset on success

    const dataChanged = JSON.stringify(data) !== JSON.stringify(_currentData);
    const atsChanged  = ats !== _currentAts;

    if (!dataChanged && !atsChanged) return; // nothing meaningful changed

    _currentData = data;
    _currentAts  = ats;

    if (isApplyPage) {
      _notify('atsDetected', { ats, isApplyPage, url: window.location.href, reason });
    } else if (_hasUsefulData(data)) {
      _notify('jobDataExtracted', { data, reason });
    }
  }

  function _notify(action, payload) {
    try {
      chrome.runtime.sendMessage({ action, ...payload });
    } catch (_) {
      // Extension context may be invalidated after update — safe to ignore
    }
  }

  // ── URL change detection (covers SPA pushState + popstate) ──
  function _watchUrl() {
    const check = () => {
      const newUrl = window.location.href;
      if (newUrl !== _currentUrl) {
        _currentUrl  = newUrl;
        _currentData = null;  // bust data cache on navigation
        _currentAts  = null;
        _retryCount  = 0;     // reset retry counter on new page
        // Give the SPA time to render the new page content
        clearTimeout(_extractTimer);
        _extractTimer = setTimeout(() => _runExtraction('url-change'), STABLE_MS);
      }
    };

    // Intercept history.pushState / replaceState (LinkedIn, Indeed use these heavily)
    const _origPush    = history.pushState.bind(history);
    const _origReplace = history.replaceState.bind(history);

    history.pushState = function (...args) {
      _origPush(...args);
      check();
    };
    history.replaceState = function (...args) {
      _origReplace(...args);
      check();
    };

    // Browser back/forward
    window.addEventListener('popstate', check);
  }

  // ── DOM mutation observation ──
  function _watchDom() {
    if (_domObserver) _domObserver.disconnect();

    _domObserver = new MutationObserver(mutations => {
      // Ignore mutations that are only attribute changes on non-content nodes
      const meaningful = mutations.some(m => {
        // characterData = text node content changed (e.g. profile name rendered)
        if (m.type === 'characterData') {
          const t = m.target.textContent?.trim() || '';
          return t.length > 5;
        }
        if (m.type !== 'childList' || m.addedNodes.length === 0) return false;
        return Array.from(m.addedNodes).some(n => {
          if (n.nodeType !== 1) return false; // only elements
          // Skip mutations in clearly non-content areas
          if (n.closest?.('nav, footer, aside, [role="dialog"], [aria-label="Messaging"]')) return false;
          // Must add real text content (not just empty scaffolding)
          return n.textContent.trim().length > 20;
        });
      });
      if (meaningful) _onChanged('dom-mutation');
    });

    _domObserver.observe(document.body, {
      childList:  true,
      subtree:    true,
      characterData: true,
    });
  }

  // ── Init ──
  function init() {
    _watchUrl();

    // Wait for initial page content to settle before observing DOM
    // (avoids false positives from the initial render burst)
    const readyFn = () => {
      _watchDom();
      clearTimeout(_extractTimer);
      _extractTimer = setTimeout(() => _runExtraction('page-load'), STABLE_MS);
    };

    if (document.readyState === 'complete') {
      readyFn();
    } else {
      window.addEventListener('load', readyFn, { once: true });
    }
  }

  function getCurrentData() { return _currentData; }
  function getCurrentAts()  { return _currentAts;  }

  return { init, getCurrentData, getCurrentAts };
})();

// ────────────────────────────────────────────────────────────────
// SECTION 1: ATS DETECTOR
// ────────────────────────────────────────────────────────────────
const ATSDetector = (() => {

  // Priority order: URL > DOM fingerprint > script tags
  function detect() {
    const { hostname, href } = window.location;
    const scripts = Array.from(document.scripts).map(s => s.src);

    // ── URL-based (fastest & most reliable) ──
    if (hostname.includes('myworkdayjobs.com')) return 'workday';
    if (hostname.includes('greenhouse.io'))     return 'greenhouse';
    if (hostname.includes('lever.co'))          return 'lever';
    if (hostname.includes('icims.com'))         return 'icims';
    if (hostname.includes('smartrecruiters.com')) return 'smartrecruiters';
    if (hostname.includes('workable.com'))      return 'workable';
    if (hostname.includes('taleo.net'))         return 'taleo';
    if (hostname.includes('rozee.pk') && href.toLowerCase().includes('apply')) return 'rozee';
    if (hostname.includes('naukri.com') && href.toLowerCase().includes('apply')) return 'naukri';

    // ── DOM fingerprinting for companies using custom domains ──
    // e.g. amazon.jobs or careers.google.com which run Workday underneath
    if (document.querySelector('[data-automation-id="legalNameSection_firstName"], [data-automation-id="email"]')) return 'workday';
    if (document.querySelector('form#application_form, input[name="job_application[first_name]"]')) return 'greenhouse';
    if (document.querySelector('[data-lever-key], input[name="cards[name][first_name]"]')) return 'lever';
    if (document.querySelector('[id*="icims_content"]')) return 'icims';
    if (document.querySelector('[data-qa="src-page"], [data-qa="firstName"]')) return 'smartrecruiters';
    if (document.querySelector('[data-ui="firstname"]')) return 'workable';
    if (document.querySelector('#ftlJobReqDetailPage, #taleoContent')) return 'taleo';

    // ── Script-tag sniffing ──
    if (scripts.some(s => s.includes('greenhouse.io')))      return 'greenhouse';
    if (scripts.some(s => s.includes('lever.co')))           return 'lever';
    if (scripts.some(s => s.includes('smartrecruiters.com'))) return 'smartrecruiters';
    if (scripts.some(s => s.includes('workable.com')))       return 'workable';
    if (scripts.some(s => s.includes('workday.com')))        return 'workday';

    // ── Generic: any page that looks like an application form ──
    const hasEmailInput = !!document.querySelector('input[type="email"], input[name*="email" i], input[id*="email" i]');
    const hasApplyInUrl  = /apply|application|careers/i.test(window.location.pathname);
    if (hasEmailInput && hasApplyInUrl) return 'generic';

    return null;
  }

  function isApplyPage() {
    return detect() !== null;
  }

  return { detect, isApplyPage };
})();


// ────────────────────────────────────────────────────────────────
// SECTION 2: ATS AUTOFILLER
// ────────────────────────────────────────────────────────────────
class ATSAutofiller {
  /**
   * @param {Object} profile - User profile from CareerPilot
   * @param {string} profile.firstName
   * @param {string} profile.lastName
   * @param {string} profile.email
   * @param {string} profile.phone
   * @param {string} profile.location   - Full location string (e.g. "Lahore, Pakistan")
   * @param {string} profile.city       - Just the city
   * @param {string} profile.linkedinUrl
   * @param {string} profile.githubUrl
   * @param {string} profile.portfolioUrl
   * @param {string} [profile.resumePdfUrl] - URL to pre-generated tailored resume PDF
   * @param {string} [profile.coverLetterText]
   */
  constructor(profile) {
    this.p   = profile;
    this.ats = ATSDetector.detect();
  }

  async fill() {
    if (!this.ats) {
      return { success: false, reason: 'No ATS/application form detected on this page.' };
    }

    console.log(`[CareerPilot] Autofilling ${this.ats} form...`);

    try {
      switch (this.ats) {
        case 'workday':         await this._fillWorkday();         break;
        case 'greenhouse':      await this._fillGreenhouse();      break;
        case 'lever':           await this._fillLever();           break;
        case 'icims':           await this._fillICIMS();           break;
        case 'smartrecruiters': await this._fillSmartRecruiters(); break;
        case 'workable':        await this._fillWorkable();        break;
        case 'taleo':           await this._fillTaleo();           break;
        case 'rozee':           await this._fillRozee();           break;
        case 'naukri':          await this._fillNaukri();          break;
        default:                await this._fillGeneric();         break;
      }
      return { success: true, ats: this.ats };
    } catch (err) {
      console.warn('[CareerPilot] Autofill primary strategy failed, falling back to generic:', err);
      try {
        await this._fillGeneric();
        return { success: true, ats: 'generic-fallback' };
      } catch (e) {
        return { success: false, ats: this.ats, error: e.message };
      }
    }
  }

  // ── Workday (Amazon, Microsoft, Nike, etc.) ──
  async _fillWorkday() {
    const p = this.p;
    await this._set('[data-automation-id="legalNameSection_firstName"]',   p.firstName);
    await this._set('[data-automation-id="legalNameSection_lastName"]',    p.lastName);
    await this._set('[data-automation-id="email"]',                        p.email);
    await this._set('[data-automation-id="phone"]',                        p.phone);
    await this._set('[data-automation-id="addressSection_city"]',          p.city || p.location);
    await this._set('input[data-automation-id*="linkedin" i]',             p.linkedinUrl);
    await this._set('input[data-automation-id*="github" i]',               p.githubUrl);
    await this._set('input[data-automation-id*="website" i]',              p.portfolioUrl);
    if (p.resumePdfUrl) await this._uploadFile('[data-automation-id="file-upload-input-ref"]', p.resumePdfUrl, `${p.firstName}_${p.lastName}_Resume.pdf`);
    await this._fillGeneric(); // catch any missed fields
  }

  // ── Greenhouse (Airbnb, Figma, Stripe, etc.) ──
  async _fillGreenhouse() {
    const p = this.p;
    await this._set('input#first_name, input[name="job_application[first_name]"]',       p.firstName);
    await this._set('input#last_name,  input[name="job_application[last_name]"]',        p.lastName);
    await this._set('input#email,      input[name="job_application[email]"]',            p.email);
    await this._set('input#phone,      input[name="job_application[phone]"]',            p.phone);
    await this._set('input[name="job_application[location]"]',                            p.location);
    await this._set('input[name*="linkedin" i], input[id*="linkedin" i]',                p.linkedinUrl);
    await this._set('input[name*="github" i],   input[id*="github" i]',                  p.githubUrl);
    await this._set('input[name*="website" i],  input[id*="portfolio" i]',               p.portfolioUrl);
    if (p.resumePdfUrl) await this._uploadFile('#resume_upload input[type="file"], input[name="job_application[resume]"]', p.resumePdfUrl, `${p.firstName}_Resume.pdf`);
    if (p.coverLetterText) await this._set('textarea[name*="cover_letter" i], textarea[id*="cover_letter" i]', p.coverLetterText);
  }

  // ── Lever (Netflix, GitHub, etc.) ──
  async _fillLever() {
    const p = this.p;
    await this._set('input[name="cards[name][first_name]"], input[name*="first" i]',     p.firstName);
    await this._set('input[name="cards[name][last_name]"],  input[name*="last" i]',      p.lastName);
    await this._set('input[name="cards[basic][email]"],     input[type="email"]',        p.email);
    await this._set('input[name="cards[basic][phone]"],     input[type="tel"]',          p.phone);
    await this._set('input[name*="location" i], input[name*="city" i]',                  p.location);
    await this._set('input[name*="linkedin" i]',                                          p.linkedinUrl);
    await this._set('input[name*="github" i]',                                            p.githubUrl);
    await this._set('input[name*="website" i], input[name*="portfolio" i]',              p.portfolioUrl);
    if (p.resumePdfUrl) await this._uploadFile('input[name*="resume" i], .application-upload input[type="file"]', p.resumePdfUrl, `${p.firstName}_Resume.pdf`);
    if (p.coverLetterText) await this._set('textarea[name*="cover" i]', p.coverLetterText);
  }

  // ── iCIMS ──
  async _fillICIMS() {
    const p = this.p;
    await this._set('input[id*="firstName" i], input[name*="firstName" i]', p.firstName);
    await this._set('input[id*="lastName" i],  input[name*="lastName" i]',  p.lastName);
    await this._set('input[id*="email" i],     input[name*="email" i]',     p.email);
    await this._set('input[id*="phone" i],     input[name*="phone" i]',     p.phone);
    await this._fillGeneric();
  }

  // ── SmartRecruiters ──
  async _fillSmartRecruiters() {
    const p = this.p;
    await this._set('input[name="firstName"],     input[data-qa="firstName"]',     p.firstName);
    await this._set('input[name="lastName"],      input[data-qa="lastName"]',      p.lastName);
    await this._set('input[name="email"],         input[data-qa="email"]',         p.email);
    await this._set('input[name="phoneNumber"],   input[data-qa="phone"]',         p.phone);
    await this._set('input[name*="location" i]',                                    p.location);
    await this._fillGeneric();
  }

  // ── Workable ──
  async _fillWorkable() {
    const p = this.p;
    await this._set('input[name="firstname"], input[data-ui="firstname"]', p.firstName);
    await this._set('input[name="lastname"],  input[data-ui="lastname"]',  p.lastName);
    await this._set('input[name="email"],     input[data-ui="email"]',     p.email);
    await this._set('input[name="phone"],     input[data-ui="phone"]',     p.phone);
    await this._set('input[name*="linkedin" i]',                            p.linkedinUrl);
    await this._fillGeneric();
  }

  // ── Taleo (Oracle) ──
  async _fillTaleo() {
    const p = this.p;
    await this._set('input[id*="firstName" i], input[name*="firstName" i]', p.firstName);
    await this._set('input[id*="lastName" i],  input[name*="lastName" i]',  p.lastName);
    await this._set('input[id*="email" i]',                                   p.email);
    await this._set('input[id*="phone" i]',                                   p.phone);
    await this._fillGeneric();
  }

  // ── Rozee.pk ──
  async _fillRozee() {
    const p = this.p;
    await this._set('input[name="first_name"], input[id*="first_name" i]',  p.firstName);
    await this._set('input[name="last_name"],  input[id*="last_name" i]',   p.lastName);
    await this._set('input[name="email"],      input[type="email"]',         p.email);
    await this._set('input[name="mobile"],     input[name="phone"]',         p.phone);
    await this._set('input[name*="city" i],    input[name*="location" i]',   p.city || p.location);
    await this._fillGeneric();
  }

  // ── Naukri ──
  async _fillNaukri() {
    const p = this.p;
    await this._set('input[placeholder*="First Name" i], input[name*="firstName" i]', p.firstName);
    await this._set('input[placeholder*="Last Name" i],  input[name*="lastName" i]',  p.lastName);
    await this._set('input[type="email"]',                                              p.email);
    await this._set('input[type="tel"]',                                                p.phone);
    await this._fillGeneric();
  }

  // ── GENERIC SEMANTIC FALLBACK ──
  // Works on ~85% of any form via identifier matching
  async _fillGeneric() {
    const p = this.p;
    const mappings = [
      { keys: ['firstname', 'first_name', 'fname', 'given_name', 'givenname'],                          value: p.firstName },
      { keys: ['lastname',  'last_name',  'lname', 'family_name', 'familyname', 'surname'],             value: p.lastName  },
      { keys: ['fullname',  'full_name',  'name',  'yourname', 'applicantname'],                        value: `${p.firstName} ${p.lastName}`.trim() },
      { keys: ['email',     'e-mail',     'emailaddress', 'email_address', 'youremail'],                value: p.email     },
      { keys: ['phone',     'mobile',     'telephone', 'tel', 'phonenumber', 'phone_number', 'cell'],   value: p.phone     },
      { keys: ['city',      'location',   'currentlocation', 'currentcity', 'address'],                 value: p.city || p.location },
      { keys: ['linkedin',  'linkedinurl', 'linkedin_url', 'linkedinprofile'],                          value: p.linkedinUrl  },
      { keys: ['github',    'githuburl',  'github_url',  'githubprofile'],                              value: p.githubUrl    },
      { keys: ['portfolio', 'website',    'personalsite', 'portfoliourl', 'personalwebsite'],           value: p.portfolioUrl },
    ];

    const inputs = document.querySelectorAll(
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]), textarea'
    );

    for (const input of inputs) {
      if (input.value) continue; // Don't overwrite already-filled fields

      const identifiers = [
        input.name,
        input.id,
        input.placeholder,
        input.getAttribute('aria-label'),
        input.getAttribute('data-testid'),
        input.getAttribute('autocomplete'),
        input.getAttribute('data-qa'),
        this._getLabelText(input),
      ]
        .filter(Boolean)
        .map(s => s.toLowerCase().replace(/[\s\-_]/g, ''));

      for (const mapping of mappings) {
        if (!mapping.value) continue;
        const matched = mapping.keys.some(k => identifiers.some(id => id.includes(k)));
        if (matched) {
          await this._setDirect(input, mapping.value);
          break;
        }
      }
    }
  }

  // ── HELPERS ──

  _getLabelText(input) {
    if (input.id) {
      const label = document.querySelector(`label[for="${CSS.escape(input.id)}"]`);
      if (label) return label.textContent;
    }
    return input.closest('label')?.textContent || '';
  }

  async _set(selectorGroup, value) {
    if (!value) return;
    for (const selector of selectorGroup.split(',').map(s => s.trim())) {
      const el = document.querySelector(selector);
      if (el && !el.value) {
        await this._setDirect(el, value);
        return;
      }
    }
  }

  async _setDirect(el, value) {
    if (!el || !value) return;
    el.focus();

    // React/Vue/Angular compatibility: trigger synthetic setter so frameworks
    // detect the change and update their internal state.
    const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (nativeSetter) {
      nativeSetter.call(el, value);
    } else {
      el.value = value;
    }

    ['input', 'change', 'keyup'].forEach(evtType => {
      el.dispatchEvent(new Event(evtType, { bubbles: true, cancelable: true }));
    });

    el.blur();
    await this._sleep(60);
  }

  async _uploadFile(selectorGroup, pdfUrl, fileName) {
    let input = null;
    for (const selector of selectorGroup.split(',').map(s => s.trim())) {
      input = document.querySelector(selector);
      if (input) break;
    }
    if (!input) return;

    try {
      const response = await fetch(pdfUrl);
      if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
      const blob = await response.blob();
      const file = new File([blob], fileName, { type: 'application/pdf' });
      const dt   = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    } catch (err) {
      console.warn('[CareerPilot] Resume upload failed:', err.message);
    }
  }

  _sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
}


// ────────────────────────────────────────────────────────────────
// SECTION 3: JOB / PROFILE / COMPANY EXTRACTOR
// ────────────────────────────────────────────────────────────────
class JobExtractor {
  constructor() { this._cache = null; }

  // ── Clean HTML element to readable plain text ──
  _clean(el) {
    if (!el) return '';
    const clone = el.cloneNode(true);
    clone.querySelectorAll('script, style, button, noscript').forEach(n => n.remove());
    clone.querySelectorAll('li').forEach(li => { li.textContent = `• ${li.textContent.trim()}\n`; });
    clone.querySelectorAll('p, div, h1, h2, h3, h4, h5, h6').forEach(b => {
      b.textContent = `${b.textContent.trim()}\n\n`;
    });
    clone.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
    return clone.textContent.replace(/\n{3,}/g, '\n\n').trim();
  }

  // ── Try a list of CSS selectors, return first truthy result ──
  _pick(selectors, transform = el => el.textContent.trim()) {
    for (const sel of (Array.isArray(selectors) ? selectors : [selectors])) {
      try {
        const el = document.querySelector(sel);
        if (el) {
          const result = transform(el);
          if (result) return result;
        }
      } catch (e) { /* bad selector — skip */ }
    }
    return '';
  }

  _parseSalary(str) {
    if (!str) return null;
    const cleaned = str.replace(/[,$\s]/g, '').toLowerCase();
    const num = parseFloat(cleaned);
    if (isNaN(num)) return null;
    return cleaned.includes('k') ? Math.round(num * 1000) : Math.round(num);
  }

  _extractSalaryFromText(text) {
    const patterns = [
      /\$?([\d,]+(?:\.\d+)?k?)\s*[-–to]+\s*\$?([\d,]+(?:\.\d+)?k?)/i,
      /salary[:\s]+\$?([\d,]+k?)\s*[-–]\s*\$?([\d,]+k?)/i,
    ];
    for (const pat of patterns) {
      const m = text.match(pat);
      if (m) {
        const min = this._parseSalary(m[1]);
        const max = this._parseSalary(m[2]);
        if (min && max) return { min, max };
      }
    }
    return null;
  }

  _base() {
    return {
      position: '', company: '', location: '', description: '',
      jobUrl: window.location.href,
      minSalary: null, maxSalary: null, datePosted: null, deadline: null,
    };
  }

  // ── Main entry point ──
  extractJobData() {
    const { hostname, pathname } = window.location;

    // LinkedIn profile page
    if (hostname.includes('linkedin.com') && pathname.includes('/in/'))
      return { type: 'profile', ...this._linkedInProfile() };

    // LinkedIn company / school page
    if (hostname.includes('linkedin.com') && (pathname.includes('/company/') || pathname.includes('/school/')))
      return { type: 'company', ...this._linkedInCompany() };

    // Try JSON-LD first (best quality, works on many sites)
    const jsonLd = this._fromJsonLd();
    if (jsonLd?.position) return jsonLd;

    // Site-specific extractors
    if (hostname.includes('linkedin.com'))      return this._linkedInJob();
    if (hostname.includes('indeed.com'))        return this._indeed();
    if (hostname.includes('glassdoor.com'))     return this._glassdoor();
    if (hostname.includes('rozee.pk'))          return this._rozee();
    if (hostname.includes('naukri.com'))        return this._naukri();
    if (hostname.includes('lever.co'))          return this._lever();
    if (hostname.includes('greenhouse.io'))     return this._greenhouse();
    if (hostname.includes('myworkdayjobs.com')) return this._workday();

    // Meta tags fallback
    const meta = this._fromMetaTags();
    if (meta?.position) return meta;

    // Last resort: generic DOM heuristics
    return this._generic();
  }

  getJobData(mode = 'auto') {
    if (mode !== 'auto') this._cache = null;
    if (mode === 'profile') return { type: 'profile', ...this._linkedInProfile() };
    if (mode === 'company') return { type: 'company', ...this._linkedInCompany() };
    if (!this._cache) this._cache = this.extractJobData();
    return this._cache;
  }

  // Force-bust the cache so next call always re-reads the DOM
  invalidate() { this._cache = null; }

  // ── JSON-LD (Schema.org/JobPosting) — works on most modern job boards ──
  _fromJsonLd() {
    const data = this._base();
    for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        const json = JSON.parse(script.textContent);
        const arr  = Array.isArray(json) ? json : [json];
        const job  = arr.find(item => item['@type'] === 'JobPosting');
        if (!job) continue;

        data.position    = job.title || '';
        data.company     = job.hiringOrganization?.name || '';
        data.location    = job.jobLocation?.address?.addressLocality
          || job.jobLocation?.address?.addressRegion
          || job.jobLocation?.address?.addressCountry || '';
        data.datePosted  = job.datePosted || null;
        data.deadline    = job.validThrough || null;
        data.minSalary   = job.baseSalary?.value?.minValue || null;
        data.maxSalary   = job.baseSalary?.value?.maxValue || null;

        let desc = job.description || '';
        if (desc.includes('<')) {
          const d = document.createElement('div');
          d.innerHTML = desc;
          desc = this._clean(d);
        }
        data.description = desc;
        return data;
      } catch (_) { /* malformed JSON-LD — skip */ }
    }
    return null;
  }

  // ── OpenGraph / meta tags ──
  _fromMetaTags() {
    const data     = this._base();
    data.position  = document.querySelector('meta[property="og:title"]')?.content || document.title || '';
    data.company   = document.querySelector('meta[property="og:site_name"]')?.content || '';
    data.description = document.querySelector('meta[property="og:description"]')?.content
      || document.querySelector('meta[name="description"]')?.content || '';
    return data;
  }

  // ── LinkedIn Job Posting ──
  _linkedInJob() {
    const data = this._base();

    data.position = this._pick([
      'h1.job-details-jobs-unified-top-card__job-title',
      'h1.job-details-jobs-unified-top-card__job-title a',
      'h1[data-test-id="job-title"]',
      'h1.top-card-layout__title',
      'h1',
    ]);

    data.company = this._pick([
      '.job-details-jobs-unified-top-card__company-name a',
      '.job-details-jobs-unified-top-card__company-name',
      'a.topcard__org-name-link',
      '.jobs-details-top-card__company-name',
    ]);

    // Location line format: "Company · Location · X days ago"
    const locEl = document.querySelector(
      '.job-details-jobs-unified-top-card__primary-description-without-tagline, ' +
      '.job-details-jobs-unified-top-card__primary-description'
    );
    if (locEl) {
      const parts = locEl.textContent.split('·').map(s => s.trim()).filter(Boolean);
      // Skip first part (company name) and any time/duration segments
      const locationPart = parts.slice(1).find(p => !/^\d+\s*(minute|hour|day|week|month|year|second)/i.test(p));
      data.location = locationPart || (parts.length >= 2 ? parts[1] : locEl.textContent.trim());
    }
    // LinkedIn 2024+ fallback: location in separate bullet/metadata elements
    if (!data.location) {
      const topCard = document.querySelector('[class*="job-details-jobs-unified-top-card"], .jobs-unified-top-card');
      const container = topCard || document.querySelector('main');
      if (container) {
        for (const el of container.querySelectorAll('span, li')) {
          if (el.children.length > 1) continue; // skip wrapper containers
          const t = el.textContent.trim();
          if (
            t.length > 3 && t.length < 80 &&
            /,\s*[A-Z]/.test(t) && // city, region/country pattern
            !/apply|save|easy apply|promoted|follower|employee/i.test(t)
          ) {
            data.location = t;
            break;
          }
        }
      }
    }

    data.description = this._pick([
      '.jobs-description__content',
      '.show-more-less-html__markup',
      '#job-details',
      '.jobs-box__html-content',
    ], el => this._clean(el));

    // Salary from insight chips
    for (const ins of document.querySelectorAll('.job-details-jobs-unified-top-card__job-insight')) {
      const salary = this._extractSalaryFromText(ins.textContent);
      if (salary) { data.minSalary = salary.min; data.maxSalary = salary.max; break; }
    }

    return data;
  }

  // ── Indeed ──
  _indeed() {
    const data = this._base();
    data.position  = this._pick(['h2[data-testid="job-title"]', '.jobsearch-JobInfoHeader-title', 'h1']);
    data.company   = this._pick(['[data-testid="inlineHeader-companyName"]', '.jobsearch-InlineCompanyRating', '[data-company-name]']);
    data.location  = this._pick(['[data-testid="job-location"]', '[data-testid="inlineHeader-companyLocation"]']);
    data.description = this._pick(['#jobDescriptionText', '.jobsearch-jobDescriptionText'], el => this._clean(el));

    const salaryEl = document.querySelector('[data-testid="attribute_snippet_testid"], [class*="salary" i]');
    if (salaryEl) {
      const s = this._extractSalaryFromText(salaryEl.textContent);
      if (s) { data.minSalary = s.min; data.maxSalary = s.max; }
    }
    return data;
  }

  // ── Glassdoor (uses hashed class names — use data-test where possible) ──
  _glassdoor() {
    const data = this._base();
    data.position    = this._pick(['[data-test="job-title"]', 'h1[class*="title" i]', 'h1']);
    data.company     = this._pick(['[data-test="employer-name"]', '[class*="employerName" i]', '[class*="employer" i]']);
    data.location    = this._pick(['[data-test="location"]', '[class*="location" i]']);
    data.description = this._pick(['[data-test="description"]', '[class*="jobDescription" i]', '[class*="desc" i]'], el => this._clean(el));

    const salary = this._extractSalaryFromText(
      document.querySelector('[data-test="salary-estimate"], [class*="salary" i]')?.textContent || ''
    );
    if (salary) { data.minSalary = salary.min; data.maxSalary = salary.max; }
    return data;
  }

  // ── Rozee.pk ──
  _rozee() {
    const data = this._base();
    data.position = this._pick([
      'h1.job-title', 'h1[class*="title" i]', '.job-header h1',
      '[class*="jobTitle" i]', 'h1',
    ]);
    data.company = this._pick([
      '.company-name a', '.company-name', '[class*="companyName" i]',
      '[class*="employer" i]',
    ]);
    data.location = this._pick([
      '[class*="location" i]', '[class*="city" i]',
      '[itemprop="jobLocation"]',
    ], el => el.textContent.trim().replace(/^location:/i, '').trim());

    data.description = this._pick([
      '[class*="job-description" i]', '[class*="jobDescription" i]',
      '.description-wrapper', '#job-description',
    ], el => this._clean(el));

    const dateEl = document.querySelector('[class*="posted" i], [class*="date" i], time[datetime]');
    if (dateEl) data.datePosted = dateEl.getAttribute('datetime') || dateEl.textContent.trim();

    const salary = this._extractSalaryFromText(
      document.querySelector('[class*="salary" i], [itemprop="baseSalary"]')?.textContent || ''
    );
    if (salary) { data.minSalary = salary.min; data.maxSalary = salary.max; }
    return data;
  }

  // ── Naukri ──
  _naukri() {
    const data = this._base();
    data.position    = this._pick(['h1.jd-header-title', 'h1[class*="title" i]', 'h1']);
    data.company     = this._pick(['.jd-header-comp-name a', '.comp-name', '[class*="comp-name" i]']);
    data.location    = this._pick(['.loc span', '[class*="location" i]']);
    data.description = this._pick(['.job-desc', '[class*="job-desc" i]', '#job_description'], el => this._clean(el));
    const salary = this._extractSalaryFromText(document.querySelector('[class*="salary" i]')?.textContent || '');
    if (salary) { data.minSalary = salary.min; data.maxSalary = salary.max; }
    return data;
  }

  // ── Lever ──
  _lever() {
    const data = this._base();
    data.position    = this._pick(['.posting-headline h2', 'h2.posting-name', 'h2']);
    data.company     = document.title.includes(' at ') ? document.title.split(' at ').pop().trim() : '';
    data.location    = this._pick(['.sort-by-time.posting-category', '.posting-categories .location', '[class*="location" i]']);
    data.description = this._pick(['.posting-description', '.section-wrapper'], el => this._clean(el));
    return data;
  }

  // ── Greenhouse ──
  _greenhouse() {
    const data = this._base();
    data.position    = this._pick(['.app-title', '#app_title', 'h1']);
    data.company     = this._pick(['.company-name', '#company_name']);
    data.location    = this._pick(['.location', '[class*="location" i]']);
    data.description = this._pick(['#content', '.content', '#job_description'], el => this._clean(el));
    return data;
  }

  // ── Workday ──
  _workday() {
    const data = this._base();
    data.position    = this._pick(['[data-automation-id="jobPostingHeader"]', 'h2[data-automation-id*="title" i]', 'h1']);
    data.company     = document.title.split(' - ').pop()?.trim() || '';
    data.location    = this._pick(['[data-automation-id="locations"]', '[data-automation-id="location"]']);
    data.description = this._pick(['[data-automation-id="jobPostingDescription"]'], el => this._clean(el));
    return data;
  }

  // ── Generic (any unknown site) ──
  _generic() {
    const data = this._base();

    const titleCandidates = [
      'h1[class*="title" i]', 'h1[class*="job" i]', 'h1[class*="position" i]',
      '[class*="job-title" i]', '[class*="position-title" i]',
      '[data-testid*="title" i]', 'h1', 'h2[class*="title" i]',
    ];
    for (const sel of titleCandidates) {
      for (const el of document.querySelectorAll(sel)) {
        const t = el.textContent.trim();
        if (t.length > 3 && t.length < 200 && !/menu|navigation|skip|home|about|cookie/i.test(t)) {
          data.position = t;
          break;
        }
      }
      if (data.position) break;
    }

    data.company  = this._pick(['[class*="company" i]', '[class*="employer" i]', '[itemprop="name"]']);
    data.location = this._pick(['[class*="location" i]', '[class*="city" i]', '[itemprop="addressLocality"]']);

    const descCandidates = [
      '[class*="job-description" i]', '[class*="jobDescription" i]',
      '[class*="description" i]', 'main article', 'article', 'main', '[role="main"]',
    ];
    for (const sel of descCandidates) {
      const el = document.querySelector(sel);
      if (el) {
        const t = this._clean(el);
        if (t.length > 100) { data.description = t.substring(0, 50000); break; }
      }
    }

    const salary = this._extractSalaryFromText(document.body.textContent);
    if (salary) { data.minSalary = salary.min; data.maxSalary = salary.max; }

    return data;
  }

  // ── LinkedIn Profile ──
  _linkedInProfile() {
    const d = {
      name: '', headline: '', company: '', position: '',
      location: '', about: '', profileUrl: window.location.href, photoUrl: ''
    };

    // ─────────────────────────────────────────────────────────────
    // STRATEGY: Prefer aria-* attributes, data-* attrs, and element
    // ROLE / structural position over class names, which LinkedIn
    // rotates with every deploy (hashed Tailwind / CSS Modules).
    // ─────────────────────────────────────────────────────────────

    // ── NAME ──────────────────────────────────────────────────────
    // The profile name is always the first <h1> in <main>. LinkedIn
    // has never changed this structural contract.
    const mainEl = document.querySelector('main') || document.body;

    const h1s = Array.from(mainEl.querySelectorAll('h1'));
    for (const h1 of h1s) {
      // Strip visually-hidden accessibility spans (LinkedIn injects these into h1)
      const clone = h1.cloneNode(true);
      clone.querySelectorAll('.visually-hidden, [class*="visually-hidden"]').forEach(n => n.remove());
      const t = clone.textContent.replace(/\s+/g, ' ').trim();
      // A real name: 2-80 chars, no action words, not inside the global site nav/banner
      if (
        t.length >= 2 && t.length <= 80 &&
        !/^(sign in|join|connect|message|follow|more|search)/i.test(t) &&
        !h1.closest('nav') && !h1.closest('[role="banner"]')
      ) {
        d.name = t;
        break;
      }
    }

    // ── HEADLINE ──────────────────────────────────────────────────
    // LinkedIn renders the headline in the element immediately after
    // the h1 inside the top-card section. It is NEVER an h1/h2 itself.
    // We look for the first non-empty sibling text block near the h1.
    //
    // Also try well-known selector variants for belt-and-suspenders.
    const headlineCandidates = [
      // Stable aria / structural selectors
      '[aria-label*="headline" i]',
      '[data-field="headline"]',
      // Class-name hints (LinkedIn has used these historically)
      'div.text-body-medium.break-words',
      'div.text-body-medium',
      '.top-card-layout__headline',
      '.pv-top-card--list-bullet',
    ];

    for (const sel of headlineCandidates) {
      const el = document.querySelector(sel);
      if (!el) continue;
      const t = el.textContent.trim();
      if (t.length > 3 && t !== d.name && !/^\d+ (connection|follower)/i.test(t)) {
        d.headline = t;
        break;
      }
    }

    // Structural fallback: sibling of the h1 that holds the name
    if (!d.headline) {
      const nameH1 = h1s.find(h => h.textContent.trim() === d.name);
      if (nameH1) {
        // Walk forward siblings / parent's children to find the headline div
        let sib = nameH1.nextElementSibling;
        for (let i = 0; i < 5 && sib; i++, sib = sib.nextElementSibling) {
          const t = sib.textContent.trim();
          if (t.length > 5 && t !== d.name && !/^\d+ (connection|follower)/i.test(t)) {
            d.headline = t;
            break;
          }
        }
        // Also try parent's next sibling
        if (!d.headline && nameH1.parentElement) {
          const parentSib = nameH1.parentElement.nextElementSibling;
          if (parentSib) {
            const t = parentSib.textContent.trim();
            if (t.length > 5 && t !== d.name) d.headline = t;
          }
        }
      }
    }

    // Clean up headline — LinkedIn sometimes injects unicode chars
    d.headline = d.headline.replace(/\u200b/g, '').replace(/\s+/g, ' ').trim();

    // ── PARSE POSITION + COMPANY FROM HEADLINE ────────────────────
    if (d.headline) {
      const h = d.headline;
      // "CEO @ IT Park Uzbekistan | VC Committee Member..."
      if (h.includes(' @ ')) {
        const [pos, ...rest] = h.split(' @ ');
        d.position = pos.trim();
        d.company  = rest.join(' @ ').split('|')[0].trim();
      }
      // "Senior Engineer at Google | Building things"
      else if (/ at /i.test(h)) {
        const idx  = h.search(/ at /i);
        d.position = h.slice(0, idx).trim();
        d.company  = h.slice(idx + 4).split('|')[0].trim();
      }
      // "CEO | IT Park Uzbekistan | VC Committee..."
      else if (h.includes(' | ')) {
        const parts = h.split(' | ');
        d.position = parts[0].trim();
        d.company  = parts[1]?.trim() || '';
      }
      else {
        d.position = h.trim();
      }
    }

    // ── COMPANY (dedicated fallbacks if headline parse came up empty) ─
    if (!d.company) {
      // 1. Aria-label on experience buttons
      for (const el of document.querySelectorAll('[aria-label*="Current company" i], [aria-label*="current employer" i]')) {
        const label = el.getAttribute('aria-label') || '';
        const m = label.match(/current company[:\s]+([^.]+)/i) || label.match(/current employer[:\s]+([^.]+)/i);
        if (m) { d.company = m[1].trim(); break; }
      }
    }

    if (!d.company) {
      // 2. data-field attribute (LinkedIn sometimes uses this on experience items)
      const compEl = document.querySelector('[data-field="current_company_name"], [data-field="company"]');
      if (compEl) d.company = compEl.textContent.trim();
    }

    if (!d.company) {
      // 3. Experience section — first listed company name
      // LinkedIn renders experience as a list; first item = current role
      const expSection = Array.from(document.querySelectorAll('section')).find(s => {
        const hdr = s.querySelector('h2');
        return hdr && /experience/i.test(hdr.textContent);
      });
      if (expSection) {
        // Company name is usually a <span> with aria-hidden="false" or a plain anchor
        const compSpan = expSection.querySelector('span[aria-hidden="true"]');
        if (compSpan) {
          const t = compSpan.textContent.trim();
          if (t.length > 1 && t.length < 80) d.company = t;
        }
      }
    }

    // ── LOCATION ──────────────────────────────────────────────────
    // LinkedIn renders "Tashkent, Uzbekistan · Contact info"
    // The location is always a small-font span in the left panel / top card.
    // Key invariant: it contains a comma (city, country) or just a city.
    const locCandidates = [
      '[aria-label*="location" i]',
      '[data-field="location"]',
      // LinkedIn 2024-2025: location often in a button in the left panel
      'button.pv-text-details__left-panel-item-text',
      '.pv-text-details__left-panel span.text-body-small',
      // Older LinkedIn class patterns
      'span.text-body-small.inline.t-black--light.break-words',
      'span.text-body-small.inline',
      '.top-card-layout__first-sub-title',
    ];

    for (const sel of locCandidates) {
      for (const el of document.querySelectorAll(sel)) {
        const raw = el.textContent.trim();
        const t   = raw.split('·')[0].trim(); // drop " · Contact info" suffix
        if (
          t.length > 2 && t.length < 100 &&
          !/contact info|connection|follower|degree|open to|mutual|^\d/i.test(t)
        ) {
          d.location = t;
          break;
        }
      }
      if (d.location) break;
    }

    // Structural fallback: look for a span near the name h1 that looks like a location
    if (!d.location) {
      // Also matches single-city names like "London" or "Tashkent Area"
      const locationLike = /^[A-Z][a-zA-ZÀ-ÿ\s.'-]+(?:,\s*[A-Z][a-zA-ZÀ-ÿ\s.']+)?(?:\s+Area)?$/;
      for (const span of mainEl.querySelectorAll('span')) {
        const t = span.textContent.trim().split('·')[0].trim();
        if (t.length > 2 && t.length < 80 && locationLike.test(t) && !span.closest('nav')) {
          d.location = t;
          break;
        }
      }
    }

    // ── ABOUT ──────────────────────────────────────────────────────
    // The About section is a <section> whose <h2> contains "About".
    // LinkedIn uses span[aria-hidden="true"] inside the h2 for the label.

    // Find the About section by its heading text (structural, not class-based)
    let aboutSection = null;
    for (const section of mainEl.querySelectorAll('section')) {
      const h2 = section.querySelector('h2');
      if (h2 && /^about$/i.test(h2.textContent.replace(/\s+/g,' ').trim())) {
        aboutSection = section;
        break;
      }
    }

    // Also try <div id="about"> or <section id="about">
    if (!aboutSection) {
      aboutSection = mainEl.querySelector('[id="about"]');
    }

    if (aboutSection) {
      // Ordered list of text containers LinkedIn has used
      const aboutTextSelectors = [
        // Newest: inline-show-more span pattern
        '.inline-show-more-text span[aria-hidden="true"]',
        '.inline-show-more-text',
        '[class*="inline-show-more"]',
        // Older: pv-shared-text
        '.pv-shared-text-with-see-more span[aria-hidden="true"]',
        '.pv-shared-text-with-see-more',
        // visually-hidden full text (accessibility copy — full unshrunk text)
        'span.visually-hidden',
        // Any non-empty paragraph
        'p',
        // Catch-all: a <span> with the bulk of text
        'span',
      ];

      for (const sel of aboutTextSelectors) {
        for (const el of aboutSection.querySelectorAll(sel)) {
          // Skip the "About" heading itself and button labels
          if (el.closest('h2') || el.closest('button')) continue;
          const t = el.textContent.replace(/\s+/g, ' ').trim();
          if (t.length > 30 && !/^about$/i.test(t)) {
            d.about = t.replace(/[\u2026…]\s*see more/gi, '').trim();
            break;
          }
        }
        if (d.about) break;
      }

      // Last resort: dump the section, strip h2 + buttons
      if (!d.about) {
        const clone = aboutSection.cloneNode(true);
        clone.querySelectorAll('h2, button, svg').forEach(n => n.remove());
        const t = clone.textContent.replace(/\s+/g, ' ').trim();
        if (t.length > 30) d.about = t.replace(/[\u2026…]\s*see more/gi, '').trim();
      }
    }

    // Global fallback for About: first long <p> in main that's not nav/header
    if (!d.about) {
      for (const p of mainEl.querySelectorAll('p')) {
        if (p.closest('nav') || p.closest('header') || p.closest('footer')) continue;
        const t = p.textContent.replace(/\s+/g, ' ').trim();
        if (t.length > 80 && !/cookie|privacy|terms|©/i.test(t)) {
          d.about = t.replace(/[\u2026…]\s*see more/gi, '').trim();
          break;
        }
      }
    }

    // ── PHOTO ──────────────────────────────────────────────────────
    const photoSelectors = [
      // Specific aria labels LinkedIn uses
      'button[aria-label*="profile photo" i] img',
      'button[aria-label*="Edit profile photo" i] img',
      // Class-name variants (historical)
      'img.pv-top-card-profile-picture__image--show',
      'img.pv-top-card-profile-picture__image',
      'img.profile-photo-edit__preview',
      'img[class*="profile-picture"]',
      'img[class*="profile-photo"]',
      // Structural: first 200px img in main
      'img[width="200"]',
    ];
    for (const sel of photoSelectors) {
      const img = document.querySelector(sel);
      if (img?.src && !img.src.includes('data:image/gif') && img.src.startsWith('http')) {
        d.photoUrl = img.src;
        break;
      }
    }

    return d;
  }
  // ── LinkedIn Company Page ──
  _linkedInCompany() {
    const d = { name: '', industry: '', size: '', location: '', website: '', linkedinUrl: window.location.href, about: '', logoUrl: '', foundedYear: '', employeeCount: '' };

    d.name = this._pick(['h1.org-top-card-summary__title', '.org-top-card-summary__title', 'h1']);

    const logo = document.querySelector('img.org-top-card-primary-content__logo, .org-top-card-primary-content__logo-container img');
    if (logo) d.logoUrl = logo.src;

    // Definition list in About section (most reliable)
    let currentDt = '';
    for (const el of document.querySelectorAll('dl dt, dl dd')) {
      if (el.tagName === 'DT') { currentDt = el.textContent.trim().toLowerCase(); continue; }
      const t = el.textContent.trim();
      if (currentDt.includes('industry'))     d.industry   = t;
      if (currentDt.includes('website'))      d.website    = t;
      if (currentDt.includes('company size')) d.size       = t;
      if (currentDt.includes('headquarters')) d.location   = t;
      if (currentDt.includes('founded'))      d.foundedYear = t;
    }

    // Top card summary items
    for (const item of document.querySelectorAll('.org-top-card-summary-info-list__info-item')) {
      const t = item.textContent.trim();
      if (!d.size     && /employee/i.test(t) && !/see all/i.test(t)) d.size     = t;
      if (!d.industry && !/employee|follower|\d/i.test(t))           d.industry = t;
      if (!d.location && t.includes(',') && !/employee|follower/i.test(t)) d.location = t;
    }

    // Employee count from "See all X employees" link
    const empLink = document.querySelector('a[href*="/search/results/people/"]');
    if (empLink) {
      const m = empLink.textContent.match(/[\d,]+/);
      if (m) d.employeeCount = m[0].replace(/,/g, '');
    }

    d.about = this._pick([
      '.org-about-us-organization-description__text',
      'section.artdeco-card p',
      '.break-words',
    ], el => el.textContent.length > 50 ? this._clean(el) : '');

    return d;
  }
}



// ────────────────────────────────────────────────────────────────
// SECTION 4: RUNTIME — MESSAGE LISTENER + REACTIVE ENGINE
// ────────────────────────────────────────────────────────────────

// Instantiate extractor (must exist before PageState.init() is called)
const extractor = new JobExtractor();

// ── Message listener ──
// Popup or background can always request fresh data or trigger autofill
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  // ── Extract job / profile / company data ──
  if (request.action === 'extractJobData') {
    // Force-bust cache so popup always gets fresh data on manual click
    extractor.invalidate();
    const data = extractor.getJobData(request.mode || 'auto');
    sendResponse({ success: true, data });
    return true;
  }

  // ── Return currently cached data (popup can call this on open to get instant data) ──
  if (request.action === 'getCachedData') {
    const cached = PageState.getCurrentData();
    sendResponse({ success: true, data: cached, ats: PageState.getCurrentAts() });
    return true;
  }

  // ── Detect ATS on current page ──
  if (request.action === 'detectATS') {
    sendResponse({
      success:     true,
      ats:         ATSDetector.detect(),
      isApplyPage: ATSDetector.isApplyPage(),
    });
    return true;
  }

  // ── Autofill ATS form ──
  if (request.action === 'autofill') {
    const filler = new ATSAutofiller(request.profile);
    filler.fill().then(result => sendResponse(result));
    return true; // async — keep channel open
  }

  return false;
});

// ── Start the reactive engine ──
// This replaces the old one-shot window.addEventListener('load', ...) approach.
// PageState handles: initial load, SPA URL changes, DOM mutations, debouncing.
PageState.init();
