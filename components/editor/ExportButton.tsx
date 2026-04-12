"use client"

import { RefObject, useState } from "react"
import { EditorState, EXPORT_SIZES } from "@/lib/constants"

interface ExportButtonProps {
  canvasRef: RefObject<{ exportPNG: (filename?: string) => Promise<void> } | null>
  disabled: boolean
  state: EditorState
}

function exportFilename(state: EditorState) {
  const title = state.title || state.badge || (state.mode === "compare" ? "comparison" : "screenshot")
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)

  return `gleamshot-${slug || "screenshot"}-${state.exportSize}.png`
}

export function ExportButton({ canvasRef, disabled, state }: ExportButtonProps) {
  const [loading, setLoading] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  const exportSize = EXPORT_SIZES[state.exportSize]

  async function handleExport() {
    if (!canvasRef.current || disabled) return
    setLoading(true)
    setDownloaded(false)
    try {
      await canvasRef.current.exportPNG(exportFilename(state))
      setDownloaded(true)
      window.setTimeout(() => setDownloaded(false), 1800)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={disabled || loading}
      className={`w-full py-3 px-4 rounded-lg text-sm font-semibold transition-colors ${
        disabled
          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
          : loading
          ? "bg-blue-400 text-white cursor-wait"
          : downloaded
          ? "bg-emerald-600 text-white hover:bg-emerald-700"
          : "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
      }`}
    >
      {loading ? "Generating..." : downloaded ? "Downloaded" : `Download ${exportSize.label} PNG`}
      {!loading && !downloaded && (
        <span className="mt-0.5 block text-xs font-medium opacity-80">{exportSize.sub}</span>
      )}
    </button>
  )
}
