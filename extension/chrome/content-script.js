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
      "background: rgba(15, 23, 42, 0.22)",
      "backdrop-filter: blur(1px)",
      "user-select: none",
    ].join(";");

    const box = document.createElement("div");
    box.style.cssText = [
      "position: fixed",
      "border: 2px solid #3b82f6",
      "background: rgba(59, 130, 246, 0.15)",
      "display: none",
      "pointer-events: none",
      "box-shadow: 0 0 0 99999px rgba(15, 23, 42, 0.35)",
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
    overlay.appendChild(box);
    overlay.appendChild(hint);
    document.documentElement.appendChild(overlay);

    overlayState = {
      overlay,
      box,
      dragging: false,
      startX: 0,
      startY: 0,
      keyHandler: (event) => {
        if (event.key === "Escape") {
          teardownOverlay();
        }
      },
    };

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
    }

    function getRect(currentX, currentY) {
      const x = Math.min(overlayState.startX, currentX);
      const y = Math.min(overlayState.startY, currentY);
      const width = Math.abs(currentX - overlayState.startX);
      const height = Math.abs(currentY - overlayState.startY);
      return { x, y, width, height };
    }
  }

  function submitCapture(rect) {
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    chrome.runtime.sendMessage(
      {
        type: "GLEAMSHOT_CAPTURE_SELECTION",
        rect,
        viewport,
      },
      () => {
        teardownOverlay();
      }
    );
  }

  function teardownOverlay() {
    if (!overlayState) return;
    document.removeEventListener("keydown", overlayState.keyHandler, true);
    overlayState.overlay.remove();
    overlayState = null;
  }
})();
