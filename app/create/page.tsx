"use client"

import { useRef } from "react"
import { useEditorState } from "@/hooks/useEditorState"
import { UploadZone } from "@/components/editor/UploadZone"
import { CanvasPreview, CanvasPreviewHandle } from "@/components/editor/CanvasPreview"
import { Sidebar } from "@/components/editor/Sidebar"
import { ExportButton } from "@/components/editor/ExportButton"

export default function CreatePage() {
  const { state, updateState } = useEditorState()
  const canvasRef = useRef<CanvasPreviewHandle>(null)

  const hasImages = !!(state.beforeImage && state.afterImage)

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Left sidebar */}
      <div className="w-[400px] flex-shrink-0 flex flex-col border-r border-gray-200 bg-white">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <a href="/" className="flex items-center gap-2 text-blue-600 font-bold text-base hover:text-blue-700">
            <span>⇌</span>
            <span>DiffShot</span>
          </a>
          <span className="text-xs text-gray-400">Free · No login required</span>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {/* Upload zone — always visible at top */}
          <div className="px-5 pt-5 pb-4 border-b border-gray-100">
            <UploadZone
              beforeImage={state.beforeImage}
              afterImage={state.afterImage}
              onBeforeUpload={(file) => updateState({ beforeImage: file })}
              onAfterUpload={(file) => updateState({ afterImage: file })}
            />
          </div>

          {/* Controls — shown after both images uploaded */}
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

        {/* Export button — sticky at bottom */}
        <div className="px-5 py-4 border-t border-gray-100 bg-white flex-shrink-0">
          <ExportButton canvasRef={canvasRef} disabled={!hasImages} />
        </div>
      </div>

      {/* Right canvas area */}
      <div className="flex-1 overflow-hidden">
        <CanvasPreview ref={canvasRef} state={state} />
      </div>
    </div>
  )
}
