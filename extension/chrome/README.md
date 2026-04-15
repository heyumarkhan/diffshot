# GleamShot Capture for Chrome

Chrome extension package for capturing screenshots and sending them to the GleamShot editor.

## Current Flow

1. Click the extension action on any page.
2. Drag to select an area, or click **Capture visible tab**.
3. Add optional text, arrows, shapes, or lines with the annotation toolbar.
4. Download the PNG, copy it to the clipboard, open it in the GleamShot editor, or cancel the capture.

Editing in the web app remains available through **Edit**. The extension stores the captured PNG temporarily in Chrome extension storage, opens `https://gleamshot.io/create`, and delivers the image to that page through the content script.

## Chrome Web Store Package

Zip this directory for upload:

```text
extension/chrome
```

The upload package must include:

- `manifest.json`
- `background.js`
- `content-script.js`
- `assets/favicon.ico`

## Publish Readiness Notes

- The extension intentionally matches its content script on all pages so the capture overlay can start from the toolbar action on arbitrary websites.
- No explicit `host_permissions` are declared; broad page coverage is limited to `content_scripts.matches`.
- The production editor handoff targets `https://gleamshot.io/create`.
- No localhost or development host permissions should be present in the submitted manifest.
- Production 48x48 and 128x128 extension icons should be added before submission. The current package only has the existing 16x16 and 32x32 favicon asset.
- Chrome Web Store listing screenshots, promotional images, a privacy policy URL, and final listing copy are managed outside this package and must be completed before submission.
