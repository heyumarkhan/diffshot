(() => {
  const STORAGE_PREFIX = "gleamshot-extension-capture:";
  const OVERLAY_ID = "gleamshot-capture-overlay";
  const TOOLBAR_GAP = 12;
  const TOOLBAR_HEIGHT = 48;
  const TOOLBAR_WIDTH = 196;
  let overlayState = null;

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "GLEAMSHOT_START_CAPTURE") {
      startCapture();
      sendResponse({ ok: true });
      return false;
    }

    if (message?.type === "GLEAMSHOT_DELIVER_CAPTURE") {
      hydrateEditorCapture(message.captureKey)
        .then(() => sendResponse({ ok: true }))
        .catch((error) => sendResponse({ ok: false, error: error?.message || "Delivery failed" }));
      return true;
    }

    return false;
  });

  async function hydrateEditorCapture(captureKey) {
    if (!captureKey) return;
    const storageKey = STORAGE_PREFIX + captureKey;
    const stored = await chrome.storage.local.get(storageKey);
    const payload = stored?.[storageKey];
    if (!payload) return;

    window.localStorage.setItem(storageKey, JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent("gleamshot-extension-capture-ready", {
      detail: { captureKey },
    }));
  }

  function startCapture() {
    teardownOverlay({ preserveCapture: false });

    const overlay = document.createElement("div");
    overlay.id = OVERLAY_ID;
    overlay.style.cssText = [
      "position: fixed",
      "inset: 0",
      "z-index: 2147483647",
      "cursor: crosshair",
      "user-select: none",
    ].join(";");

    const shadeTop = createShade();
    const shadeRight = createShade();
    const shadeBottom = createShade();
    const shadeLeft = createShade();

    const box = document.createElement("div");
    box.style.cssText = [
      "position: fixed",
      "border: 2px solid #3b82f6",
      "display: none",
      "pointer-events: none",
      "box-sizing: border-box",
      "background: transparent",
      "border-radius: 12px",
      "will-change: left, top, width, height",
    ].join(";");

    const hint = document.createElement("div");
    hint.style.cssText = [
      "position: fixed",
      "top: 20px",
      "left: 50%",
      "transform: translateX(-50%)",
      "background: rgba(15, 23, 42, 0.92)",
      "color: white",
      "padding: 12px 14px",
      "border-radius: 12px",
      "font: 13px/1.4 system-ui, sans-serif",
      "display: flex",
      "align-items: center",
      "gap: 10px",
      "box-shadow: 0 10px 30px rgba(0,0,0,0.25)",
    ].join(";");
    hint.innerHTML = '<span><strong>GleamShot capture</strong> · drag to select an area</span>';

    const fullButton = document.createElement("button");
    fullButton.type = "button";
    fullButton.textContent = "Capture visible tab";
    fullButton.style.cssText = buttonBaseStyles("#3b82f6", "white", "0");
    fullButton.addEventListener("click", async (event) => {
      event.stopPropagation();
      await captureVisibleTabAndOpenEditor();
    });

    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.textContent = "Esc";
    cancelButton.style.cssText = buttonBaseStyles("transparent", "rgba(255,255,255,0.8)", "1px solid rgba(255,255,255,0.18)");
    cancelButton.addEventListener("click", (event) => {
      event.stopPropagation();
      teardownOverlay({ preserveCapture: false });
    });

    const toolbar = createToolbar();

    hint.appendChild(fullButton);
    hint.appendChild(cancelButton);
    overlay.appendChild(shadeTop);
    overlay.appendChild(shadeRight);
    overlay.appendChild(shadeBottom);
    overlay.appendChild(shadeLeft);
    overlay.appendChild(box);
    overlay.appendChild(hint);
    overlay.appendChild(toolbar);
    document.documentElement.appendChild(overlay);

    overlayState = {
      overlay,
      box,
      toolbar,
      hint,
      shades: [shadeTop, shadeRight, shadeBottom, shadeLeft],
      dragging: false,
      startX: 0,
      startY: 0,
      rect: null,
      captureKey: null,
      busy: false,
      keyHandler: (event) => {
        if (event.key === "Escape") {
          teardownOverlay({ preserveCapture: false });
        }
      },
    };

    setShadeRect({ x: 0, y: 0, width: 0, height: 0 });

    document.addEventListener("keydown", overlayState.keyHandler, true);

    overlay.addEventListener("pointerdown", (event) => {
      if (overlayState?.busy || overlayState?.captureKey) return;
      if (event.target !== overlay) return;
      overlayState.dragging = true;
      overlayState.startX = event.clientX;
      overlayState.startY = event.clientY;
      updateBox(event.clientX, event.clientY);
      box.style.display = "block";
      hint.style.display = "none";
      toolbar.style.display = "none";
      event.preventDefault();
    });

    overlay.addEventListener("pointermove", (event) => {
      if (!overlayState?.dragging) return;
      updateBox(event.clientX, event.clientY);
    });

    overlay.addEventListener("pointerup", async (event) => {
      if (!overlayState?.dragging) return;
      overlayState.dragging = false;
      const rect = getRect(event.clientX, event.clientY);
      if (rect.width < 8 || rect.height < 8) {
        teardownOverlay({ preserveCapture: false });
        return;
      }
      await captureSelectionForToolbar(rect);
    });

    function updateBox(currentX, currentY) {
      const rect = getRect(currentX, currentY);
      overlayState.rect = rect;
      box.style.left = `${rect.x}px`;
      box.style.top = `${rect.y}px`;
      box.style.width = `${rect.width}px`;
      box.style.height = `${rect.height}px`;
      setShadeRect(rect);
    }

    function setShadeRect(rect) {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const right = rect.x + rect.width;
      const bottom = rect.y + rect.height;

      shadeTop.style.left = "0px";
      shadeTop.style.top = "0px";
      shadeTop.style.width = `${viewportWidth}px`;
      shadeTop.style.height = `${rect.y}px`;

      shadeRight.style.left = `${right}px`;
      shadeRight.style.top = `${rect.y}px`;
      shadeRight.style.width = `${Math.max(0, viewportWidth - right)}px`;
      shadeRight.style.height = `${rect.height}px`;

      shadeBottom.style.left = "0px";
      shadeBottom.style.top = `${bottom}px`;
      shadeBottom.style.width = `${viewportWidth}px`;
      shadeBottom.style.height = `${Math.max(0, viewportHeight - bottom)}px`;

      shadeLeft.style.left = "0px";
      shadeLeft.style.top = `${rect.y}px`;
      shadeLeft.style.width = `${rect.x}px`;
      shadeLeft.style.height = `${rect.height}px`;
    }

    function getRect(currentX, currentY) {
      const x = Math.min(overlayState.startX, currentX);
      const y = Math.min(overlayState.startY, currentY);
      const width = Math.abs(currentX - overlayState.startX);
      const height = Math.abs(currentY - overlayState.startY);
      return { x, y, width, height };
    }
  }

  function createShade() {
    const shade = document.createElement("div");
    shade.style.cssText = [
      "position: fixed",
      "background: rgba(15, 23, 42, 0.3)",
      "pointer-events: none",
      "will-change: left, top, width, height",
    ].join(";");
    return shade;
  }

  function createToolbar() {
    const toolbar = document.createElement("div");
    toolbar.style.cssText = [
      "position: fixed",
      "display: none",
      "align-items: center",
      "gap: 8px",
      "padding: 8px",
      "background: rgba(15, 23, 42, 0.94)",
      "border: 1px solid rgba(255,255,255,0.12)",
      "border-radius: 14px",
      "box-shadow: 0 14px 36px rgba(0,0,0,0.28)",
      "backdrop-filter: blur(10px)",
      "cursor: default",
    ].join(";");

    toolbar.appendChild(createIconButton("Download", "↓", async () => {
      if (!overlayState?.captureKey || overlayState.busy) return;
      overlayState.busy = true;
      try {
        await chrome.runtime.sendMessage({
          type: "GLEAMSHOT_DOWNLOAD_CAPTURE",
          captureKey: overlayState.captureKey,
        });
        teardownOverlay({ preserveCapture: true });
      } finally {
        if (overlayState) overlayState.busy = false;
      }
    }));

    toolbar.appendChild(createIconButton("Copy", "⧉", async () => {
      if (!overlayState?.captureKey || overlayState.busy) return;
      overlayState.busy = true;
      try {
        await copyCaptureToClipboard(overlayState.captureKey);
        teardownOverlay({ preserveCapture: true });
      } finally {
        if (overlayState) overlayState.busy = false;
      }
    }));

    toolbar.appendChild(createIconButton("Edit", "✎", async () => {
      if (!overlayState?.captureKey || overlayState.busy) return;
      overlayState.busy = true;
      try {
        await chrome.runtime.sendMessage({
          type: "GLEAMSHOT_OPEN_EDITOR",
          captureKey: overlayState.captureKey,
        });
        teardownOverlay({ preserveCapture: true });
      } finally {
        if (overlayState) overlayState.busy = false;
      }
    }));

    toolbar.appendChild(createIconButton("Cancel", "✕", async () => {
      teardownOverlay({ preserveCapture: false });
    }));

    return toolbar;
  }

  function createIconButton(label, icon, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = icon;
    button.title = label;
    button.setAttribute("aria-label", label);
    button.style.cssText = [
      "width: 40px",
      "height: 32px",
      "border: 0",
      "border-radius: 10px",
      "background: rgba(255,255,255,0.08)",
      "color: white",
      "font: 18px/1 system-ui, sans-serif",
      "display: inline-flex",
      "align-items: center",
      "justify-content: center",
      "cursor: pointer",
      "transition: background 120ms ease",
    ].join(";");
    button.addEventListener("mouseenter", () => {
      button.style.background = "rgba(255,255,255,0.16)";
    });
    button.addEventListener("mouseleave", () => {
      button.style.background = "rgba(255,255,255,0.08)";
    });
    button.addEventListener("click", async (event) => {
      event.stopPropagation();
      await onClick();
    });
    return button;
  }

  function buttonBaseStyles(background, color, border) {
    return [
      `border: ${border}`,
      `background: ${background}`,
      `color: ${color}`,
      "padding: 8px 10px",
      "border-radius: 10px",
      "font: 12px/1 system-ui, sans-serif",
      "font-weight: 600",
      "cursor: pointer",
    ].join(";");
  }

  async function captureSelectionForToolbar(rect) {
    if (!overlayState) return;
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    overlayState.busy = true;
    overlayState.rect = rect;
    await waitForCleanFrame();

    try {
      const response = await chrome.runtime.sendMessage({
        type: "GLEAMSHOT_CAPTURE_SELECTION",
        rect,
        viewport,
      });

      if (!response?.ok || !response.captureKey) {
        throw new Error(response?.error || "Capture failed");
      }

      overlayState.captureKey = response.captureKey;
      showToolbar(rect);
    } catch (error) {
      console.error("Capture failed", error);
      teardownOverlay({ preserveCapture: false });
    } finally {
      if (overlayState) overlayState.busy = false;
    }
  }

  async function captureVisibleTabAndOpenEditor() {
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    teardownOverlay({ preserveCapture: false });
    await waitForCleanFrame();

    const response = await chrome.runtime.sendMessage({
      type: "GLEAMSHOT_CAPTURE_SELECTION",
      rect: null,
      viewport,
    });

    if (!response?.ok || !response.captureKey) {
      throw new Error(response?.error || "Capture failed");
    }

    await chrome.runtime.sendMessage({
      type: "GLEAMSHOT_OPEN_EDITOR",
      captureKey: response.captureKey,
    });
  }

  function showToolbar(rect) {
    if (!overlayState) return;
    const { toolbar } = overlayState;
    toolbar.style.display = "flex";

    const fitsBelow = rect.y + rect.height + TOOLBAR_GAP + TOOLBAR_HEIGHT <= window.innerHeight;
    const top = fitsBelow
      ? rect.y + rect.height + TOOLBAR_GAP
      : Math.max(8, rect.y + rect.height - TOOLBAR_HEIGHT - 8);
    const left = Math.min(
      Math.max(8, rect.x + rect.width - TOOLBAR_WIDTH),
      window.innerWidth - TOOLBAR_WIDTH - 8,
    );

    toolbar.style.top = `${top}px`;
    toolbar.style.left = `${left}px`;
  }

  async function copyCaptureToClipboard(captureKey) {
    const storageKey = STORAGE_PREFIX + captureKey;
    const stored = await chrome.storage.local.get(storageKey);
    const payload = stored?.[storageKey];
    if (!payload?.dataUrl) {
      throw new Error("Capture not found");
    }

    const response = await fetch(payload.dataUrl);
    const blob = await response.blob();
    await navigator.clipboard.write([
      new ClipboardItem({ [blob.type || "image/png"]: blob }),
    ]);
  }

  function waitForCleanFrame() {
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.setTimeout(resolve, 50);
        });
      });
    });
  }

  async function teardownOverlay({ preserveCapture }) {
    if (!overlayState) return;
    const { captureKey, overlay, keyHandler } = overlayState;
    document.removeEventListener("keydown", keyHandler, true);
    overlay.remove();
    overlayState = null;

    if (!preserveCapture && captureKey) {
      try {
        await chrome.runtime.sendMessage({
          type: "GLEAMSHOT_DISCARD_CAPTURE",
          captureKey,
        });
      } catch (error) {
        console.warn("Could not discard capture", error);
      }
    }
  }
})();
