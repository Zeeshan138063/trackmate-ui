# Installation Guide

## Quick Start

### Step 1: Create Icons (Optional but Recommended)

1. Open `create-icons.html` in your browser
2. Icons will be automatically generated and downloaded
3. Move the downloaded icon files to the `icons/` folder:
   - `icon16.png` → `icons/icon16.png`
   - `icon48.png` → `icons/icon48.png`
   - `icon128.png` → `icons/icon128.png`

**Note:** If you don't create icons, the extension will still work but may show a default icon or error. You can use any 16x16, 48x48, and 128x128 pixel PNG images as placeholders.

### Step 2: Load Extension in Chrome/Edge

1. Open Chrome or Edge browser
2. Navigate to:
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
3. Enable **Developer mode** (toggle in top-right corner)
4. Click **"Load unpacked"** button
5. Select the `extension` folder from this project
6. The extension should now appear in your extensions list

### Step 3: Pin Extension (Optional)

1. Click the puzzle piece icon (extensions) in your browser toolbar
2. Find "TrackMate Job Capture"
3. Click the pin icon to keep it visible in your toolbar

### Step 4: Configure TrackMate URL

1. Make sure your TrackMate UI is running (default: `http://localhost:5173`)
2. Click the TrackMate extension icon
3. Verify the TrackMate URL in the settings field
4. Update if your TrackMate is running on a different URL/port

## Usage

1. Navigate to any job posting page (LinkedIn, Indeed, etc.)
2. Click the TrackMate extension icon
3. The extension will automatically extract job details
4. Review the extracted data
5. Click "📸 Capture Screenshot" if you want a screenshot
6. Click "💾 Save to TrackMate" to add the job to your dashboard

## Troubleshooting

### Extension not loading

- Make sure you selected the `extension` folder (not the parent folder)
- Check that `manifest.json` exists in the extension folder
- Verify Developer mode is enabled

### Icons not showing

- Make sure icon files exist in the `icons/` folder
- Icon files must be named exactly: `icon16.png`, `icon48.png`, `icon128.png`
- Use the `create-icons.html` tool to generate icons

### Job data not extracting

- Make sure you're on a job posting page (not search results)
- Try manually clicking "Extract Job Data"
- Some sites may have changed their HTML structure

### Can't send to TrackMate

- Verify TrackMate is running
- Check the URL in extension settings
- Make sure the URL includes `/trackers` path

## Testing

1. Go to a LinkedIn job posting: https://www.linkedin.com/jobs/view/[job-id]
2. Click the extension icon
3. Verify job details are extracted
4. Test screenshot capture
5. Test sending to TrackMate

## Uninstalling

1. Go to `chrome://extensions/` or `edge://extensions/`
2. Find "TrackMate Job Capture"
3. Click "Remove"

