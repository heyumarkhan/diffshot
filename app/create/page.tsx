"use client"

// Metadata is in a separate server component — see layout for base metadata
import Link from "next/link"
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

  const hasImage = !!(state.beforeImage || state.afterImage)

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 overflow-y-auto pb-24">
        <div className="px-5 pt-5 pb-4 border-b border-gray-100">
          <UploadZone
            beforeImage={state.beforeImage}
            afterImage={state.afterImage}
            onBeforeUpload={(file) => updateState({ beforeImage: file })}
            onAfterUpload={(file) => updateState({ afterImage: file })}
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
      <ExportButton canvasRef={canvasRef} disabled={!hasImage} />
    </div>
  )

  const mobileFloatingDownload = (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
      <ExportButton canvasRef={canvasRef} disabled={!hasImage} />
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
