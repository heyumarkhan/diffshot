# Chrome extension MVP

Load `extension/chrome` as an unpacked extension in Chrome.

Current MVP flow:

1. Click the extension action on any page.
2. Drag to select an area, or click **Capture visible tab**.
3. After an area selection, the extension captures the crop and shows an icon-only action toolbar near the selection.
4. Clicking **Capture visible tab** now selects the full visible area first, then shows the same action toolbar.
5. From the toolbar, you can download, copy, open in the GleamShot editor, or cancel the capture.

Notes:

- This is intentionally capture-only. Editing stays in the web app.
- The image handoff is a pragmatic MVP: the extension stores the PNG temporarily, then copies it into the editor tab via content script + `localStorage` on the GleamShot origin.
- The selection border is UI-only and is hidden before capture so downloaded, copied, and editor-bound images stay clean.
