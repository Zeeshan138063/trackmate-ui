# TrackMate Browser Extension

A browser extension to capture job details and screenshots from job posting pages and automatically add them to your TrackMate UI application.

## Features

- 🎯 **Auto-detect job details** from popular job sites (LinkedIn, Indeed, Glassdoor, Lever, Greenhouse)
- 📸 **Capture screenshots** of job posting pages
- 💾 **Save job data** with screenshots to TrackMate
- 🚀 **One-click import** to your TrackMate dashboard
- 🔧 **Generic extraction** for any job site

## Supported Job Sites

- LinkedIn Jobs
- Indeed
- Glassdoor
- Lever
- Greenhouse
- Generic job sites (with fallback extraction)

## Installation

### For Chrome/Edge (Chromium-based browsers)

1. Open Chrome/Edge and navigate to `chrome://extensions/` or `edge://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `extension` folder from this project
5. The extension should now appear in your extensions list

### For Firefox

1. Open Firefox and navigate to `about:debugging`
2. Click "This Firefox"
3. Click "Load Temporary Add-on"
4. Select the `manifest.json` file from the `extension` folder

## Usage

### Basic Usage

1. Navigate to any job posting page (LinkedIn, Indeed, etc.)
2. Click the TrackMate extension icon in your browser toolbar
3. The extension will automatically extract job details
4. Click "📋 Extract Job Data" to manually extract if needed
5. Click "📸 Capture Screenshot" to capture a screenshot of the page
6. Click "💾 Save to TrackMate" to send the job to your TrackMate UI

### Configuration

1. Open the extension popup
2. Enter your TrackMate URL in the settings (default: `http://localhost:5173/trackers`)
3. The URL is saved automatically

## Extension Structure

```
extension/
├── manifest.json          # Extension manifest (Manifest V3)
├── background.js          # Background service worker
├── content.js             # Content script for job extraction
├── popup.html             # Extension popup UI
├── popup.js               # Popup script logic
├── icons/                 # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md              # This file
```

## How It Works

1. **Content Script** (`content.js`):
   - Runs on job posting pages
   - Extracts job details using site-specific selectors
   - Sends extracted data to popup/background

2. **Background Script** (`background.js`):
   - Handles screenshot capture
   - Manages storage of job data
   - Opens TrackMate with job data

3. **Popup** (`popup.html` + `popup.js`):
   - User interface for the extension
   - Shows extracted job data
   - Allows manual extraction and screenshot capture
   - Sends data to TrackMate

## Job Data Extraction

The extension extracts the following fields:

- **Job Title** (position)
- **Company Name**
- **Location**
- **Job Description**
- **Salary** (min/max if available)
- **Job URL** (current page URL)
- **Screenshot** (optional)

## Integration with TrackMate UI

When you click "Save to TrackMate", the extension:

1. Opens your TrackMate UI in a new tab
2. Passes job data as URL parameters
3. TrackMate automatically opens the "Add Job" dialog with pre-filled data
4. You can review and save the job

### User Authentication & Job Association

**Important:** All jobs captured by the extension are automatically associated with your logged-in user account:

- ✅ You must be **logged into TrackMate** before using the extension
- ✅ Jobs are automatically linked to your user account via `user_id`
- ✅ Each user's jobs are completely isolated from others
- ✅ The extension verifies authentication before processing data

See [AUTHENTICATION.md](./AUTHENTICATION.md) for detailed information about how user association works.

## Development

### Adding Support for New Job Sites

To add support for a new job site, edit `content.js` and add a new extraction method:

```javascript
extractNewSite() {
  const data = {
    position: '',
    company: '',
    // ... other fields
  };
  
  // Add selectors for the new site
  const titleEl = document.querySelector('.job-title-selector');
  if (titleEl) data.position = titleEl.textContent.trim();
  
  // ... extract other fields
  
  return data;
}
```

Then add the site detection in `extractJobData()`:

```javascript
if (hostname.includes('newsite.com')) {
  return this.extractNewSite();
}
```

### Testing

1. Load the extension in developer mode
2. Navigate to a job posting page
3. Open the extension popup
4. Verify that job data is extracted correctly
5. Test screenshot capture
6. Test sending data to TrackMate

## Troubleshooting

### Job data not extracting

- Make sure you're on a job posting page (not a search results page)
- Try clicking "Extract Job Data" manually
- Check the browser console for errors
- Some sites may have changed their HTML structure

### Screenshot not capturing

- Ensure you have the necessary permissions
- Try refreshing the page and capturing again
- Check browser console for errors

### Data not sending to TrackMate

- Verify your TrackMate URL is correct in settings
- Make sure TrackMate is running and accessible
- Check that the URL format is correct (should include `/trackers`)

## Permissions

The extension requires the following permissions:

- **activeTab**: To access the current tab and extract job data
- **storage**: To save job data locally
- **tabs**: To open TrackMate in a new tab
- **scripting**: To inject content scripts

## License

Part of the TrackMate UI project.

## Support

For issues or questions, please check the main TrackMate UI repository.

