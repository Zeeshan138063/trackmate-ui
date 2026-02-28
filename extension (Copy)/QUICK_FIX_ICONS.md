# Quick Fix: Generate Extension Icons

## Option 1: Use the HTML Generator (Easiest)

1. Open `create-icons.html` in your browser (double-click the file)
2. The icons will automatically generate and download
3. Move the downloaded files to the `icons/` folder:
   - `icon16.png` → `extension/icons/icon16.png`
   - `icon48.png` → `extension/icons/icon48.png`
   - `icon128.png` → `extension/icons/icon128.png`

## Option 2: Use Any Simple Icons

You can use any 16x16, 48x48, and 128x128 pixel PNG images:

1. Create or download simple PNG images with those sizes
2. Name them: `icon16.png`, `icon48.png`, `icon128.png`
3. Place them in the `extension/icons/` folder

## Option 3: Temporary Fix (Icons Removed)

I've temporarily removed the icon requirements from `manifest.json` so the extension will load without icons. You can add icons later using Option 1 or 2.

## After Adding Icons

Once you have the icon files in place, uncomment the icon sections in `manifest.json`:

```json
"action": {
  "default_popup": "popup.html",
  "default_icon": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
},
"icons": {
  "16": "icons/icon16.png",
  "48": "icons/icon48.png",
  "128": "icons/icon128.png"
},
```

## Quick Test

1. The extension should now load without the icon error
2. You can test it on a job posting page
3. Add icons later when convenient

