# Troubleshooting Guide

## Common Issues and Solutions

### 1. Screenshot Error: "The message port closed before a response was received"

**Fixed!** This has been resolved in the latest version. The issue was:
- Background script wasn't properly handling the tab ID
- Async response wasn't being handled correctly

**Solution**: Reload the extension:
1. Go to `chrome://extensions/`
2. Find "TrackMate Job Capture"
3. Click the reload icon
4. Try capturing a screenshot again

### 2. Job Data Not Extracting Properly

If only some fields are being extracted (e.g., only company name):

**Solution**: The generic extractor has been improved with:
- More comprehensive selectors
- Better filtering to avoid false positives
- Improved heuristics for finding job titles, descriptions, etc.

**If still not working:**
1. Check the browser console (F12) for any errors
2. Try manually clicking "Extract Job Data" again
3. The extension now tries many more selectors and patterns

**For custom job sites:**
- The extension uses generic extraction which tries common patterns
- If a site has very unique HTML structure, you may need to add specific selectors
- See "Adding Support for New Job Sites" in README.md

### 3. TrackMate URL Configuration

**Default changed to port 8080** (matching your setup)

To change:
1. Open extension popup
2. Update the TrackMate URL in settings
3. It's saved automatically

### 4. Extension Not Loading

**If you see icon errors:**
- Icons are now optional in the manifest
- Extension should load without icons
- You can add icons later using `create-icons.html`

### 5. Job Data Not Sending to TrackMate

**Check:**
1. TrackMate is running and accessible
2. You're logged into TrackMate
3. URL is correct (should include `/trackers` path)
4. Check browser console for errors

### 6. Only Company Name Extracted

**This was a known issue - now fixed!**

The generic extractor now:
- Tries many more selectors for job title
- Better filters to find the actual title (not navigation/menu items)
- Improved description extraction
- Better location detection

**If still having issues:**
- The page might have a very unique structure
- Try inspecting the page (F12) to see the HTML structure
- You can manually add selectors for that specific site

## Debugging Tips

### Enable Extension Logging

1. Open browser console (F12)
2. Go to the "Console" tab
3. Look for messages from the extension

### Check Content Script

1. Open the job posting page
2. Press F12 to open DevTools
3. Go to Console tab
4. You should see messages from the content script

### Check Background Script

1. Go to `chrome://extensions/`
2. Find "TrackMate Job Capture"
3. Click "service worker" or "background page"
4. Check the console for errors

### Test Extraction Manually

1. Open extension popup
2. Click "Extract Job Data"
3. Check what data is extracted
4. If missing fields, check the page HTML structure

## Getting Help

If you're still having issues:

1. **Check the console** for error messages
2. **Verify the page structure** - some sites have unique HTML
3. **Try on a different job site** (LinkedIn, Indeed) to test
4. **Reload the extension** after making changes

## Recent Fixes

✅ Screenshot capture error fixed
✅ Improved generic job extraction
✅ Better error handling
✅ Default URL updated to port 8080
✅ More comprehensive selectors for job fields

