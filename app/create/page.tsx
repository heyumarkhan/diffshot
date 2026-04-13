"use client"

// Metadata is in a separate server component — see layout for base metadata
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { useEditorState } from "@/hooks/useEditorState"
import { UploadZone } from "@/components/editor/UploadZone"
import { CanvasPreview, CanvasPreviewHandle } from "@/components/editor/CanvasPreview"
import { Sidebar } from "@/components/editor/Sidebar"
import { ExportButton } from "@/components/editor/ExportButton"

const EXTENSION_STORAGE_PREFIX = "gleamshot-extension-capture:"

async function dataUrlToFile(dataUrl: string, filename: string) {
  const response = await fetch(dataUrl)
  const blob = await response.blob()
  return new File([blob], filename, { type: blob.type || "image/png" })
}

export default function CreatePage() {
  const { state, updateState, resetState } = useEditorState()
  const canvasRef = useRef<CanvasPreviewHandle>(null)
  const consumedCaptureRef = useRef<string | null>(null)
  const [mobileTab, setMobileTab] = useState<"controls" | "preview">("controls")
  const [extensionStatus, setExtensionStatus] = useState<"idle" | "ready" | "missing">("idle")
  const [launchSource, setLaunchSource] = useState<string | null>(null)
  const [captureKey, setCaptureKey] = useState<string | null>(null)

  const hasImage = !!(state.beforeImage || state.afterImage)
  const hasStarterCopy = !!(state.title || state.subtitle || state.badge)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setLaunchSource(params.get("source"))
    setCaptureKey(params.get("captureKey"))
  }, [])

  useEffect(() => {
    if (launchSource !== "extension" || !captureKey || consumedCaptureRef.current === captureKey) return

    let cancelled = false

    async function loadExtensionCapture() {
      const storageKey = `${EXTENSION_STORAGE_PREFIX}${captureKey}`
      const raw = window.localStorage.getItem(storageKey)
      if (!raw) {
        if (!cancelled) setExtensionStatus("missing")
        return
      }

      try {
        const payload = JSON.parse(raw) as { dataUrl?: string }
        if (!payload?.dataUrl) {
          throw new Error("Missing capture payload")
        }

        const file = await dataUrlToFile(payload.dataUrl, `gleamshot-extension-${captureKey}.png`)
        if (cancelled) return

        updateState({
          beforeImage: file,
          afterImage: null,
          mode: "single",
          title: state.title || "Fresh screenshot capture",
          subtitle: state.subtitle || "Captured from the Chrome extension and ready to polish.",
          badge: state.badge || "EXTENSION",
          beforeLabel: state.beforeLabel || "SCREENSHOT",
          beforeSublabel: state.beforeSublabel || "Captured area",
        })
        consumedCaptureRef.current = captureKey
        setExtensionStatus("ready")
        setMobileTab("preview")
        window.localStorage.removeItem(storageKey)
      } catch (error) {
        console.error("Failed to load extension capture", error)
        if (!cancelled) setExtensionStatus("missing")
      }
    }

    loadExtensionCapture()

    function handleCaptureReady(event: Event) {
      const detail = (event as CustomEvent<{ captureKey?: string }>).detail
      if (detail?.captureKey === captureKey) {
        loadExtensionCapture()
      }
    }

    window.addEventListener("gleamshot-extension-capture-ready", handleCaptureReady)
    return () => {
      cancelled = true
      window.removeEventListener("gleamshot-extension-capture-ready", handleCaptureReady)
    }
  }, [captureKey, launchSource, state.badge, state.beforeLabel, state.beforeSublabel, state.subtitle, state.title, updateState])

  function handleBeforeUpload(file: File) {
    updateState({
      beforeImage: file,
      ...(!hasImage && !hasStarterCopy
        ? {
            title: "Product update",
            subtitle: "A cleaner product moment, ready to share.",
            badge: "UPDATE",
            beforeLabel: "PRODUCT",
            beforeSublabel: "Screenshot",
          }
        : {}),
    })
    setMobileTab("preview")
  }

  function handleAfterUpload(file: File) {
    updateState({
      afterImage: file,
      ...(state.beforeImage
        ? {
            mode: "compare",
            beforeLabel: "BEFORE",
            afterLabel: "AFTER",
            beforeSublabel: state.beforeSublabel || "Before",
            afterSublabel: state.afterSublabel || "After",
          }
        : {}),
    })
    setMobileTab("preview")
  }

  function handleRemoveBefore() {
    updateState({
      beforeImage: null,
      mode: state.afterImage ? "single" : state.mode,
    })
  }

  function handleRemoveAfter() {
    updateState({
      afterImage: null,
      mode: "single",
    })
  }

  function handleClearAll() {
    if (window.confirm("Clear both screenshots and reset the editor?")) {
      resetState()
      setMobileTab("controls")
    }
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 overflow-y-auto pb-24">
        <div className="px-5 pt-5 pb-4 border-b border-gray-100">
          <UploadZone
            beforeImage={state.beforeImage}
            afterImage={state.afterImage}
            onBeforeUpload={handleBeforeUpload}
            onAfterUpload={handleAfterUpload}
            onBeforeRemove={handleRemoveBefore}
            onAfterRemove={handleRemoveAfter}
            onClearAll={handleClearAll}
            onSwapImages={() => updateState({ beforeImage: state.afterImage, afterImage: state.beforeImage })}
          />
        </div>
        <div className="px-5 py-5">
          {hasImage ? (
            <Sidebar state={state} onChange={updateState} />
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">Upload a screenshot above to unlock styling controls</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const floatingDownload = (
    <div className="fixed bottom-6 left-0 w-[400px] px-5 z-50 hidden md:block">
      <ExportButton canvasRef={canvasRef} disabled={!hasImage} state={state} />
    </div>
  )

  const mobileFloatingDownload = (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
      <ExportButton canvasRef={canvasRef} disabled={!hasImage} state={state} />
    </div>
  )

  const extensionBanner = launchSource === "extension" && (
    <div className={`mx-5 mt-4 rounded-xl border px-3 py-2 text-xs ${extensionStatus === "missing" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-blue-200 bg-blue-50 text-blue-700"}`}>
      {extensionStatus === "missing"
        ? "Extension launch detected, but the screenshot handoff did not arrive. Try capture again."
        : extensionStatus === "ready"
          ? "Opened from the Chrome extension. Your captured image is now loaded into the editor."
          : "Opened from the Chrome extension. Your captured image is loading into the editor."}
    </div>
  )

  const mobileExtensionBanner = launchSource === "extension" && (
    <div className={`mx-4 mt-3 rounded-xl border px-3 py-2 text-xs ${extensionStatus === "missing" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-blue-200 bg-blue-50 text-blue-700"}`}>
      {extensionStatus === "missing"
        ? "Extension screenshot handoff did not arrive. Try capture again."
        : extensionStatus === "ready"
          ? "Opened from the Chrome extension. Your capture is now loaded into the editor."
          : "Opened from the Chrome extension. Your capture is loading into the editor."}
    </div>
  )

  return (
    <>
      {/* Desktop layout (md and above) */}
      <div className="hidden md:flex h-screen overflow-hidden bg-gray-50">
        <div className="w-[400px] flex-shrink-0 border-r border-gray-200 bg-white flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
            <Link href="/" className="flex items-center gap-2 text-blue-600 font-bold hover:text-blue-700">
              <span>✦</span><span>GleamShot</span>
            </Link>
            <span className="text-xs text-gray-400">Free · No login</span>
          </div>
          {extensionBanner}
          {sidebarContent}
        </div>
        <div className="flex-1 overflow-hidden">
          <CanvasPreview ref={canvasRef} state={state} />
        </div>
      </div>
      {floatingDownload}

      {/* Mobile layout (below md) */}
      <div className="flex flex-col h-screen overflow-hidden bg-gray-50 md:hidden">
        {/* Mobile header */}
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 flex-shrink-0">
          <Link href="/" className="flex items-center gap-1.5 font-bold text-blue-600">
            <span>✦</span><span>GleamShot</span>
          </Link>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-medium">
            <button
              onClick={() => setMobileTab("controls")}
              className={`px-4 py-2 ${mobileTab === "controls" ? "bg-blue-600 text-white" : "bg-white text-gray-600"}`}
            >
              Controls
            </button>
            <button
              onClick={() => setMobileTab("preview")}
              className={`px-4 py-2 ${mobileTab === "preview" ? "bg-blue-600 text-white" : "bg-white text-gray-600"}`}
            >
              Preview
            </button>
          </div>
        </div>

        {mobileExtensionBanner}

        {/* Mobile tab content */}
        <div className="flex-1 min-h-0 overflow-hidden bg-white">
          {mobileTab === "controls" ? (
            sidebarContent
          ) : (
            <div className="h-full bg-gray-50">
              <CanvasPreview ref={canvasRef} state={state} />
            </div>
          )}
        </div>
      </div>
      {mobileFloatingDownload}
    </>
  )
}
