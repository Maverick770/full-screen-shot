# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CaptureEcran is a Chrome extension that captures full-page screenshots of web pages. It's written in French and uses Chrome Extension Manifest V3.

### Architecture

**Core Components:**
- `manifest.json`: Extension configuration with permissions (activeTab, storage, downloads, debugger)
- `background.js`: Service worker handling capture logic via Chrome DevTools Protocol
- `popup.js`: User interface logic for the extension popup
- `popup.html`/`popup.css`: Extension popup interface

**Key Features:**
- Full-page screenshot capture using Chrome DevTools Protocol (`Page.captureScreenshot` with `captureBeyondViewport: true`)
- Multiple export formats: PNG, JPEG, PDF
- Quality settings for JPEG format
- Automatic filename generation with page title and timestamp
- French localization support

### Technical Implementation

**Capture Method:**
The extension uses Chrome's DevTools Protocol for native full-page capture, identical to Chrome DevTools "Capture full size screenshot" feature. This approach:
- Attaches debugger to target tab
- Uses `Page.getLayoutMetrics` to get full page dimensions  
- Captures with `Page.captureScreenshot` and `captureBeyondViewport: true`
- Falls back to `chrome.tabs.captureVisibleTab` if DevTools method fails

**Message Flow:**
1. Popup sends `captureFullPage` message to background script
2. Background script handles capture via DevTools Protocol
3. Progress updates broadcast via `captureProgress` messages
4. File download handled via Chrome Downloads API

## Development Commands

Since this is a Chrome extension, there are no build commands. Development workflow:

**Testing/Reload:**
1. Open `chrome://extensions/`
2. Click reload button for "CaptureEcran" extension
3. Test on various websites as described in `TEST_GUIDE.md`

**Debugging:**
- Extension errors: `chrome://extensions/` → "Inspect views" → "service worker"  
- Content script errors: F12 → Console tab
- Check logs for DevTools Protocol operations

## File Structure

- `background.js`: Main capture logic, DevTools Protocol integration
- `popup.js`: UI logic, settings management, communication with background
- `manifest.json`: Extension permissions and configuration
- `_locales/fr/messages.json`: French translations
- `icons/`: Extension icons (16, 32, 48, 128px)
- Test guides: `TEST_GUIDE.md`, `DEVTOOLS_VERSION.md`

## Key APIs Used

- `chrome.debugger`: For DevTools Protocol access
- `chrome.tabs`: Tab management and basic capture fallback
- `chrome.downloads`: File download handling
- `chrome.storage.local`: Settings persistence
- `chrome.runtime.onMessage`: Inter-component communication
- `chrome.notifications`: User notifications

## Important Notes

The extension specifically targets French users and uses DevTools Protocol for professional-quality full-page captures, avoiding common issues with scroll-based capture methods.