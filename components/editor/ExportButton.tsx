"use client"

import { RefObject, useState } from "react"

interface ExportButtonProps {
  canvasRef: RefObject<{ exportPNG: () => Promise<void> } | null>
  disabled: boolean
}

export function ExportButton({ canvasRef, disabled }: ExportButtonProps) {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    if (!canvasRef.current || disabled) return
    setLoading(true)
    try {
      await canvasRef.current.exportPNG()
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
          : "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
      }`}
    >
      {loading ? "Generating..." : "↓ Download PNG"}
    </button>
  )
}
