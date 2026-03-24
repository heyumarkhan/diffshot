"use client"

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react"
// Note: wrapperRef is declared inside the component body
import { EditorState, EXPORT_SIZES } from "@/lib/constants"

interface CanvasPreviewProps {
  state: EditorState
}

export interface CanvasPreviewHandle {
  exportPNG: () => Promise<void>
}

function scaleToFit(imgW: number, imgH: number, boxW: number, boxH: number) {
  const scale = Math.min(boxW / imgW, boxH / imgH)
  return {
    scale,
    offsetX: (boxW - imgW * scale) / 2,
    offsetY: (boxH - imgH * scale) / 2,
  }
}

async function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new window.Image()
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = reject
    img.src = url
  })
}

export const CanvasPreview = forwardRef<CanvasPreviewHandle, CanvasPreviewProps>(
  function CanvasPreview({ state }, ref) {
    const canvasEl = useRef<HTMLCanvasElement>(null)

    async function renderCanvas(canvas: HTMLCanvasElement, exportW: number, exportH: number, dpr = 1) {
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      canvas.width = exportW * dpr
      canvas.height = exportH * dpr
      canvas.style.width = exportW + "px"
      canvas.style.height = exportH + "px"
      ctx.scale(dpr, dpr)
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = "high"
      ctx.clearRect(0, 0, exportW, exportH)

      const PAD = Math.round(exportW * 0.04)
      const GAP = Math.round(exportW * 0.065)
      const LABEL_H = state.labelPosition !== "hidden" ? Math.round(state.labelFontSize * 1.8) : 0
      const SUB_H = state.labelPosition !== "hidden" && (state.beforeSublabel || state.afterSublabel)
        ? Math.round(state.labelFontSize * 1.2)
        : 0
      // Scale labelGap relative to 1200px reference so it's consistent across all export sizes
      const scaledGap = state.labelPosition !== "hidden" ? Math.round(state.labelGap * (exportW / 1200)) : 0
      const topOffset = state.labelPosition === "above" ? LABEL_H + SUB_H + scaledGap : 0
      const bottomOffset = state.labelPosition === "below" ? LABEL_H + SUB_H + scaledGap : 0

      // Background
      if (state.backgroundType === "solid") {
        ctx.fillStyle = state.backgroundColor
        ctx.fillRect(0, 0, exportW, exportH)
      } else if (state.backgroundType === "gradient") {
        const grad = ctx.createLinearGradient(0, 0, exportW, exportH)
        grad.addColorStop(0, state.gradientStart)
        grad.addColorStop(1, state.gradientEnd)
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, exportW, exportH)
      }
      // transparent = no background fill

      const layout = state.layout

      if (layout === "side-by-side") {
        const panelW = Math.floor((exportW - PAD * 2 - GAP) / 2)
        const panelH = exportH - PAD * 2 - topOffset - bottomOffset

        await drawImagePanel(ctx, state.beforeImage, PAD, PAD + topOffset, panelW, panelH, state)
        await drawImagePanel(ctx, state.afterImage, PAD + panelW + GAP, PAD + topOffset, panelW, panelH, state)

        if (state.labelPosition !== "hidden") {
          drawLabel(ctx, state.beforeLabel, state.beforeSublabel, PAD + panelW / 2, state.labelPosition === "above" ? PAD : PAD + topOffset + panelH + 8, state)
          drawLabel(ctx, state.afterLabel, state.afterSublabel, PAD + panelW + GAP + panelW / 2, state.labelPosition === "above" ? PAD : PAD + topOffset + panelH + 8, state)
        }

        if (state.showArrow) {
          const arrowX = PAD + panelW
          const arrowY = PAD + topOffset + panelH / 2
          drawArrow(ctx, arrowX, arrowY, GAP, "horizontal", state)
        }

      } else if (layout === "stacked") {
        const panelW = exportW - PAD * 2
        const panelH = Math.floor((exportH - PAD * 2 - GAP - topOffset * 2 - bottomOffset * 2) / 2)

        await drawImagePanel(ctx, state.beforeImage, PAD, PAD + topOffset, panelW, panelH, state)
        await drawImagePanel(ctx, state.afterImage, PAD, PAD + topOffset + panelH + GAP + topOffset, panelW, panelH, state)

        if (state.labelPosition !== "hidden") {
          drawLabel(ctx, state.beforeLabel, state.beforeSublabel, PAD + panelW / 2, state.labelPosition === "above" ? PAD : PAD + topOffset + panelH + 8, state)
          drawLabel(ctx, state.afterLabel, state.afterSublabel, PAD + panelW / 2, state.labelPosition === "above" ? PAD + topOffset + panelH + GAP : PAD + topOffset * 2 + panelH * 2 + GAP + 8, state)
        }

        if (state.showArrow) {
          const arrowX = PAD + panelW / 2
          const arrowY = PAD + topOffset + panelH
          drawArrow(ctx, arrowX, arrowY, GAP, "vertical", state)
        }

      } else if (layout === "spotlight") {
        const bigW = Math.floor(exportW * 0.75)
        const bigH = exportH - PAD * 2
        const bigX = exportW - PAD - bigW
        await drawImagePanel(ctx, state.afterImage, bigX, PAD, bigW, bigH, state)

        const smallW = Math.floor(exportW * 0.28)
        const smallH = Math.floor(exportH * 0.35)
        await drawImagePanel(ctx, state.beforeImage, PAD, PAD + 20, smallW, smallH, { ...state, frameStyle: "shadow" })

        if (state.labelPosition !== "hidden") {
          drawLabel(ctx, state.beforeLabel, state.beforeSublabel, PAD + smallW / 2, PAD + 8, state)
          drawLabel(ctx, state.afterLabel, state.afterSublabel, bigX + bigW / 2, PAD + 8, state)
        }

      } else if (layout === "before-only" || layout === "after-only") {
        const img = layout === "before-only" ? state.beforeImage : state.afterImage
        const lbl = layout === "before-only" ? state.beforeLabel : state.afterLabel
        const sub = layout === "before-only" ? state.beforeSublabel : state.afterSublabel
        const panelW = exportW - PAD * 2
        const panelH = exportH - PAD * 2 - topOffset - bottomOffset
        await drawImagePanel(ctx, img, PAD, PAD + topOffset, panelW, panelH, state)
        if (state.labelPosition !== "hidden") {
          drawLabel(ctx, lbl, sub, PAD + panelW / 2, state.labelPosition === "above" ? PAD : PAD + topOffset + panelH + 8, state)
        }
      }

      // Watermark
      if (state.showWatermark) {
        ctx.save()
        ctx.font = `${Math.round(exportW * 0.012)}px Inter, Arial, sans-serif`
        ctx.fillStyle = "#999999"
        ctx.textAlign = "right"
        ctx.textBaseline = "bottom"
        ctx.fillText("Made with DiffShot", exportW - 12, exportH - 10)
        ctx.restore()
      }
    }

    async function drawImagePanel(
      ctx: CanvasRenderingContext2D,
      file: File | null,
      x: number, y: number, w: number, h: number,
      s: EditorState
    ) {
      if (!file) {
        ctx.fillStyle = "#e5e7eb"
        ctx.fillRect(x, y, w, h)
        ctx.fillStyle = "#9ca3af"
        ctx.font = "16px Arial"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText("No image", x + w / 2, y + h / 2)
        return
      }

      const img = await loadImage(file)
      const { scale, offsetX, offsetY } = scaleToFit(img.width, img.height, w, h)

      ctx.save()

      const imgX = x + offsetX
      const imgY = y + offsetY
      const imgW = img.width * scale
      const imgH = img.height * scale

      if (s.frameStyle === "shadow") {
        const blur = s.shadowIntensity === "light" ? 8 : s.shadowIntensity === "strong" ? 24 : 14
        ctx.shadowColor = "rgba(0,0,0,0.25)"
        ctx.shadowBlur = blur
        ctx.shadowOffsetY = blur / 2
      }

      if (s.frameStyle === "rounded" && s.borderRadius > 0) {
        ctx.beginPath()
        ctx.roundRect(imgX, imgY, imgW, imgH, s.borderRadius)
        ctx.clip()
      }

      if (s.frameStyle === "browser") {
        const barH = Math.round(imgH * 0.06)
        ctx.fillStyle = "#E8E8E8"
        ctx.beginPath()
        ctx.roundRect(imgX, imgY - barH, imgW, barH, [4, 4, 0, 0])
        ctx.fill()
        ctx.shadowColor = "transparent"
        const dotR = barH * 0.22
        const dotY = imgY - barH / 2
        ;[["#FF5F56", imgX + barH * 0.4], ["#FFBD2E", imgX + barH * 0.9], ["#27C93F", imgX + barH * 1.4]].forEach(([color, cx]) => {
          ctx.beginPath()
          ctx.arc(cx as number, dotY, dotR, 0, Math.PI * 2)
          ctx.fillStyle = color as string
          ctx.fill()
        })
      }

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = "high"
      ctx.drawImage(img, imgX, imgY, imgW, imgH)
      ctx.restore()
    }

    function drawLabel(ctx: CanvasRenderingContext2D, text: string, subtext: string, cx: number, cy: number, s: EditorState) {
      ctx.save()
      ctx.textAlign = "center"
      ctx.textBaseline = "top"
      ctx.fillStyle = s.labelColor
      ctx.font = `bold ${s.labelFontSize}px Inter, Arial, sans-serif`
      ctx.fillText(text, cx, cy)
      if (subtext) {
        ctx.font = `${Math.round(s.labelFontSize * 0.65)}px Inter, Arial, sans-serif`
        ctx.fillStyle = s.labelColor + "aa"
        ctx.fillText(subtext, cx, cy + s.labelFontSize * 1.1)
      }
      ctx.restore()
    }

    function drawArrow(
      ctx: CanvasRenderingContext2D,
      x: number, y: number,
      gap: number,
      direction: "horizontal" | "vertical",
      s: EditorState
    ) {
      const sizeMap = { small: 1, medium: 1.5, large: 2 }
      const sz = sizeMap[s.arrowSize]
      const lineW = 2 * sz
      const headSize = 10 * sz

      ctx.save()
      ctx.strokeStyle = s.arrowColor
      ctx.fillStyle = s.arrowColor
      ctx.lineWidth = lineW

      if (s.arrowStyle === "dashed") ctx.setLineDash([8, 4])
      else ctx.setLineDash([])

      if (direction === "horizontal") {
        const x1 = x + 8, x2 = x + gap - headSize - 4
        ctx.beginPath()
        ctx.moveTo(x1, y)
        ctx.lineTo(x2, y)
        ctx.stroke()
        ctx.setLineDash([])
        ctx.beginPath()
        ctx.moveTo(x + gap - 6, y)
        ctx.lineTo(x + gap - 6 - headSize, y - headSize / 1.5)
        ctx.lineTo(x + gap - 6 - headSize, y + headSize / 1.5)
        ctx.closePath()
        ctx.fill()

        if (s.arrowStyle === "double") {
          ctx.setLineDash([])
          ctx.beginPath()
          ctx.moveTo(x + gap - 8, y)
          ctx.lineTo(x + 8 + headSize, y)
          ctx.stroke()
          ctx.beginPath()
          ctx.moveTo(x + 6, y)
          ctx.lineTo(x + 6 + headSize, y - headSize / 1.5)
          ctx.lineTo(x + 6 + headSize, y + headSize / 1.5)
          ctx.closePath()
          ctx.fill()
        }
      } else {
        const y1 = y + 8, y2 = y + gap - headSize - 4
        ctx.beginPath()
        ctx.moveTo(x, y1)
        ctx.lineTo(x, y2)
        ctx.stroke()
        ctx.setLineDash([])
        ctx.beginPath()
        ctx.moveTo(x, y + gap - 6)
        ctx.lineTo(x - headSize / 1.5, y + gap - 6 - headSize)
        ctx.lineTo(x + headSize / 1.5, y + gap - 6 - headSize)
        ctx.closePath()
        ctx.fill()
      }

      ctx.restore()
    }

    const wrapperRef = useRef<HTMLDivElement>(null)

    // Always render at full export dimensions, scale with CSS
    function applyScale() {
      const canvas = canvasEl.current
      const wrapper = wrapperRef.current
      if (!canvas || !wrapper) return
      const { width, height } = EXPORT_SIZES[state.exportSize]
      const availW = wrapper.clientWidth - 48
      const availH = wrapper.clientHeight - 48
      const scale = Math.min(availW / width, availH / height, 1)
      canvas.style.transform = `scale(${scale})`
      canvas.style.transformOrigin = "top center"
    }

    useImperativeHandle(ref, () => ({
      async exportPNG() {
        const canvas = canvasEl.current
        if (!canvas) return
        // Canvas is already rendered at full export dimensions — just export it
        const url = canvas.toDataURL("image/png", 1.0)
        const a = document.createElement("a")
        a.href = url
        a.download = "diffshot.png"
        a.click()
      },
    }))

    useEffect(() => {
      const canvas = canvasEl.current
      if (!canvas) return
      const { width, height } = EXPORT_SIZES[state.exportSize]
      // Always render at full export resolution
      renderCanvas(canvas, width, height, 1).then(() => applyScale())
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state])

    useEffect(() => {
      const wrapper = wrapperRef.current
      if (!wrapper) return
      const ro = new ResizeObserver(() => applyScale())
      ro.observe(wrapper)
      return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.exportSize])

    if (!state.beforeImage && !state.afterImage) {
      return (
        <div className="flex items-center justify-center h-full text-center text-gray-400">
          <div>
            <div className="text-5xl mb-4">🖼️</div>
            <p className="text-lg font-medium">Upload screenshots to see preview</p>
            <p className="text-sm mt-1">Your images never leave your browser</p>
          </div>
        </div>
      )
    }

    return (
      <div ref={wrapperRef} className="w-full h-full flex items-start justify-center pt-6 overflow-hidden">
        <canvas
          ref={canvasEl}
          className="rounded-xl shadow-2xl flex-shrink-0"
          style={{ transformOrigin: "top center" }}
        />
      </div>
    )
  }
)
