// Content script to extract job details from various job sites

class JobExtractor {
  constructor() {
    this.jobData = null;
    this.listeners = [];
  }

  // Clean HTML to markdown-like text
  cleanHtmlToMarkdown(element) {
    if (!element) return '';

    // Clone to avoid modifying the actual page
    const clone = element.cloneNode(true);

    // Remove comments
    const removeComments = (node) => {
      for (let i = 0; i < node.childNodes.length; i++) {
        const child = node.childNodes[i];
        if (child.nodeType === 8) { // Comment node
          node.removeChild(child);
          i--;
        } else if (child.nodeType === 1) {
          removeComments(child);
        }
      }
    };
    removeComments(clone);

    // List items
    const lis = clone.querySelectorAll('li');
    lis.forEach(li => {
      li.textContent = `• ${li.textContent.trim()}\n`;
    });

    // Paragraphs and Divs (for block spacing)
    const blocks = clone.querySelectorAll('p, div, h1, h2, h3, h4, h5, h6');
    blocks.forEach(b => {
      b.textContent = `${b.textContent.trim()}\n\n`;
    });

    // Bold/Strong
    const bolds = clone.querySelectorAll('strong, b');
    bolds.forEach(b => {
      b.textContent = `**${b.textContent.trim()}**`;
    });

    // Br
    clone.querySelectorAll('br').forEach(br => br.replaceWith(document.createTextNode('\n')));

    return clone.textContent.replace(/\n{3,}/g, '\n\n').trim();
  }

  // Extract job data - tries multiple methods in order of quality
  extractJobData() {
    const url = window.location.href;
    const hostname = window.location.hostname;
    const path = window.location.pathname;

    // Check if it's a LinkedIn Profile
    if (hostname.includes('linkedin.com') && path.includes('/in/')) {
      return {
        type: 'profile',
        ...this.extractProfileData()
      };
    }

    // Default to Job Extraction
    // First, try JSON-LD (Schema.org/JobPosting) - highest quality
    const jsonLdData = this.extractFromJsonLd();
    if (jsonLdData && jsonLdData.position) {
      return jsonLdData;
    }

    // Then try meta tags (OpenGraph/Twitter)
    const metaData = this.extractFromMetaTags();
    if (metaData && metaData.position) {
      // Merge with site-specific extraction
      const siteData = this.extractFromSite(hostname);
      // Smart merge: only overwrite if siteData returns non-empty values
      const merged = { ...metaData };
      if (siteData) {
        for (const [key, value] of Object.entries(siteData)) {
          if (value && value !== '' && value !== null) {
            merged[key] = value;
          }
        }
      }
      return merged;
    }

    // Finally, use site-specific DOM extraction
    return this.extractFromSite(hostname);
  }

  // Extract from JSON-LD (Schema.org/JobPosting) - best quality
  extractFromJsonLd() {
    const data = {
      position: '',
      company: '',
      location: '',
      description: '',
      jobUrl: window.location.href,
      minSalary: null,
      maxSalary: null,
      datePosted: null,
    };

    const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of jsonLdScripts) {
      try {
        const jsonData = JSON.parse(script.textContent);
        const job = Array.isArray(jsonData)
          ? jsonData.find(item => item['@type'] === 'JobPosting')
          : (jsonData['@type'] === 'JobPosting' ? jsonData : null);

        if (job) {
          data.position = job.title || '';
          data.company = job.hiringOrganization?.name || '';
          data.location = job.jobLocation?.address?.addressLocality ||
            job.jobLocation?.address?.addressRegion ||
            job.jobLocation?.address?.addressCountry || '';
          data.description = job.description || '';
          data.minSalary = job.baseSalary?.value?.minValue || null;
          data.maxSalary = job.baseSalary?.value?.maxValue || null;
          data.datePosted = job.datePosted || null;
          data.deadline = job.validThrough || null;

          // Clean HTML from description if present
          if (data.description && data.description.includes('<')) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = data.description;
            data.description = this.cleanHtmlToMarkdown(tempDiv);
          }

          return data;
        }
      } catch (e) {
        console.error('Error parsing JSON-LD', e);
      }
    }
    return null;
  }

  // Extract from meta tags (OpenGraph/Twitter)
  extractFromMetaTags() {
    const data = {
      position: '',
      company: '',
      location: '',
      description: '',
      jobUrl: window.location.href,
      minSalary: null,
      maxSalary: null,
      datePosted: null,
      deadline: null,
    };

    data.position = document.querySelector('meta[property="og:title"]')?.content ||
      document.querySelector('meta[name="twitter:title"]')?.content ||
      document.title || '';
    data.company = document.querySelector('meta[property="og:site_name"]')?.content || '';
    data.description = document.querySelector('meta[property="og:description"]')?.content ||
      document.querySelector('meta[name="description"]')?.content || '';

    return data;
  }

  // Extract from site-specific DOM
  extractFromSite(hostname) {
    let siteData = null;

    if (hostname.includes('linkedin.com')) {
      siteData = this.extractLinkedIn();
    } else if (hostname.includes('indeed.com')) {
      siteData = this.extractIndeed();
    } else if (hostname.includes('glassdoor.com')) {
      siteData = this.extractGlassdoor();
    } else if (hostname.includes('lever.co')) {
      siteData = this.extractLever();
    } else if (hostname.includes('greenhouse.io')) {
      siteData = this.extractGreenhouse();
    } else {
      siteData = this.extractGeneric();
    }

    return siteData;
  }

  // Extract from LinkedIn
  extractLinkedIn() {
    const data = {
      position: '',
      company: '',
      location: '',
      description: '',
      jobUrl: window.location.href,
      minSalary: null,
      maxSalary: null,
      datePosted: null,
      deadline: null,
    };

    // Job Title
    const titleSelectors = [
      'h1.job-details-jobs-unified-top-card__job-title',
      'h1[data-test-id="job-title"]',
      '.jobs-details-top-card__job-title',
      'h1.top-card-layout__title',
      '.top-card-layout__title',
      '.job-details-jobs-unified-top-card__job-title',
      'h1'
    ];
    for (const selector of titleSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        data.position = element.textContent.trim();
        break;
      }
    }

    // Company Name
    const companySelectors = [
      '.job-details-jobs-unified-top-card__company-name a',
      'a[data-test-id="job-poster"]',
      '.jobs-details-top-card__company-name',
      'a.topcard__org-name-link'
    ];
    for (const selector of companySelectors) {
      const element = document.querySelector(selector);
      if (element) {
        data.company = element.textContent.trim();
        break;
      }
    }

    // Location - improved parsing
    const locationSelectors = [
      '.job-details-jobs-unified-top-card__primary-description-without-tagline',
      '.job-details-jobs-unified-top-card__primary-description',
      '.jobs-details-top-card__bullet',
      '.topcard__flavor--bullet'
    ];
    for (const selector of locationSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const text = element.textContent.trim();
        // Format often: "Company · Location · Posted x days ago"
        const parts = text.split('·').map(s => s.trim());
        if (parts.length >= 2) {
          // Usually location is the second part
          data.location = parts[1];
        } else {
          data.location = text;
        }
        break;
      }
    }

    // Alternative: Try specific location element
    if (!data.location) {
      const locationEl = document.querySelector('.job-details-jobs-unified-top-card__primary-description span:first-child') ||
        document.querySelector('.topcard-layout__first-sub-title span:last-child');
      if (locationEl) {
        data.location = locationEl.textContent.trim();
      }
    }

    // Description - use cleanHtmlToMarkdown for better formatting
    const descSelectors = [
      '.jobs-description__content',
      '.show-more-less-html__markup',
      '.jobs-box__html-content',
      '#job-details'
    ];
    for (const selector of descSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        data.description = this.cleanHtmlToMarkdown(element);
        break;
      }
    }

    // Salary - check job insights first, then page text
    const insightEls = document.querySelectorAll('.job-details-jobs-unified-top-card__job-insight');
    for (const el of insightEls) {
      const text = el.textContent;
      if (text.includes('$') && (text.includes('/yr') || text.includes('year') || text.includes('hr'))) {
        const salaryMatch = text.match(/\$?(\d{1,3}(?:,\d{3})*(?:k|K)?)\s*-\s*\$?(\d{1,3}(?:,\d{3})*(?:k|K)?)/);
        if (salaryMatch) {
          const min = this.parseSalary(salaryMatch[1]);
          const max = this.parseSalary(salaryMatch[2]);
          if (min && max) {
            data.minSalary = min;
            data.maxSalary = max;
            break;
          }
        }
      }
    }

    // Fallback: search entire page text
    if (!data.minSalary && !data.maxSalary) {
      const salaryText = document.body.textContent;
      const salaryMatch = salaryText.match(/\$?(\d{1,3}(?:,\d{3})*(?:k|K)?)\s*-\s*\$?(\d{1,3}(?:,\d{3})*(?:k|K)?)/);
      if (salaryMatch) {
        const min = this.parseSalary(salaryMatch[1]);
        const max = this.parseSalary(salaryMatch[2]);
        if (min && max) {
          data.minSalary = min;
          data.maxSalary = max;
        }
      }
    }

    return data;
  }

  // Extract from Indeed
  extractIndeed() {
    const data = {
      position: '',
      company: '',
      location: '',
      description: '',
      jobUrl: window.location.href,
      minSalary: null,
      maxSalary: null,
      datePosted: null,
      deadline: null,
    };

    // Job Title
    const titleEl = document.querySelector('h2[data-testid="job-title"]') ||
      document.querySelector('.jobsearch-JobInfoHeader-title');
    if (titleEl) {
      data.position = titleEl.textContent.trim();
    }

    // Company
    const companyEl = document.querySelector('[data-testid="inlineHeader-companyName"]') ||
      document.querySelector('.jobsearch-InlineCompanyRating');
    if (companyEl) {
      data.company = companyEl.textContent.trim();
    }

    // Location
    const locationEl = document.querySelector('[data-testid="job-location"]') ||
      document.querySelector('.jobsearch-JobInfoHeader-subtitle');
    if (locationEl) {
      data.location = locationEl.textContent.trim();
    }

    // Description - use cleanHtmlToMarkdown
    const descEl = document.querySelector('#jobDescriptionText') ||
      document.querySelector('.jobsearch-jobDescriptionText');
    if (descEl) {
      data.description = this.cleanHtmlToMarkdown(descEl);
    }

    // Salary
    const salaryEl = document.querySelector('[data-testid="attribute_snippet_testid"]');
    if (salaryEl) {
      const salaryText = salaryEl.textContent;
      const match = salaryText.match(/\$?(\d{1,3}(?:,\d{3})*(?:k|K)?)\s*-\s*\$?(\d{1,3}(?:,\d{3})*(?:k|K)?)/);
      if (match) {
        data.minSalary = this.parseSalary(match[1]);
        data.maxSalary = this.parseSalary(match[2]);
      }
    }

    return data;
  }

  // Extract from Glassdoor
  extractGlassdoor() {
    const data = {
      position: '',
      company: '',
      location: '',
      description: '',
      jobUrl: window.location.href,
      minSalary: null,
      maxSalary: null,
      datePosted: null,
      deadline: null,
    };

    const titleEl = document.querySelector('.JobDetails_jobTitle__');
    if (titleEl) data.position = titleEl.textContent.trim();

    const companyEl = document.querySelector('.EmployerProfile_employerName__');
    if (companyEl) data.company = companyEl.textContent.trim();

    const locationEl = document.querySelector('.JobDetails_location__');
    if (locationEl) data.location = locationEl.textContent.trim();

    const descEl = document.querySelector('.JobDetails_jobDescription__');
    if (descEl) data.description = this.cleanHtmlToMarkdown(descEl);

    return data;
  }

  // Extract from Lever
  extractLever() {
    const data = {
      position: '',
      company: '',
      location: '',
      description: '',
      jobUrl: window.location.href,
      minSalary: null,
      maxSalary: null,
      datePosted: null,
      deadline: null,
    };

    const titleEl = document.querySelector('.posting-headline h2');
    if (titleEl) data.position = titleEl.textContent.trim();

    const companyEl = document.querySelector('.posting-category');
    if (companyEl) data.company = companyEl.textContent.trim();

    const descEl = document.querySelector('.section');
    if (descEl) data.description = this.cleanHtmlToMarkdown(descEl);

    return data;
  }

  // Extract from Greenhouse
  extractGreenhouse() {
    const data = {
      position: '',
      company: '',
      location: '',
      description: '',
      jobUrl: window.location.href,
      minSalary: null,
      maxSalary: null,
      datePosted: null,
      deadline: null,
    };

    const titleEl = document.querySelector('.app-title');
    if (titleEl) data.position = titleEl.textContent.trim();

    const locationEl = document.querySelector('.location');
    if (locationEl) data.location = locationEl.textContent.trim();

    const descEl = document.querySelector('#content');
    if (descEl) data.description = this.cleanHtmlToMarkdown(descEl);

    return data;
  }

  // Generic extraction for any job site
  extractGeneric() {
    const data = {
      position: '',
      company: '',
      location: '',
      description: '',
      jobUrl: window.location.href,
      minSalary: null,
      maxSalary: null,
      datePosted: null,
      deadline: null,
    };

    // Try to find job title - more comprehensive selectors
    const titleSelectors = [
      'h1[class*="title"]',
      'h1[class*="job"]',
      'h1[class*="position"]',
      'h1[class*="role"]',
      'h2[class*="title"]',
      'h2[class*="job"]',
      'h1',
      '[class*="job-title"]',
      '[class*="position-title"]',
      '[class*="role-title"]',
      '[id*="job-title"]',
      '[id*="position"]',
      'h2',
      '[data-testid*="title"]',
      '[data-testid*="job"]'
    ];

    for (const selector of titleSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const el of elements) {
        const text = el.textContent.trim();
        // Filter out navigation, menu items, etc.
        if (text &&
          text.length > 2 && // Relaxed from 5
          text.length < 200 && // Relaxed from 150
          !text.toLowerCase().includes('menu') &&
          !text.toLowerCase().includes('navigation') &&
          !text.toLowerCase().includes('skip')) {
          data.position = text;
          break;
        }
      }
      if (data.position) break;
    }

    // Try to find company name - improved selectors
    const companySelectors = [
      '[class*="company"]',
      '[class*="employer"]',
      '[class*="organization"]',
      '[class*="org"]',
      '[id*="company"]',
      '[id*="employer"]',
      '[data-testid*="company"]',
      'strong',
      'b',
      '[class*="brand"]',
      '[class*="logo"]'
    ];

    for (const selector of companySelectors) {
      const elements = document.querySelectorAll(selector);
      for (const el of elements) {
        const text = el.textContent.trim();
        // Filter out common false positives
        if (text &&
          text.length > 2 &&
          text.length < 100 &&
          !text.toLowerCase().includes('company') &&
          !text.toLowerCase().includes('about') &&
          !text.toLowerCase().includes('menu')) {
          // Check if it's likely a company name (not a label)
          const parentText = el.parentElement?.textContent || '';
          if (!parentText.toLowerCase().includes('company name') &&
            !parentText.toLowerCase().includes('employer:')) {
            data.company = text;
            break;
          }
        }
      }
      if (data.company) break;
    }

    // Try to find location
    const locationSelectors = [
      '[class*="location"]',
      '[class*="place"]',
      '[class*="city"]',
      '[id*="location"]',
      '[data-testid*="location"]',
      '[class*="address"]'
    ];

    for (const selector of locationSelectors) {
      const el = document.querySelector(selector);
      if (el) {
        const text = el.textContent.trim();
        if (text && text.length > 2 && text.length < 100) {
          data.location = text;
          break;
        }
      }
    }

    // Description - get main content with better selectors and markdown conversion
    const descSelectors = [
      '[class*="description"]',
      '[class*="details"]',
      '[class*="content"]',
      '[class*="about"]',
      '[id*="description"]',
      '[id*="details"]',
      'main',
      'article',
      '[role="main"]',
      '[class*="job-description"]',
      '[class*="job-details"]'
    ];

    for (const selector of descSelectors) {
      const el = document.querySelector(selector);
      if (el) {
        // Use cleanHtmlToMarkdown for better formatting
        const text = this.cleanHtmlToMarkdown(el);
        // Make sure it's substantial content
        if (text && text.length > 50) {
          // Remove common navigation/header text
          const cleanText = text
            .replace(/About the job/gi, '')
            .replace(/Job description/gi, '')
            .replace(/Description/gi, '')
            .trim();
          if (cleanText.length > 50) {
            data.description = cleanText.substring(0, 50000);
            break;
          }
        }
      }
    }

    // Try to extract salary from page text
    const pageText = document.body.textContent || '';
    const salaryPatterns = [
      /\$?(\d{1,3}(?:,\d{3})*(?:k|K)?)\s*-\s*\$?(\d{1,3}(?:,\d{3})*(?:k|K)?)/,
      /salary[:\s]+\$?(\d{1,3}(?:,\d{3})*(?:k|K)?)\s*-\s*\$?(\d{1,3}(?:,\d{3})*(?:k|K)?)/i,
      /(\d{1,3}(?:,\d{3})*(?:k|K)?)\s*-\s*(\d{1,3}(?:,\d{3})*(?:k|K)?)\s*(?:per\s+year|annually|yearly)/i
    ];

    for (const pattern of salaryPatterns) {
      const match = pageText.match(pattern);
      if (match) {
        const min = this.parseSalary(match[1]);
        const max = this.parseSalary(match[2]);
        if (min && max) {
          data.minSalary = min;
          data.maxSalary = max;
          break;
        }
      }
    }

    return data;
  }

  // Parse salary string to number
  parseSalary(salaryStr) {
    if (!salaryStr) return null;
    const cleaned = salaryStr.replace(/[,$]/g, '').toLowerCase();
    const num = parseFloat(cleaned);
    if (isNaN(num)) return null;
    if (cleaned.includes('k')) {
      return Math.round(num * 1000);
    }
    return Math.round(num);
  }

  // Extract LinkedIn Profile Data
  extractProfileData() {
    const data = {
      name: '',
      headline: '',
      company: '',
      position: '',
      location: '',
      about: '',
      profileUrl: window.location.href,
      photoUrl: ''
    };

    // Name - Improved selectors
    const nameSelectors = [
      '.pv-top-card--list li', // sometimes name is in list
      'div.ph5 h1', // heavy focus on the main card container
      'h1.text-heading-xlarge',
      'h1.top-card-layout__title',
      '.pv-text-details__left-panel h1'
    ];
    for (const selector of nameSelectors) {
      const el = document.querySelector(selector);
      if (el) {
        // Ensure it's not a tiny hidden element or side module
        const text = el.textContent.trim();
        // Simple sanity check: Profile names are usually 2-3 words, not huge sentences
        if (text && text.length < 50) {
          data.name = text;
          break;
        }
      }
    }

    // Headline
    const headlineEl = document.querySelector('div.text-body-medium') ||
      document.querySelector('div.top-card-layout__headline');
    if (headlineEl) {
      data.headline = headlineEl.textContent.trim();

      // Parse Position and Company from Headline
      if (data.headline.includes(' at ')) {
        const parts = data.headline.split(' at ');
        if (parts.length >= 2) {
          data.position = parts[0].trim();
          // company will be set later by specific selector, but fallback here
        }
      } else if (data.headline.includes('@')) {
        // "Role @ Company" format
        const parts = data.headline.split('@');
        if (parts.length >= 2) {
          data.position = parts[0].trim();
          data.company = parts.slice(1).join('@').trim();
        }
      } else if (data.headline.includes('|')) {
        // "Role | Company | Skills" format
        const parts = data.headline.split('|').map(s => s.trim());
        if (parts.length > 0) data.position = parts[0];
      } else {
        data.position = data.headline;
      }
    }

    // Company - Try specific top card selectors first (often "Current Company")
    const companySelectors = [
      'button[aria-label*="Current company:"]',
      'div[aria-label*="Current company"]',
      '.pv-text-details__right-panel button',
      '.pv-text-details__right-panel div',
      'ul.pv-text-details__right-panel li button',
      '.pv-text-details__right-panel__item-text' // New selector
    ];

    for (const selector of companySelectors) {
      const el = document.querySelector(selector);
      if (el) {
        let text = el.textContent.trim();
        // Clean up accessible text if needed
        if (el.getAttribute('aria-label') && el.getAttribute('aria-label').includes('Current company:')) {
          // Extracts "Current company: Google. Click to..."
          const label = el.getAttribute('aria-label');
          const match = label.match(/Current company:([^.]+)/);
          if (match) text = match[1].trim();
        }
        if (text) {
          // Remove duplicates sometimes found in text content like "Company Name\nCompany Name"
          const lines = text.split('\n').map(l => l.trim()).filter(l => l);
          if (lines.length > 0) {
            text = lines[0]; // Take first line
          }

          // Filter out generic "Company" label or bad extractions
          if (text.toLowerCase() === 'company' || text.toLowerCase().includes('click to learn more')) {
            continue;
          }

          data.company = text;
          break;
        }
      }
    }

    // Fallback: Check Experience Section for first item
    if (!data.company) {
      // Find experience section by ID or text
      const headers = Array.from(document.querySelectorAll('h2, span'));
      const expHeader = headers.find(h => h.textContent.trim().toLowerCase() === 'experience');
      if (expHeader) {
        const section = expHeader.closest('section');
        if (section) {
          // First list item in experience
          const firstCompany = section.querySelector('.pvs-list__item--line-separated');
          if (firstCompany) {
            // Look for company name text (usually 2nd span in nested structure)
            const spans = Array.from(firstCompany.querySelectorAll('span[aria-hidden="true"]'));
            // Logic: 1st span = Role, 2nd span = Company, OR 1st span = Company (if role listed below)
            // Heuristic: If we have multiple spans, check them.
            if (spans.length >= 2) {
              // Usually span[0] is role, span[1] is company details (e.g. "Google · Full-time")
              const companyText = spans[1].textContent.split('·')[0].trim();
              data.company = companyText;
            } else if (spans.length === 1) {
              data.company = spans[0].textContent.trim();
            }
          }
        }
      }
    }

    // If we still don't have company but parsed it from headline, use that as last resort
    if (!data.company && data.headline.includes('@')) {
      const parts = data.headline.split('@');
      if (parts.length >= 2) data.company = parts.slice(1).join('@').trim();
    }
    if (!data.company && data.headline.includes(' at ')) {
      const parts = data.headline.split(' at ');
      if (parts.length >= 2) data.company = parts.slice(1).join(' at ').trim();
    }


    // Location
    // Location - stricter selectors
    const locationSelectors = [
      '.pv-text-details__left-panel span.text-body-small.inline',
      'div.mt2 span.text-body-small', // common container for loc
      'span.text-body-small.inline.t-black--light.break-words',
      'div.top-card-layout__entity-info'
    ];

    for (const selector of locationSelectors) {
      const el = document.querySelector(selector);
      if (el) {
        const text = el.textContent.trim();
        const lowerText = text.toLowerCase();
        if (text &&
          !lowerText.includes('contact info') &&
          !lowerText.includes('connections') &&
          !lowerText.includes('connection') &&
          !lowerText.includes('degree')) {
          data.location = text;
          break;
        }
      }
    }

    // About - Improved traversal
    if (!data.about) {
      // Find "About" header (h2 usually)
      const allHeaders = Array.from(document.querySelectorAll('h2 span[aria-hidden="true"], h2'));
      const aboutHeader = allHeaders.find(h => h.textContent.trim() === 'About');

      if (aboutHeader) {
        // Go up to the section container
        const section = aboutHeader.closest('section');
        if (section) {
          // Look for the text body container. Usually .inline-show-more-text or a plain span/div
          const textContainer = section.querySelector('.inline-show-more-text') ||
            section.querySelector('.pv-about-section__summary-text') ||
            section.querySelector('div.display-flex.ph5');

          if (textContainer) {
            // Get the text, ignoring the "see more" buttons
            // Text often in a specific span with aria-hidden=true for visual
            const visibleSpan = textContainer.querySelector('span[aria-hidden="true"]');

            // Use cleanHtmlToMarkdown to preserve line breaks and formatting
            if (visibleSpan) {
              data.about = this.cleanHtmlToMarkdown(visibleSpan);
            } else {
              data.about = this.cleanHtmlToMarkdown(textContainer);
            }

            // Clean up "…see more"
            data.about = data.about.replace(/…\s*see more/i, '').trim();
          }
        }
      }
    }

    // Profile Photo
    const imgEl = document.querySelector('img.pv-top-card-profile-picture__image') ||
      document.querySelector('img.profile-photo-edit__preview');
    if (imgEl) data.photoUrl = imgEl.src;

    return data;
  }

  // Get current job data
  getJobData() {
    if (!this.jobData) {
      this.jobData = this.extractJobData();
    }
    return this.jobData;
  }
}

// Initialize extractor
const jobExtractor = new JobExtractor();

// Listen for messages from popup/background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractJobData') {
    const jobData = jobExtractor.getJobData();
    sendResponse({ success: true, data: jobData });
    return true;
  }

  if (request.action === 'captureScreenshot') {
    // Screenshot will be handled by background script
    sendResponse({ success: true });
    return true;
  }
});

// Auto-extract when page loads
window.addEventListener('load', () => {
  setTimeout(() => {
    const jobData = jobExtractor.getJobData();
    chrome.runtime.sendMessage({
      action: 'jobDataExtracted',
      data: jobData
    });
  }, 2000);
});

