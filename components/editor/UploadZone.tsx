"use client"

import { useRef, useState } from "react"

interface UploadZoneProps {
  beforeImage: File | null
  afterImage: File | null
  onBeforeUpload: (file: File) => void
  onAfterUpload: (file: File) => void
  onSwapImages: () => void
}

function DropBox({
  label,
  image,
  onUpload,
}: {
  label: string
  image: File | null
  onUpload: (file: File) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return
    if (file.size > 10 * 1024 * 1024) {
      alert("File too large. Max 10MB.")
      return
    }
    onUpload(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const preview = image ? URL.createObjectURL(image) : null

  return (
    <div
      className={`flex-1 border-2 border-dashed rounded-xl p-3 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors h-[150px] overflow-hidden ${
        dragging ? "border-blue-400 bg-blue-50" : "border-gray-300 bg-gray-50 hover:border-blue-300 hover:bg-blue-50"
      }`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
      {preview ? (
        <>
          <img src={preview} alt={label} className="h-[80px] max-w-full rounded-md object-contain shadow-sm flex-shrink-0" />
          <p className="text-xs text-gray-500 truncate max-w-full px-2 text-center">{image?.name}</p>
          <span className="text-xs text-blue-600 font-medium">Click to change</span>
        </>
      ) : (
        <>
          <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-lg flex-shrink-0">+</div>
          <p className="text-sm font-semibold text-gray-600">{label}</p>
          <p className="text-xs text-gray-400">Drop or click</p>
          <p className="text-xs text-gray-300">PNG, JPG, WebP</p>
        </>
      )}
    </div>
  )
}

export function UploadZone({ beforeImage, afterImage, onBeforeUpload, onAfterUpload, onSwapImages }: UploadZoneProps) {
  const hasBothImages = !!(beforeImage && afterImage)

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-gray-700">Upload your screenshot</p>
        <p className="text-xs text-gray-400 mt-0.5">Add a second only for comparisons.</p>
      </div>
      <div className="flex gap-3 relative">
        <DropBox label="SCREENSHOT" image={beforeImage} onUpload={onBeforeUpload} />
        <DropBox label="OPTIONAL SECOND" image={afterImage} onUpload={onAfterUpload} />
        {hasBothImages && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onSwapImages()
            }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-600 shadow-sm hover:border-blue-300 hover:text-blue-600"
          >
            Swap
          </button>
        )}
      </div>
      {(beforeImage && !afterImage) && (
        <p className="text-xs text-center text-blue-600">Single-image exports work best with title, subtitle, and tag.</p>
      )}
    </div>
  )
}
