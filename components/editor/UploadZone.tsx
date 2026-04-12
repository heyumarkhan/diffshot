"use client"

import { useEffect, useMemo, useRef, useState } from "react"

interface UploadZoneProps {
  beforeImage: File | null
  afterImage: File | null
  onBeforeUpload: (file: File) => void
  onAfterUpload: (file: File) => void
  onBeforeRemove: () => void
  onAfterRemove: () => void
  onSwapImages: () => void
  onClearAll: () => void
}

function useObjectUrl(file: File | null) {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])

  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [url])

  return url
}

function DropBox({
  label,
  helper,
  image,
  onUpload,
  onRemove,
}: {
  label: string
  helper: string
  image: File | null
  onUpload: (file: File) => void
  onRemove: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const preview = useObjectUrl(image)

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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt={label} className="h-[80px] max-w-full rounded-md object-contain shadow-sm flex-shrink-0" />
          <p className="text-xs text-gray-500 truncate max-w-full px-2 text-center">{image?.name}</p>
          <div className="flex items-center gap-2 text-xs font-medium">
            <span className="text-blue-600">Change</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onRemove()
              }}
              className="text-gray-400 hover:text-red-500"
            >
              Remove
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-lg flex-shrink-0">+</div>
          <p className="text-sm font-semibold text-gray-600">{label}</p>
          <p className="text-xs text-gray-400">{helper}</p>
          <p className="text-xs text-gray-300">PNG, JPG, WebP</p>
        </>
      )}
    </div>
  )
}

export function UploadZone({
  beforeImage,
  afterImage,
  onBeforeUpload,
  onAfterUpload,
  onBeforeRemove,
  onAfterRemove,
  onSwapImages,
  onClearAll,
}: UploadZoneProps) {
  const hasBothImages = !!(beforeImage && afterImage)
  const hasAnyImage = !!(beforeImage || afterImage)

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-700">Upload your screenshot</p>
          <p className="text-xs text-gray-400 mt-0.5">Start with one image. Add a second only for before-after posts.</p>
        </div>
        {hasAnyImage && (
          <button
            type="button"
            onClick={onClearAll}
            className="rounded-md border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-500 hover:border-red-200 hover:text-red-500"
          >
            Clear all
          </button>
        )}
      </div>
      <div className="flex gap-3 relative">
        <DropBox
          label="SCREENSHOT"
          helper="Drop or click"
          image={beforeImage}
          onUpload={onBeforeUpload}
          onRemove={onBeforeRemove}
        />
        <DropBox
          label="OPTIONAL SECOND"
          helper="Before-after only"
          image={afterImage}
          onUpload={onAfterUpload}
          onRemove={onAfterRemove}
        />
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
        <p className="text-xs text-center text-blue-600">Single-image exports now start with launch-ready copy you can edit below.</p>
      )}
      {hasBothImages && (
        <p className="text-xs text-center text-blue-600">Compare mode is on. Use Swap if the story reads better in the other direction.</p>
      )}
    </div>
  )
}
