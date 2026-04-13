const STORAGE_PREFIX = "gleamshot-extension-capture:";
const EDITOR_URL = "https://gleamshot.io/create";

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab?.id) return;
  try {
    await chrome.tabs.sendMessage(tab.id, { type: "GLEAMSHOT_START_CAPTURE" });
  } catch (error) {
    console.warn("Could not start capture overlay", error);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "GLEAMSHOT_CAPTURE_SELECTION") {
    handleCaptureSelection(message, sender)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => {
        console.error("Capture failed", error);
        sendResponse({ ok: false, error: error?.message || "Capture failed" });
      });
    return true;
  }

  return false;
});

async function handleCaptureSelection(message, sender) {
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
