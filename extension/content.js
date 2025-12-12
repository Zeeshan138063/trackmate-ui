// Content script to extract job details from various job sites

class JobExtractor {
  constructor() {
    this.jobData = null;
    this.listeners = [];
  }

  // Extract job data based on current site
  extractJobData() {
    const url = window.location.href;
    const hostname = window.location.hostname;

    if (hostname.includes('linkedin.com')) {
      return this.extractLinkedIn();
    } else if (hostname.includes('indeed.com')) {
      return this.extractIndeed();
    } else if (hostname.includes('glassdoor.com')) {
      return this.extractGlassdoor();
    } else if (hostname.includes('lever.co')) {
      return this.extractLever();
    } else if (hostname.includes('greenhouse.io')) {
      return this.extractGreenhouse();
    } else {
      return this.extractGeneric();
    }
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
    };

    // Job Title
    const titleSelectors = [
      'h1.job-details-jobs-unified-top-card__job-title',
      'h1[data-test-id="job-title"]',
      '.jobs-details-top-card__job-title',
      'h1.top-card-layout__title'
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

    // Location
    const locationSelectors = [
      '.job-details-jobs-unified-top-card__primary-description-without-tagline',
      '.jobs-details-top-card__bullet',
      '.topcard__flavor--bullet'
    ];
    for (const selector of locationSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const text = element.textContent.trim();
        // Extract location (usually after company name)
        const parts = text.split('·');
        if (parts.length > 1) {
          data.location = parts[parts.length - 1].trim();
        } else {
          data.location = text;
        }
        break;
      }
    }

    // Description
    const descSelectors = [
      '.jobs-description__content',
      '.jobs-box__html-content',
      '#job-details'
    ];
    for (const selector of descSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        data.description = element.textContent.trim();
        break;
      }
    }

    // Salary (if available)
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

    // Description
    const descEl = document.querySelector('#jobDescriptionText') ||
                   document.querySelector('.jobsearch-jobDescriptionText');
    if (descEl) {
      data.description = descEl.textContent.trim();
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
    };

    const titleEl = document.querySelector('.JobDetails_jobTitle__');
    if (titleEl) data.position = titleEl.textContent.trim();

    const companyEl = document.querySelector('.EmployerProfile_employerName__');
    if (companyEl) data.company = companyEl.textContent.trim();

    const locationEl = document.querySelector('.JobDetails_location__');
    if (locationEl) data.location = locationEl.textContent.trim();

    const descEl = document.querySelector('.JobDetails_jobDescription__');
    if (descEl) data.description = descEl.textContent.trim();

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
    };

    const titleEl = document.querySelector('.posting-headline h2');
    if (titleEl) data.position = titleEl.textContent.trim();

    const companyEl = document.querySelector('.posting-category');
    if (companyEl) data.company = companyEl.textContent.trim();

    const descEl = document.querySelector('.section');
    if (descEl) data.description = descEl.textContent.trim();

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
    };

    const titleEl = document.querySelector('.app-title');
    if (titleEl) data.position = titleEl.textContent.trim();

    const locationEl = document.querySelector('.location');
    if (locationEl) data.location = locationEl.textContent.trim();

    const descEl = document.querySelector('#content');
    if (descEl) data.description = descEl.textContent.trim();

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
            text.length > 5 && 
            text.length < 150 &&
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

    // Description - get main content with better selectors
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
        const text = el.textContent.trim();
        // Make sure it's substantial content
        if (text && text.length > 50) {
          // Remove common navigation/header text
          const cleanText = text
            .replace(/About the job/gi, '')
            .replace(/Job description/gi, '')
            .replace(/Description/gi, '')
            .trim();
          if (cleanText.length > 50) {
            data.description = cleanText.substring(0, 5000);
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

