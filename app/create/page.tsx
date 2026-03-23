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
  const [mobileTab, setMobileTab] = useState<"controls" | "preview">("controls")

  const hasImages = !!(state.beforeImage && state.afterImage)

  const sidebarContent = (
    <div className="flex flex-col h-full">
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
      <div className="px-5 py-4 border-t border-gray-100 bg-white flex-shrink-0">
        <ExportButton canvasRef={canvasRef} disabled={!hasImages} />
      </div>
    </div>
  )

  return (
    <>
      {/* ── DESKTOP LAYOUT (md and above) ── */}
      <div className="hidden md:flex h-screen overflow-hidden bg-gray-50">
        <div className="w-[400px] flex-shrink-0 border-r border-gray-200 bg-white flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
            <a href="/" className="flex items-center gap-2 text-blue-600 font-bold hover:text-blue-700">
              <span>⇌</span><span>DiffShot</span>
            </a>
            <span className="text-xs text-gray-400">Free · No login</span>
          </div>
          {sidebarContent}
        </div>
        <div className="flex-1 overflow-hidden">
          <CanvasPreview ref={canvasRef} state={state} />
        </div>
      </div>

      {/* ── MOBILE LAYOUT (below md) ── */}
      <div className="flex flex-col h-screen overflow-hidden bg-gray-50 md:hidden">
        {/* Mobile header */}
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 flex-shrink-0">
          <a href="/" className="flex items-center gap-1.5 font-bold text-blue-600">
            <span>⇌</span><span>DiffShot</span>
          </a>
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
    </>
  )
}
