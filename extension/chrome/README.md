# Chrome extension MVP

Load `extension/chrome` as an unpacked extension in Chrome.

Current MVP flow:

1. Click the extension action on any page.
2. Drag to select an area, or click **Capture visible tab**.
3. The extension captures the current tab, crops the selection, and opens `https://gleamshot.io/create?source=extension&captureKey=...`.
4. The editor hydrates the captured image from local storage and loads it as the primary screenshot.

Notes:

- This is intentionally capture-only. Editing stays in the web app.
- The image handoff is a pragmatic MVP: the extension stores the PNG temporarily, then copies it into the editor tab via content script + `localStorage` on the GleamShot origin.
