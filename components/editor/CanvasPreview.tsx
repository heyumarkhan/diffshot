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

function scaleImage(
  imgW: number,
  imgH: number,
  boxW: number,
  boxH: number,
  fit: "contain" | "cover",
  vAlign: "top" | "center" | "bottom"
) {
  const scale = fit === "cover" ? Math.max(boxW / imgW, boxH / imgH) : Math.min(boxW / imgW, boxH / imgH)
  const renderedH = imgH * scale
  const offsetY = vAlign === "top" ? 0 : vAlign === "bottom" ? boxH - renderedH : (boxH - renderedH) / 2
  return {
    scale,
    offsetX: (boxW - imgW * scale) / 2,
    offsetY,
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

      const PAD = Math.round(Math.min(exportW, exportH) * (state.canvasPadding / 100))
      const GAP = Math.round(exportW * 0.065)
      const hasLabel = state.labelPosition !== "hidden"
      const LABEL_H = hasLabel ? Math.round(state.labelFontSize * 1.8) : 0
      const SUB_H = hasLabel && (state.beforeSublabel || state.afterSublabel)
        ? Math.round(state.labelFontSize * 1.2) : 0
      const LABEL_ZONE = LABEL_H + SUB_H
      const scaledGap = hasLabel ? Math.round(state.labelGap * (exportW / 1200)) : 0
      const availW = exportW - PAD * 2

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

      const textBlock = measureTopText(ctx, state, exportW)
      const contentTop = PAD + textBlock.height
      const availH = exportH - contentTop - PAD
      if (textBlock.height > 0) {
        drawTopText(ctx, textBlock, exportW, PAD)
      }

      // Pre-load images so we can measure natural dimensions for centering
      const beforeImg = state.beforeImage ? await loadImage(state.beforeImage) : null
      const afterImg = state.afterImage ? await loadImage(state.afterImage) : null

      // Helper: given a panel width, calculate natural rendered height of image (capped at maxH)
      function naturalH(img: HTMLImageElement | null, panelW: number, maxH: number): number {
        if (!img) return maxH
        return Math.min(img.height * (panelW / img.width), maxH)
      }

      function panelImageH(img: HTMLImageElement | null, panelW: number, maxH: number): number {
        if (state.imageFitMode === "cover") return maxH
        return naturalH(img, panelW, maxH)
      }

      // Helper: center a content block (labelZone + gap + image) vertically in availH
      function centerBlock(imgH: number): { imgY: number; labelY: number } {
        const totalH = (hasLabel ? LABEL_ZONE + scaledGap : 0) + imgH
        const startY = contentTop + Math.max(0, (availH - totalH) / 2)
        if (!hasLabel || state.labelPosition === "inside") {
          return { imgY: startY, labelY: startY }
        }
        if (state.labelPosition === "above") {
          return { imgY: startY + LABEL_ZONE + scaledGap, labelY: startY }
        }
        // below
        return { imgY: startY, labelY: startY + imgH + scaledGap }
      }

      const canCompare = !!(beforeImg && afterImg)
      const compareLayout = state.layout === "stacked" || state.layout === "spotlight" ? state.layout : "side-by-side"
      const layout = state.mode === "compare" && canCompare ? compareLayout : "single"

      if (layout === "side-by-side") {
        const panelW = Math.floor((availW - GAP) / 2)
        const maxImgH = availH - (hasLabel ? LABEL_ZONE + scaledGap : 0)
        const imgH = Math.min(
          Math.max(
            panelImageH(beforeImg, panelW, maxImgH),
            panelImageH(afterImg, panelW, maxImgH)
          ),
          maxImgH
        )
        const { imgY, labelY } = centerBlock(imgH)

        await drawImagePanel(ctx, beforeImg, PAD, imgY, panelW, imgH, state)
        await drawImagePanel(ctx, afterImg, PAD + panelW + GAP, imgY, panelW, imgH, state)

        if (hasLabel) {
          drawLabel(ctx, state.beforeLabel, state.beforeSublabel, PAD + panelW / 2, labelY, state)
          drawLabel(ctx, state.afterLabel, state.afterSublabel, PAD + panelW + GAP + panelW / 2, labelY, state)
        }
        if (state.showArrow) {
          drawArrow(ctx, PAD + panelW, imgY + imgH / 2, GAP, "horizontal", state)
        }

      } else if (layout === "stacked") {
        const panelW = availW
        const maxImgH = Math.floor((availH - GAP - (hasLabel ? (LABEL_ZONE + scaledGap) * 2 : 0)) / 2)
        const imgH = Math.min(
          Math.max(
            panelImageH(beforeImg, panelW, maxImgH),
            panelImageH(afterImg, panelW, maxImgH)
          ),
          maxImgH
        )
        const labelZoneTotal = hasLabel ? LABEL_ZONE + scaledGap : 0
        const totalH = labelZoneTotal + imgH + GAP + labelZoneTotal + imgH
        const startY = contentTop + Math.max(0, (availH - totalH) / 2)

        const label1Y = hasLabel && state.labelPosition === "above" ? startY : startY + imgH + scaledGap
        const img1Y = hasLabel && state.labelPosition === "above" ? startY + LABEL_ZONE + scaledGap : startY
        const img2Y = img1Y + imgH + GAP + (hasLabel ? LABEL_ZONE + scaledGap : 0)
        const label2Y = hasLabel && state.labelPosition === "above" ? img2Y - LABEL_ZONE - scaledGap : img2Y + imgH + scaledGap

        await drawImagePanel(ctx, beforeImg, PAD, img1Y, panelW, imgH, state)
        await drawImagePanel(ctx, afterImg, PAD, img2Y, panelW, imgH, state)

        if (hasLabel) {
          drawLabel(ctx, state.beforeLabel, state.beforeSublabel, PAD + panelW / 2, label1Y, state)
          drawLabel(ctx, state.afterLabel, state.afterSublabel, PAD + panelW / 2, label2Y, state)
        }
        if (state.showArrow) {
          drawArrow(ctx, PAD + panelW / 2, img1Y + imgH, GAP, "vertical", state)
        }

      } else if (layout === "spotlight") {
        const bigW = Math.floor(exportW * 0.75)
        const bigH = availH
        const bigX = exportW - PAD - bigW
        await drawImagePanel(ctx, afterImg, bigX, contentTop, bigW, bigH, state)
        const smallW = Math.floor(exportW * 0.28)
        const smallH = Math.floor(exportH * 0.35)
        await drawImagePanel(ctx, beforeImg, PAD, contentTop + 20, smallW, smallH, { ...state, frameStyle: "shadow" })
        if (hasLabel) {
          drawLabel(ctx, state.beforeLabel, state.beforeSublabel, PAD + smallW / 2, contentTop + 8, state)
          drawLabel(ctx, state.afterLabel, state.afterSublabel, bigX + bigW / 2, contentTop + 8, state)
        }

      } else if (layout === "single") {
        const img = beforeImg || afterImg
        const lbl = beforeImg ? state.beforeLabel : state.afterLabel
        const sub = beforeImg ? state.beforeSublabel : state.afterSublabel
        const panelW = availW
        const maxImgH = availH - (hasLabel ? LABEL_ZONE + scaledGap : 0)
        const imgH = panelImageH(img, panelW, maxImgH)
        const { imgY, labelY } = centerBlock(imgH)
        await drawImagePanel(ctx, img, PAD, imgY, panelW, imgH, state)
        if (hasLabel) {
          drawLabel(ctx, lbl, sub, PAD + panelW / 2, labelY, state)
        }
      }

      // Watermark
      if (state.showWatermark) {
        ctx.save()
        ctx.font = `${Math.round(exportW * 0.012)}px Inter, Arial, sans-serif`
        ctx.fillStyle = "#999999"
        ctx.textAlign = "right"
        ctx.textBaseline = "bottom"
        ctx.fillText("Made with GleamShot", exportW - 12, exportH - 10)
        ctx.restore()
      }
    }

    async function drawImagePanel(
      ctx: CanvasRenderingContext2D,
      img: HTMLImageElement | null,
      x: number, y: number, w: number, h: number,
      s: EditorState
    ) {
      if (!img) {
        ctx.fillStyle = "#e5e7eb"
        ctx.fillRect(x, y, w, h)
        ctx.fillStyle = "#9ca3af"
        ctx.font = "16px Arial"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText("No image", x + w / 2, y + h / 2)
        return
      }

      const { scale, offsetX, offsetY } = scaleImage(img.width, img.height, w, h, s.imageFitMode, s.imageVAlign)

      ctx.save()

      const imgX = x + offsetX
      const imgY = y + offsetY
      const imgW = img.width * scale
      const imgH = img.height * scale
      const frameX = s.imageFitMode === "cover" ? x : imgX
      const frameY = s.imageFitMode === "cover" ? y : imgY
      const frameW = s.imageFitMode === "cover" ? w : imgW
      const frameH = s.imageFitMode === "cover" ? h : imgH
      const frameRadius = s.frameStyle === "rounded" ? s.borderRadius : 0

      if (s.frameStyle === "shadow") {
        const blur = s.shadowIntensity === "light" ? 8 : s.shadowIntensity === "strong" ? 24 : 14
        ctx.shadowColor = "rgba(0,0,0,0.25)"
        ctx.shadowBlur = blur
        ctx.shadowOffsetY = blur / 2
      }

      if (s.frameStyle === "rounded" && s.borderRadius > 0) {
        ctx.beginPath()
        ctx.roundRect(frameX, frameY, frameW, frameH, s.borderRadius)
        ctx.clip()
      }

      if (s.imageFitMode === "cover") {
        ctx.beginPath()
        ctx.rect(x, y, w, h)
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

      if (s.borderEnabled && s.borderWidth > 0) {
        const inset = s.borderWidth / 2
        ctx.shadowColor = "transparent"
        ctx.lineWidth = s.borderWidth
        ctx.strokeStyle = s.borderColor
        ctx.beginPath()
        if (frameRadius > 0) {
          ctx.roundRect(
            frameX + inset,
            frameY + inset,
            Math.max(0, frameW - s.borderWidth),
            Math.max(0, frameH - s.borderWidth),
            Math.max(0, frameRadius - inset)
          )
        } else {
          ctx.rect(
            frameX + inset,
            frameY + inset,
            Math.max(0, frameW - s.borderWidth),
            Math.max(0, frameH - s.borderWidth)
          )
        }
        ctx.stroke()
      }
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

    function measureTopText(ctx: CanvasRenderingContext2D, s: EditorState, exportW: number) {
      const title = s.title.trim()
      const subtitle = s.subtitle.trim()
      const badge = s.badge.trim()
      const hasText = !!(title || subtitle || badge)
      const titleSize = Math.round(Math.min(Math.max(exportW * 0.042, 30), 58))
      const subtitleSize = Math.round(Math.min(Math.max(exportW * 0.019, 18), 28))
      const badgeSize = Math.round(Math.min(Math.max(exportW * 0.014, 14), 18))
      const maxTextW = exportW * 0.78
      const titleLineH = Math.round(titleSize * 1.12)
      const subtitleLineH = Math.round(subtitleSize * 1.35)
      const titleLines = title ? wrapText(ctx, title, `700 ${titleSize}px Inter, Arial, sans-serif`, maxTextW, 2) : []
      const subtitleLines = subtitle ? wrapText(ctx, subtitle, `${subtitleSize}px Inter, Arial, sans-serif`, maxTextW, 2) : []
      const badgeH = badge ? Math.round(badgeSize * 2.1) : 0
      const badgeGap = badge && (titleLines.length || subtitleLines.length) ? Math.round(exportW * 0.014) : 0
      const titleGap = titleLines.length && subtitleLines.length ? Math.round(exportW * 0.01) : 0
      const bottomGap = hasText ? Math.round(exportW * 0.035) : 0
      const height = badgeH + badgeGap + titleLines.length * titleLineH + titleGap + subtitleLines.length * subtitleLineH + bottomGap

      return {
        badge,
        badgeSize,
        badgeH,
        badgeGap,
        titleLines,
        titleSize,
        titleLineH,
        titleGap,
        subtitleLines,
        subtitleSize,
        subtitleLineH,
        height,
        maxTextW,
      }
    }

    function drawTopText(
      ctx: CanvasRenderingContext2D,
      textBlock: ReturnType<typeof measureTopText>,
      exportW: number,
      y: number
    ) {
      let cursorY = y
      const centerX = exportW / 2

      ctx.save()
      ctx.textAlign = "center"
      ctx.textBaseline = "top"

      if (textBlock.badge) {
        ctx.font = `700 ${textBlock.badgeSize}px Inter, Arial, sans-serif`
        const badgeText = textBlock.badge.toUpperCase()
        const pillW = Math.min(ctx.measureText(badgeText).width + textBlock.badgeSize * 2, textBlock.maxTextW)
        ctx.fillStyle = "rgba(17, 24, 39, 0.88)"
        ctx.beginPath()
        ctx.roundRect(centerX - pillW / 2, cursorY, pillW, textBlock.badgeH, textBlock.badgeH / 2)
        ctx.fill()
        ctx.fillStyle = "#FFFFFF"
        ctx.fillText(badgeText, centerX, cursorY + textBlock.badgeSize * 0.52, pillW - textBlock.badgeSize)
        cursorY += textBlock.badgeH + textBlock.badgeGap
      }

      if (textBlock.titleLines.length) {
        ctx.fillStyle = "#111827"
        ctx.font = `700 ${textBlock.titleSize}px Inter, Arial, sans-serif`
        textBlock.titleLines.forEach((line) => {
          ctx.fillText(line, centerX, cursorY, textBlock.maxTextW)
          cursorY += textBlock.titleLineH
        })
        cursorY += textBlock.titleGap
      }

      if (textBlock.subtitleLines.length) {
        ctx.fillStyle = "rgba(17, 24, 39, 0.72)"
        ctx.font = `${textBlock.subtitleSize}px Inter, Arial, sans-serif`
        textBlock.subtitleLines.forEach((line) => {
          ctx.fillText(line, centerX, cursorY, textBlock.maxTextW)
          cursorY += textBlock.subtitleLineH
        })
      }

      ctx.restore()
    }

    function wrapText(
      ctx: CanvasRenderingContext2D,
      text: string,
      font: string,
      maxWidth: number,
      maxLines: number
    ) {
      ctx.save()
      ctx.font = font
      const words = text.split(/\s+/).filter(Boolean)
      const lines: string[] = []
      let line = ""

      for (const word of words) {
        const nextLine = line ? `${line} ${word}` : word
        if (ctx.measureText(nextLine).width <= maxWidth || !line) {
          line = nextLine
        } else {
          lines.push(line)
          line = word
        }
        if (lines.length === maxLines) break
      }
      if (line && lines.length < maxLines) lines.push(line)

      if (words.length && lines.length === maxLines) {
        let consumed = lines.join(" ").split(/\s+/).length
        if (consumed < words.length) {
          let lastLine = lines[maxLines - 1]
          while (lastLine && ctx.measureText(`${lastLine}...`).width > maxWidth) {
            lastLine = lastLine.split(" ").slice(0, -1).join(" ")
            consumed -= 1
          }
          lines[maxLines - 1] = lastLine ? `${lastLine}...` : "..."
        }
      }

      ctx.restore()
      return lines
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
      canvas.style.transformOrigin = "center center"
    }

    useImperativeHandle(ref, () => ({
      async exportPNG() {
        const canvas = canvasEl.current
        if (!canvas) return
        // Canvas is already rendered at full export dimensions — just export it
        const url = canvas.toDataURL("image/png", 1.0)
        const a = document.createElement("a")
        a.href = url
        a.download = "gleamshot.png"
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
            <div className="text-5xl mb-4">+</div>
            <p className="text-lg font-medium">Upload a screenshot to see preview</p>
            <p className="text-sm mt-1">Your images never leave your browser</p>
          </div>
        </div>
      )
    }

    return (
      <div ref={wrapperRef} className="w-full h-full flex items-center justify-center overflow-hidden">
        <canvas
          ref={canvasEl}
          className="rounded-xl shadow-2xl flex-shrink-0"
          style={{ transformOrigin: "center center" }}
        />
      </div>
    )
  }
)
