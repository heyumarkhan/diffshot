"use client"

import { useRef, useState } from "react"
import { useEditorState } from "@/hooks/useEditorState"
import { UploadZone } from "@/components/editor/UploadZone"
import { CanvasPreview, CanvasPreviewHandle } from "@/components/editor/CanvasPreview"
import { Sidebar } from "@/components/editor/Sidebar"
import { ExportButton } from "@/components/editor/ExportButton"

export default function CreatePage() {
  const { state, updateState } = useEditorState()
  const canvasRef = useRef<CanvasPreviewHandle>(null)
  const [mobileTab, setMobileTab] = useState<"preview" | "controls">("controls")

  const hasImages = !!(state.beforeImage && state.afterImage)

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">

      {/* ── MOBILE HEADER ── */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 flex-shrink-0">
        <a href="/" className="flex items-center gap-1.5 font-bold text-blue-600">
          <span>⇌</span><span>DiffShot</span>
        </a>
        {/* Tab switcher */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-medium">
          <button
            onClick={() => setMobileTab("controls")}
            className={`px-4 py-2 transition-colors ${mobileTab === "controls" ? "bg-blue-600 text-white" : "bg-white text-gray-600"}`}
          >
            Controls
          </button>
          <button
            onClick={() => setMobileTab("preview")}
            className={`px-4 py-2 transition-colors ${mobileTab === "preview" ? "bg-blue-600 text-white" : "bg-white text-gray-600"}`}
          >
            Preview
          </button>
        </div>
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── SIDEBAR (desktop: always visible | mobile: shown when controls tab active) ── */}
        <div className={`
          w-full md:w-[400px] md:flex flex-col border-r border-gray-200 bg-white flex-shrink-0
          ${mobileTab === "controls" ? "flex" : "hidden"}
        `}>
          {/* Desktop header */}
          <div className="hidden md:flex px-5 py-4 border-b border-gray-100 items-center justify-between flex-shrink-0">
            <a href="/" className="flex items-center gap-2 text-blue-600 font-bold text-base hover:text-blue-700">
              <span>⇌</span><span>DiffShot</span>
            </a>
            <span className="text-xs text-gray-400">Free · No login</span>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="px-5 pt-5 pb-4 border-b border-gray-100">
              <UploadZone
                beforeImage={state.beforeImage}
                afterImage={state.afterImage}
                onBeforeUpload={(file) => updateState({ beforeImage: file })}
                onAfterUpload={(file) => updateState({ afterImage: file })}
              />
            </div>
            <div className="px-5 py-5">
              {hasImages ? (
                <Sidebar state={state} onChange={updateState} />
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">Upload both screenshots above to unlock styling controls</p>
                </div>
              )}
            </div>
          </div>

          {/* Export button */}
          <div className="px-5 py-4 border-t border-gray-100 bg-white flex-shrink-0">
            <ExportButton canvasRef={canvasRef} disabled={!hasImages} />
          </div>
        </div>

        {/* ── CANVAS AREA (desktop: always visible | mobile: shown when preview tab active) ── */}
        <div className={`
          flex-1 overflow-hidden bg-gray-50
          ${mobileTab === "preview" ? "flex" : "hidden md:flex"}
        `}>
          <CanvasPreview ref={canvasRef} state={state} />
        </div>

      </div>

      {/* ── MOBILE BOTTOM BAR (download button always accessible) ── */}
      <div className="md:hidden px-4 py-3 border-t border-gray-200 bg-white flex-shrink-0">
        <ExportButton canvasRef={canvasRef} disabled={!hasImages} />
      </div>

    </div>
  )
}
