(() => {
  const STORAGE_PREFIX = "gleamshot-extension-capture:";
  const OVERLAY_ID = "gleamshot-capture-overlay";
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
    teardownOverlay();

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
    fullButton.style.cssText = [
      "border: 0",
      "background: #3b82f6",
      "color: white",
      "padding: 8px 10px",
      "border-radius: 10px",
      "font: 12px/1 system-ui, sans-serif",
      "font-weight: 600",
      "cursor: pointer",
    ].join(";");
    fullButton.addEventListener("click", (event) => {
      event.stopPropagation();
      submitCapture(null);
    });

    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.textContent = "Esc";
    cancelButton.style.cssText = [
      "border: 1px solid rgba(255,255,255,0.18)",
      "background: transparent",
      "color: rgba(255,255,255,0.8)",
      "padding: 8px 10px",
      "border-radius: 10px",
      "font: 12px/1 system-ui, sans-serif",
      "cursor: pointer",
    ].join(";");
    cancelButton.addEventListener("click", (event) => {
      event.stopPropagation();
      teardownOverlay();
    });

    hint.appendChild(fullButton);
    hint.appendChild(cancelButton);
    overlay.appendChild(shadeTop);
    overlay.appendChild(shadeRight);
    overlay.appendChild(shadeBottom);
    overlay.appendChild(shadeLeft);
    overlay.appendChild(box);
    overlay.appendChild(hint);
    document.documentElement.appendChild(overlay);

    overlayState = {
      overlay,
      box,
      shades: [shadeTop, shadeRight, shadeBottom, shadeLeft],
      dragging: false,
      startX: 0,
      startY: 0,
      keyHandler: (event) => {
        if (event.key === "Escape") {
          teardownOverlay();
        }
      },
    };

    setShadeRect({ x: 0, y: 0, width: 0, height: 0 });

    document.addEventListener("keydown", overlayState.keyHandler, true);

    overlay.addEventListener("pointerdown", (event) => {
      if (event.target !== overlay) return;
      overlayState.dragging = true;
      overlayState.startX = event.clientX;
      overlayState.startY = event.clientY;
      updateBox(event.clientX, event.clientY);
      box.style.display = "block";
      event.preventDefault();
    });

    overlay.addEventListener("pointermove", (event) => {
      if (!overlayState?.dragging) return;
      updateBox(event.clientX, event.clientY);
    });

    overlay.addEventListener("pointerup", (event) => {
      if (!overlayState?.dragging) return;
      overlayState.dragging = false;
      const rect = getRect(event.clientX, event.clientY);
      if (rect.width < 8 || rect.height < 8) {
        teardownOverlay();
        return;
      }
      submitCapture(rect);
    });

    function updateBox(currentX, currentY) {
      const rect = getRect(currentX, currentY);
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

  async function submitCapture(rect) {
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    teardownOverlay();
    await waitForCleanFrame();

    chrome.runtime.sendMessage({
      type: "GLEAMSHOT_CAPTURE_SELECTION",
      rect,
      viewport,
    });
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

  function teardownOverlay() {
    if (!overlayState) return;
    document.removeEventListener("keydown", overlayState.keyHandler, true);
    overlayState.overlay.remove();
    overlayState = null;
  }
})();
