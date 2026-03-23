"use client"

import { useRef, useState } from "react"

interface UploadZoneProps {
  beforeImage: File | null
  afterImage: File | null
  onBeforeUpload: (file: File) => void
  onAfterUpload: (file: File) => void
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
      className={`flex-1 border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors min-h-[160px] ${
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
          <img src={preview} alt={label} className="max-h-24 max-w-full rounded-lg object-contain shadow-sm" />
          <p className="text-xs text-gray-500 truncate max-w-full">{image?.name}</p>
          <span className="text-xs text-blue-600 font-medium">Click to change</span>
        </>
      ) : (
        <>
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xl">+</div>
          <p className="text-sm font-semibold text-gray-600">{label}</p>
          <p className="text-xs text-gray-400">Drop or click to upload</p>
          <p className="text-xs text-gray-300">PNG, JPG, WebP — max 10MB</p>
        </>
      )}
    </div>
  )
}

export function UploadZone({ beforeImage, afterImage, onBeforeUpload, onAfterUpload }: UploadZoneProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-700">Upload your screenshots</p>
      <div className="flex gap-3">
        <DropBox label="BEFORE" image={beforeImage} onUpload={onBeforeUpload} />
        <DropBox label="AFTER" image={afterImage} onUpload={onAfterUpload} />
      </div>
      {(beforeImage && !afterImage) && (
        <p className="text-xs text-center text-blue-600">Now upload your After screenshot to continue</p>
      )}
    </div>
  )
}
