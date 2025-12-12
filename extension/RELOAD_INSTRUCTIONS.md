# Important: Reload Extension After Changes

## The 431 Error Fix Requires Extension Reload

After the code changes to fix the 431 error, you **must reload the extension** for the changes to take effect.

### Steps to Reload Extension

1. **Open Chrome/Edge Extensions Page**
   - Go to `chrome://extensions/` or `edge://extensions/`
   - Or click the three dots menu → Extensions → Manage extensions

2. **Find TrackMate Extension**
   - Look for "TrackMate Job Capture" in your extensions list

3. **Reload the Extension**
   - Click the **reload icon** (circular arrow) next to the extension
   - Or toggle it off and back on

4. **Verify It's Loaded**
   - Check that there are no errors shown
   - The extension should show as "Enabled"

### Why This Is Important

The 431 error fix changes how data is sent:
- **Old way**: All data in URL (causes 431 error)
- **New way**: Large data in storage, only small fields in URL

The browser caches the old extension code, so you need to reload to get the new code.

### Testing After Reload

1. Go to a job posting page
2. Click extension icon
3. Extract job data
4. Click "Save to TrackMate"
5. Should work without 431 errors

### If Still Getting 431 Errors

1. **Clear browser cache** for localhost:8080
2. **Hard reload** the TrackMate page (Ctrl+Shift+R or Cmd+Shift+R)
3. **Check extension console** for errors:
   - Go to `chrome://extensions/`
   - Click "service worker" or "background page" link
   - Check console for errors

4. **Verify extension version** - Make sure you're using the updated files

### Quick Checklist

- [ ] Extension reloaded in `chrome://extensions/`
- [ ] TrackMate page hard reloaded (Ctrl+Shift+R)
- [ ] Browser cache cleared (optional but recommended)
- [ ] Tested with a job posting

After reloading, the 431 errors should stop!

