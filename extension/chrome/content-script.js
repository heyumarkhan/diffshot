(() => {
  const STORAGE_PREFIX = "gleamshot-extension-capture:";
  const OVERLAY_ID = "gleamshot-capture-overlay";
  const TOOLBAR_GAP = 12;
  const TOOLBAR_HEIGHT = 48;
  const TOOLBAR_WIDTH = 196;
  const ANNOTATION_TOOLBAR_HEIGHT = 44;
  const DEFAULT_ANNOTATION_COLOR = "#f97316";
  const DEFAULT_ANNOTATION_STROKE_WIDTH = 3;
  const TEXT_SIZE_PER_STROKE_WIDTH = 8;
  const STROKE_WIDTH_PRESETS = [2, 3, 4, 6, 8, 12];
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
      "border-radius: 0",
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
      await captureVisibleAreaSelection();
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
    const annotationCanvas = createAnnotationCanvas();
    const annotationToolbar = createAnnotationToolbar();

    hint.appendChild(fullButton);
    hint.appendChild(cancelButton);
    overlay.appendChild(shadeTop);
    overlay.appendChild(shadeRight);
    overlay.appendChild(shadeBottom);
    overlay.appendChild(shadeLeft);
    overlay.appendChild(box);
    overlay.appendChild(annotationCanvas);
    overlay.appendChild(hint);
    overlay.appendChild(toolbar);
    overlay.appendChild(annotationToolbar);
    document.documentElement.appendChild(overlay);

    overlayState = {
      overlay,
      box,
      toolbar,
      annotationToolbar,
      annotationCanvas,
      annotationCtx: annotationCanvas.getContext("2d"),
      annotationTool: "text",
      annotationButtons: [],
      annotationDraft: null,
      annotationsDirty: false,
      annotationColor: DEFAULT_ANNOTATION_COLOR,
      annotationStrokeWidth: DEFAULT_ANNOTATION_STROKE_WIDTH,
      styleStrokePreview: annotationToolbar.querySelector("[data-annotation-stroke-preview]"),
      styleStrokeCustomInput: annotationToolbar.querySelector("[data-annotation-stroke-custom]"),
      styleColorInput: annotationToolbar.querySelector("[data-annotation-color]"),
      activeTextEditor: null,
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
          if (overlayState?.activeTextEditor) {
            event.stopPropagation();
            event.preventDefault();
            removeActiveTextEditor();
            return;
          }
          teardownOverlay({ preserveCapture: false });
        }
      },
    };
    overlayState.annotationButtons = Array.from(annotationToolbar.querySelectorAll("[data-annotation-tool]"))
      .map((button) => ({ tool: button.dataset.annotationTool, button }));
    updateAnnotationToolButtons();

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
      positionAnnotationCanvas(rect);
      setShadeRect(rect);
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

  function setShadeRect(rect) {
    if (!overlayState?.shades) return;
    const [shadeTop, shadeRight, shadeBottom, shadeLeft] = overlayState.shades;
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
        await persistAnnotatedCapture();
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
        await persistAnnotatedCapture();
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
        await persistAnnotatedCapture();
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

  function createAnnotationToolbar() {
    const toolbar = document.createElement("div");
    toolbar.style.cssText = [
      "position: fixed",
      "display: none",
      "align-items: center",
      "gap: 6px",
      "padding: 6px",
      "width: max-content",
      "max-width: calc(100vw - 16px)",
      `height: ${ANNOTATION_TOOLBAR_HEIGHT}px`,
      "box-sizing: border-box",
      "background: rgba(15, 23, 42, 0.94)",
      "border: 1px solid rgba(255,255,255,0.12)",
      "border-radius: 14px",
      "box-shadow: 0 14px 36px rgba(0,0,0,0.28)",
      "backdrop-filter: blur(10px)",
      "cursor: default",
      "pointer-events: auto",
      "overflow: visible",
    ].join(";");

    const tools = [
      ["text", "T", "Text"],
      ["arrow", "↗", "Arrow"],
      ["rect", "▭", "Rectangle"],
      ["circle", "◯", "Circle"],
      ["line", "／", "Line"],
    ];

    const toolGroup = document.createElement("div");
    toolGroup.style.cssText = [
      "display: flex",
      "align-items: center",
      "gap: 4px",
      "flex: 0 0 auto",
      "padding-right: 6px",
      "border-right: 1px solid rgba(255,255,255,0.14)",
    ].join(";");

    tools.forEach(([tool, icon, label]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = icon;
      button.title = label;
      button.setAttribute("aria-label", label);
      button.style.cssText = annotationButtonStyles(false);
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        if (!overlayState) return;
        commitActiveTextEditor();
        overlayState.annotationTool = tool;
        updateAnnotationToolButtons();
      });
      button.dataset.annotationTool = tool;
      toolGroup.appendChild(button);
    });

    const styleGroup = document.createElement("div");
    styleGroup.style.cssText = [
      "display: flex",
      "align-items: center",
      "gap: 6px",
      "flex: 0 0 auto",
      "min-width: 0",
    ].join(";");

    const strokeControl = document.createElement("div");
    strokeControl.style.cssText = "position: relative; flex: 0 0 auto;";

    const strokeButton = document.createElement("button");
    strokeButton.type = "button";
    strokeButton.title = "Line thickness and text size";
    strokeButton.setAttribute("aria-label", "Line thickness and text size");
    strokeButton.style.cssText = [
      controlBaseStyles("66px"),
      "display: inline-flex",
      "align-items: center",
      "justify-content: center",
      "padding: 0 8px",
    ].join(";");

    const strokePreview = document.createElement("span");
    strokePreview.dataset.annotationStrokePreview = "true";
    strokePreview.style.cssText = [
      "display: block",
      "width: 36px",
      "height: 0",
      `border-top: ${DEFAULT_ANNOTATION_STROKE_WIDTH}px solid ${DEFAULT_ANNOTATION_COLOR}`,
      "border-radius: 999px",
    ].join(";");
    strokeButton.appendChild(strokePreview);

    const strokeMenu = document.createElement("div");
    strokeMenu.style.cssText = [
      "position: absolute",
      "left: 0",
      "top: calc(100% + 6px)",
      "display: none",
      "width: 118px",
      "padding: 6px",
      "box-sizing: border-box",
      "background: rgba(15, 23, 42, 0.98)",
      "border: 1px solid rgba(255,255,255,0.14)",
      "border-radius: 8px",
      "box-shadow: 0 14px 36px rgba(0,0,0,0.28)",
      "z-index: 2147483647",
    ].join(";");

    STROKE_WIDTH_PRESETS.forEach((width) => {
      const option = document.createElement("button");
      option.type = "button";
      option.title = `${width}px`;
      option.setAttribute("aria-label", `${width}px line thickness, ${getTextSizeForStrokeWidth(width)}px text`);
      option.style.cssText = [
        "width: 100%",
        "height: 24px",
        "border: 0",
        "border-radius: 6px",
        "background: transparent",
        "display: flex",
        "align-items: center",
        "justify-content: center",
        "cursor: pointer",
      ].join(";");
      const line = document.createElement("span");
      line.style.cssText = [
        "display: block",
        "width: 78px",
        "height: 0",
        `border-top: ${width}px solid rgba(255,255,255,0.88)`,
        "border-radius: 999px",
      ].join(";");
      option.appendChild(line);
      option.addEventListener("click", (event) => {
        event.stopPropagation();
        setAnnotationStrokeWidth(width);
        strokeMenu.style.display = "none";
      });
      strokeMenu.appendChild(option);
    });

    const strokeCustomInput = document.createElement("input");
    strokeCustomInput.type = "number";
    strokeCustomInput.min = "1";
    strokeCustomInput.max = "32";
    strokeCustomInput.step = "1";
    strokeCustomInput.value = String(DEFAULT_ANNOTATION_STROKE_WIDTH);
    strokeCustomInput.placeholder = "px";
    strokeCustomInput.title = "Custom line thickness and text size";
    strokeCustomInput.setAttribute("aria-label", "Custom line thickness and text size");
    strokeCustomInput.dataset.annotationStrokeCustom = "true";
    strokeCustomInput.style.cssText = `${controlBaseStyles("100%")}; margin-top: 5px;`;
    strokeCustomInput.addEventListener("click", (event) => event.stopPropagation());
    strokeCustomInput.addEventListener("input", () => {
      if (!overlayState) return;
      setAnnotationStrokeWidth(Number(strokeCustomInput.value));
    });
    strokeMenu.appendChild(strokeCustomInput);

    strokeButton.addEventListener("click", (event) => {
      event.stopPropagation();
      strokeMenu.style.display = strokeMenu.style.display === "none" ? "block" : "none";
    });
    strokeControl.appendChild(strokeButton);
    strokeControl.appendChild(strokeMenu);

    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.value = DEFAULT_ANNOTATION_COLOR;
    colorInput.title = "Annotation color";
    colorInput.setAttribute("aria-label", "Annotation color");
    colorInput.dataset.annotationColor = "true";
    colorInput.style.cssText = [
      "width: 24px",
      "height: 24px",
      "padding: 0",
      "border: 0",
      "border-radius: 8px",
      "background: transparent",
      "cursor: pointer",
      "overflow: hidden",
      "flex: 0 0 auto",
    ].join(";");
    colorInput.addEventListener("click", (event) => event.stopPropagation());
    colorInput.addEventListener("input", () => {
      if (!overlayState) return;
      setAnnotationColor(colorInput.value || DEFAULT_ANNOTATION_COLOR);
    });

    styleGroup.appendChild(strokeControl);
    styleGroup.appendChild(colorInput);

    toolbar.appendChild(toolGroup);
    toolbar.appendChild(styleGroup);

    return toolbar;
  }

  function createAnnotationCanvas() {
    const canvas = document.createElement("canvas");
    canvas.style.cssText = [
      "position: fixed",
      "display: none",
      "pointer-events: auto",
      "cursor: crosshair",
      "touch-action: none",
      "box-sizing: border-box",
      "border-radius: 0",
    ].join(";");

    canvas.addEventListener("pointerdown", handleAnnotationPointerDown);
    canvas.addEventListener("pointermove", handleAnnotationPointerMove);
    canvas.addEventListener("pointerup", handleAnnotationPointerUp);
    canvas.addEventListener("pointercancel", cancelAnnotationDraft);

    return canvas;
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

    try {
      const response = await captureWithOverlayHidden(() => chrome.runtime.sendMessage({
        type: "GLEAMSHOT_CAPTURE_SELECTION",
        rect,
        viewport,
      }));

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

  async function captureVisibleAreaSelection() {
    if (!overlayState || overlayState.busy || overlayState.captureKey) return;
    const rect = {
      x: 0,
      y: 0,
      width: window.innerWidth,
      height: window.innerHeight,
    };

    overlayState.rect = rect;
    overlayState.box.style.display = "block";
    overlayState.box.style.left = "0px";
    overlayState.box.style.top = "0px";
    overlayState.box.style.width = `${rect.width}px`;
    overlayState.box.style.height = `${rect.height}px`;
    overlayState.hint.style.display = "none";
    positionAnnotationCanvas(rect);
    setShadeRect(rect);

    await captureSelectionForToolbar(rect);
  }

  function showToolbar(rect) {
    if (!overlayState) return;
    const { toolbar, annotationToolbar, annotationCanvas } = overlayState;
    toolbar.style.display = "flex";
    annotationToolbar.style.display = "flex";
    annotationCanvas.style.display = "block";

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

    positionAnnotationCanvas(rect);
    positionAnnotationToolbar(rect);
    updateAnnotationToolButtons();
  }

  function positionAnnotationCanvas(rect) {
    if (!overlayState?.annotationCanvas) return;
    const canvas = overlayState.annotationCanvas;
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    const pixelWidth = Math.max(1, Math.round(width * dpr));
    const pixelHeight = Math.max(1, Math.round(height * dpr));

    canvas.style.left = `${rect.x}px`;
    canvas.style.top = `${rect.y}px`;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        overlayState.annotationCtx = ctx;
      }
    }
  }

  function positionAnnotationToolbar(rect) {
    if (!overlayState?.annotationToolbar) return;
    const toolbar = overlayState.annotationToolbar;
    const measuredWidth = toolbar.getBoundingClientRect().width;
    const toolbarWidth = Math.min(
      measuredWidth || window.innerWidth - 16,
      Math.max(1, window.innerWidth - 16),
    );
    const toolbarHeight = toolbar.getBoundingClientRect().height || ANNOTATION_TOOLBAR_HEIGHT;
    const left = clamp(
      rect.x + rect.width - toolbarWidth,
      8,
      window.innerWidth - toolbarWidth - 8,
    );
    const top = clamp(
      rect.y - toolbarHeight - TOOLBAR_GAP,
      8,
      Math.max(8, window.innerHeight - toolbarHeight - 8),
    );

    toolbar.style.left = `${left}px`;
    toolbar.style.top = `${top}px`;
  }

  function handleAnnotationPointerDown(event) {
    if (!overlayState?.captureKey || overlayState.busy) return;
    event.stopPropagation();
    event.preventDefault();

    const point = getAnnotationPoint(event);
    if (overlayState.annotationTool === "text") {
      beginInlineTextAnnotation(point);
      return;
    }

    commitActiveTextEditor();
    overlayState.annotationCanvas.setPointerCapture(event.pointerId);
    overlayState.annotationDraft = {
      tool: overlayState.annotationTool,
      start: point,
      end: point,
      snapshot: getAnnotationSnapshot(),
    };
  }

  function handleAnnotationPointerMove(event) {
    if (!overlayState?.annotationDraft) return;
    event.stopPropagation();
    event.preventDefault();

    overlayState.annotationDraft.end = getAnnotationPoint(event);
    redrawAnnotationDraft();
  }

  function handleAnnotationPointerUp(event) {
    if (!overlayState?.annotationDraft) return;
    event.stopPropagation();
    event.preventDefault();

    overlayState.annotationDraft.end = getAnnotationPoint(event);
    redrawAnnotationDraft();
    overlayState.annotationDraft = null;
    overlayState.annotationsDirty = true;
  }

  function cancelAnnotationDraft() {
    if (!overlayState?.annotationDraft) return;
    restoreAnnotationSnapshot(overlayState.annotationDraft.snapshot);
    overlayState.annotationDraft = null;
  }

  function beginInlineTextAnnotation(point) {
    if (!overlayState?.overlay || !overlayState.rect) return;
    removeActiveTextEditor();

    const editor = document.createElement("textarea");
    editor.rows = 1;
    editor.placeholder = "Type…";
    editor.spellcheck = false;
    editor.wrap = "soft";
    editor.style.cssText = [
      "position: fixed",
      "min-width: 80px",
      "min-height: 1.4em",
      "width: 180px",
      "padding: 0",
      "margin: 0",
      "border: 0",
      "outline: none",
      "resize: none",
      "overflow: hidden",
      "background: transparent",
      "box-shadow: none",
      "white-space: pre-wrap",
      "overflow-wrap: break-word",
      "z-index: 2147483647",
    ].join(";");

    overlayState.overlay.appendChild(editor);
    overlayState.activeTextEditor = { editor, point };
    positionActiveTextEditor(point);
    syncActiveTextEditorStyle();
    autoSizeTextarea(editor);

    editor.addEventListener("pointerdown", (event) => event.stopPropagation());
    editor.addEventListener("click", (event) => event.stopPropagation());
    editor.addEventListener("input", () => {
      syncActiveTextEditorStyle();
      autoSizeTextarea(editor);
    });
    editor.addEventListener("blur", () => {
      commitActiveTextEditor();
    });
    editor.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        removeActiveTextEditor();
        return;
      }

      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        commitActiveTextEditor();
      }
    });

    editor.focus();
  }

  function redrawAnnotationDraft() {
    if (!overlayState?.annotationDraft || !overlayState.annotationCtx) return;
    const { tool, start, end, snapshot } = overlayState.annotationDraft;
    const ctx = overlayState.annotationCtx;

    restoreAnnotationSnapshot(snapshot);
    ctx.save();
    ctx.strokeStyle = overlayState.annotationColor;
    ctx.fillStyle = overlayState.annotationColor;
    ctx.lineWidth = getAnnotationStrokeWidth();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (tool === "rect") {
      ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
    } else if (tool === "circle") {
      const x = Math.min(start.x, end.x);
      const y = Math.min(start.y, end.y);
      const width = Math.abs(end.x - start.x);
      const height = Math.abs(end.y - start.y);
      ctx.beginPath();
      ctx.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      drawLine(ctx, start, end, tool === "arrow");
    }

    ctx.restore();
  }

  function drawLine(ctx, start, end, withArrow) {
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();

    if (!withArrow) return;
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    const headLength = Math.max(12, getAnnotationStrokeWidth() * 4);
    ctx.beginPath();
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(
      end.x - headLength * Math.cos(angle - Math.PI / 6),
      end.y - headLength * Math.sin(angle - Math.PI / 6),
    );
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(
      end.x - headLength * Math.cos(angle + Math.PI / 6),
      end.y - headLength * Math.sin(angle + Math.PI / 6),
    );
    ctx.stroke();
  }

  function getAnnotationPoint(event) {
    const rect = overlayState.annotationCanvas.getBoundingClientRect();
    return {
      x: clamp(event.clientX - rect.left, 0, rect.width),
      y: clamp(event.clientY - rect.top, 0, rect.height),
    };
  }

  function getAnnotationSnapshot() {
    const canvas = overlayState?.annotationCanvas;
    if (!canvas || !overlayState.annotationCtx) return null;
    return overlayState.annotationCtx.getImageData(0, 0, canvas.width, canvas.height);
  }

  function restoreAnnotationSnapshot(snapshot) {
    if (!overlayState?.annotationCtx || !snapshot) return;
    const ctx = overlayState.annotationCtx;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.putImageData(snapshot, 0, 0);
    ctx.restore();
    ctx.setTransform(window.devicePixelRatio || 1, 0, 0, window.devicePixelRatio || 1, 0, 0);
  }

  function updateAnnotationToolButtons() {
    if (!overlayState?.annotationButtons) return;
    overlayState.annotationButtons.forEach(({ tool, button }) => {
      button.style.cssText = annotationButtonStyles(tool === overlayState.annotationTool);
    });
  }

  function annotationButtonStyles(active) {
    return [
      "width: 28px",
      "height: 28px",
      "border: 0",
      "border-radius: 8px",
      `background: ${active ? "rgba(59, 130, 246, 0.88)" : "rgba(255,255,255,0.08)"}`,
      "color: white",
      "padding: 0",
      "font: 15px/1 system-ui, sans-serif",
      "font-weight: 700",
      "display: inline-flex",
      "align-items: center",
      "justify-content: center",
      "cursor: pointer",
      "flex: 0 0 auto",
    ].join(";");
  }

  function controlBaseStyles(width) {
    return [
      `width: ${width}`,
      "height: 28px",
      "box-sizing: border-box",
      "border: 1px solid rgba(255,255,255,0.18)",
      "border-radius: 8px",
      "background: rgba(255,255,255,0.08)",
      "color: white",
      "padding: 0 8px",
      "font: 11px/1 system-ui, sans-serif",
      "font-weight: 600",
      "outline: none",
      "cursor: pointer",
    ].join(";");
  }

  function getAnnotationStrokeWidth() {
    return clamp(Math.round(overlayState?.annotationStrokeWidth || DEFAULT_ANNOTATION_STROKE_WIDTH), 1, 32);
  }

  function getAnnotationTextSize() {
    return getTextSizeForStrokeWidth(getAnnotationStrokeWidth());
  }

  function getTextSizeForStrokeWidth(width) {
    return clamp(Math.round((width || DEFAULT_ANNOTATION_STROKE_WIDTH) * TEXT_SIZE_PER_STROKE_WIDTH), 8, 96);
  }

  function setAnnotationStrokeWidth(width) {
    if (!overlayState) return;
    const nextWidth = clamp(Math.round(width || DEFAULT_ANNOTATION_STROKE_WIDTH), 1, 32);
    overlayState.annotationStrokeWidth = nextWidth;
    if (overlayState.styleStrokeCustomInput) {
      overlayState.styleStrokeCustomInput.value = String(nextWidth);
    }
    updateStrokePreview();
    syncActiveTextEditorStyle();
  }

  function updateStrokePreview() {
    if (!overlayState?.styleStrokePreview) return;
    overlayState.styleStrokePreview.style.borderTop = `${getAnnotationStrokeWidth()}px solid ${overlayState.annotationColor}`;
  }

  function setAnnotationColor(color) {
    if (!overlayState) return;
    const hex = normalizeHexColor(color);
    if (!hex) return;
    overlayState.annotationColor = hex;
    if (overlayState.styleColorInput) {
      overlayState.styleColorInput.value = hex;
    }
    updateStrokePreview();
    syncActiveTextEditorStyle();
  }

  function normalizeHexColor(value) {
    const text = String(value || "").trim();
    const match = text.match(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
    if (!match) return null;
    const hex = match[1].toLowerCase();
    if (hex.length === 3) {
      return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`;
    }
    return `#${hex}`;
  }

  function syncActiveTextEditorStyle() {
    const active = overlayState?.activeTextEditor?.editor;
    if (!active || !overlayState) return;
    active.style.color = overlayState.annotationColor;
    active.style.font = `${getAnnotationTextSize()}px/1.25 system-ui, sans-serif`;
    active.style.fontWeight = "400";
    active.style.caretColor = overlayState.annotationColor;
    active.style.textShadow = "none";
    active.style.webkitTextStroke = "0";
    active.style.width = `${Math.max(80, Math.min(overlayState.rect.width - overlayState.activeTextEditor.point.x, 320))}px`;
    autoSizeTextarea(active);
  }

  function positionActiveTextEditor(point) {
    const active = overlayState?.activeTextEditor?.editor;
    if (!active || !overlayState?.rect) return;
    active.style.left = `${overlayState.rect.x + point.x}px`;
    active.style.top = `${overlayState.rect.y + point.y}px`;
    active.style.maxWidth = `${Math.max(40, overlayState.rect.width - point.x)}px`;
    active.style.maxHeight = `${Math.max(24, overlayState.rect.height - point.y)}px`;
  }

  function autoSizeTextarea(textarea) {
    textarea.style.height = "auto";
    textarea.style.height = `${Math.max(textarea.scrollHeight, 24)}px`;
  }

  function commitActiveTextEditor() {
    if (!overlayState?.activeTextEditor?.editor || !overlayState.annotationCtx) return;
    const { editor, point } = overlayState.activeTextEditor;
    const text = editor.value.replace(/\s+$/g, "");

    if (text.trim()) {
      drawTextAnnotation(text, point);
      overlayState.annotationsDirty = true;
    }

    removeActiveTextEditor();
  }

  function removeActiveTextEditor() {
    const active = overlayState?.activeTextEditor?.editor;
    if (!active || !overlayState) return;
    active.remove();
    overlayState.activeTextEditor = null;
  }

  function drawTextAnnotation(text, point) {
    const ctx = overlayState?.annotationCtx;
    if (!ctx || !overlayState) return;
    const lines = String(text).split("\n");
    const textSize = getAnnotationTextSize();
    const lineHeight = Math.round(textSize * 1.25);

    ctx.save();
    ctx.fillStyle = overlayState.annotationColor;
    ctx.font = `${textSize}px system-ui, sans-serif`;
    ctx.textBaseline = "top";

    lines.forEach((line, index) => {
      const y = point.y + index * lineHeight;
      ctx.fillText(line, point.x, y);
    });
    ctx.restore();
  }

  function clamp(value, min, max) {
    if (max < min) return min;
    return Math.min(Math.max(value, min), max);
  }

  async function persistAnnotatedCapture() {
    commitActiveTextEditor();
    if (!overlayState?.annotationsDirty || !overlayState.captureKey || !overlayState.annotationCanvas) return;
    const storageKey = STORAGE_PREFIX + overlayState.captureKey;
    const stored = await chrome.storage.local.get(storageKey);
    const payload = stored?.[storageKey];
    if (!payload?.dataUrl) return;

    const image = await loadImage(payload.dataUrl);
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth || image.width;
    canvas.height = image.naturalHeight || image.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    ctx.drawImage(overlayState.annotationCanvas, 0, 0, canvas.width, canvas.height);

    await chrome.storage.local.set({
      [storageKey]: {
        ...payload,
        dataUrl: canvas.toDataURL("image/png"),
        annotatedAt: Date.now(),
      },
    });
    overlayState.annotationsDirty = false;
  }

  function loadImage(dataUrl) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = dataUrl;
    });
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

  async function captureWithOverlayHidden(capture) {
    if (!overlayState) {
      return await capture();
    }

    const { overlay } = overlayState;
    const previousVisibility = overlay.style.visibility;
    overlay.style.visibility = "hidden";
    await waitForCleanFrame();

    try {
      return await capture();
    } finally {
      if (overlayState) {
        overlay.style.visibility = previousVisibility;
        await waitForCleanFrame();
      }
    }
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
    commitActiveTextEditor();
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
