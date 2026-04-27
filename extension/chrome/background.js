const STORAGE_PREFIX = "gleamshot-extension-capture:";
const EDITOR_URL = "https://gleamshot.io/create";

async function startCaptureOnTab(tab) {
  if (!tab?.id) return;
  try {
    await chrome.tabs.sendMessage(tab.id, { type: "GLEAMSHOT_START_CAPTURE" });
  } catch (error) {
    console.warn("Could not start capture overlay", error);
  }
}

chrome.action.onClicked.addListener(async (tab) => {
  await startCaptureOnTab(tab);
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "launch-capture") return;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  await startCaptureOnTab(tab);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "GLEAMSHOT_CAPTURE_SELECTION") {
    captureSelection(message, sender)
      .then((result) => sendResponse({ ok: true, ...result }))
      .catch((error) => {
        console.error("Capture failed", error);
        sendResponse({ ok: false, error: error?.message || "Capture failed" });
      });
    return true;
  }

  if (message?.type === "GLEAMSHOT_OPEN_EDITOR") {
    openEditorForCapture(message.captureKey)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error?.message || "Could not open editor" }));
    return true;
  }

  if (message?.type === "GLEAMSHOT_DOWNLOAD_CAPTURE") {
    downloadCapture(message.captureKey)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error?.message || "Could not download capture" }));
    return true;
  }

  if (message?.type === "GLEAMSHOT_DISCARD_CAPTURE") {
    discardCapture(message.captureKey)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error?.message || "Could not discard capture" }));
    return true;
  }

  return false;
});

async function captureSelection(message, sender) {
  const tab = sender.tab;
  if (!tab?.id || typeof tab.windowId !== "number") {
    throw new Error("Missing sender tab context");
  }

  const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" });
  const cropRect = normalizeRect(message.rect, message.viewport);
  const croppedDataUrl = cropRect
    ? await cropCapturedImage(dataUrl, cropRect)
    : dataUrl;

  const captureKey = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  await chrome.storage.local.set({
    [STORAGE_PREFIX + captureKey]: {
      dataUrl: croppedDataUrl,
      createdAt: Date.now(),
      source: "extension",
      pageUrl: tab.url || "",
      selection: cropRect,
    },
  });

  return { captureKey };
}

function normalizeRect(rect, viewport) {
  if (!rect || !viewport?.width || !viewport?.height) {
    return null;
  }

  const x = Math.max(0, Math.round(rect.x));
  const y = Math.max(0, Math.round(rect.y));
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));

  if (!width || !height) {
    return null;
  }

  return {
    x,
    y,
    width: Math.min(width, viewport.width - x),
    height: Math.min(height, viewport.height - y),
    viewportWidth: viewport.width,
    viewportHeight: viewport.height,
  };
}

async function cropCapturedImage(dataUrl, rect) {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const bitmap = await createImageBitmap(blob);

  const scaleX = bitmap.width / rect.viewportWidth;
  const scaleY = bitmap.height / rect.viewportHeight;
  const sx = Math.round(rect.x * scaleX);
  const sy = Math.round(rect.y * scaleY);
  const sw = Math.max(1, Math.round(rect.width * scaleX));
  const sh = Math.max(1, Math.round(rect.height * scaleY));

  const canvas = new OffscreenCanvas(sw, sh);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not create canvas context");
  }

  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, sw, sh);
  const croppedBlob = await canvas.convertToBlob({ type: "image/png" });
  return await blobToDataUrl(croppedBlob);
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function openEditorForCapture(captureKey) {
  const editorTab = await chrome.tabs.create({
    url: `${EDITOR_URL}?source=extension&captureKey=${encodeURIComponent(captureKey)}`,
    active: true,
  });

  waitForTabComplete(editorTab.id, async () => {
    try {
      await chrome.tabs.sendMessage(editorTab.id, {
        type: "GLEAMSHOT_DELIVER_CAPTURE",
        captureKey,
      });
    } catch (error) {
      console.warn("Capture delivery ping failed", error);
    }
  });
}

async function downloadCapture(captureKey) {
  const payload = await getStoredCapture(captureKey);
  if (!payload?.dataUrl) {
    throw new Error("Capture not found");
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  await chrome.downloads.download({
    url: payload.dataUrl,
    filename: `gleamshot/gleamshot-${timestamp}.png`,
    saveAs: true,
  });
}

async function discardCapture(captureKey) {
  if (!captureKey) return;
  await chrome.storage.local.remove(STORAGE_PREFIX + captureKey);
}

async function getStoredCapture(captureKey) {
  if (!captureKey) return null;
  const storageKey = STORAGE_PREFIX + captureKey;
  const stored = await chrome.storage.local.get(storageKey);
  return stored?.[storageKey] || null;
}

function waitForTabComplete(tabId, callback) {
  if (!tabId) return;

  const listener = (updatedTabId, info) => {
    if (updatedTabId === tabId && info.status === "complete") {
      chrome.tabs.onUpdated.removeListener(listener);
      callback();
    }
  };

  chrome.tabs.onUpdated.addListener(listener);

  setTimeout(() => {
    chrome.tabs.onUpdated.removeListener(listener);
  }, 15000);
}
