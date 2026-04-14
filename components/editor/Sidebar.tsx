"use client"

import { useEffect, useRef, useState } from "react"
import { EditorState, EXPORT_SIZES, GRADIENT_PRESETS } from "@/lib/constants"
import { EDITOR_PRESETS } from "@/lib/presets"
import { SectionLabel } from "@/components/ui/SectionLabel"
import { SegmentedControl } from "@/components/ui/SegmentedControl"
import { Toggle } from "@/components/ui/Toggle"

const FONT_SIZE_PRESETS = [12, 16, 20, 24, 28, 32, 36, 42, 48]
const LINE_THICKNESS_PRESETS = [1, 2, 3, 4, 6, 8]
const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/
const HEX_COLOR_DRAFT_RE = /^#?[0-9A-Fa-f]{0,6}$/

const CONTENT_STARTERS = [
  {
    id: "launch",
    label: "Launch",
    settings: {
      title: "Launch day is live",
      subtitle: "The fastest path from screenshot to polished product update.",
      badge: "NEW",
      beforeLabel: "PRODUCT",
      beforeSublabel: "Launch view",
      afterLabel: "SECOND SHOT",
      afterSublabel: "",
      labelPosition: "above",
      exportSize: "linkedin",
    },
  },
  {
    id: "update",
    label: "Update",
    settings: {
      title: "A sharper workflow for teams",
      subtitle: "Small product improvements worth sharing this week.",
      badge: "UPDATE",
      beforeLabel: "SCREENSHOT",
      beforeSublabel: "Product update",
      afterLabel: "SECOND SHOT",
      afterSublabel: "",
      labelPosition: "below",
      exportSize: "twitter",
    },
  },
  {
    id: "compare",
    label: "Compare",
    compareOnly: true,
    settings: {
      mode: "compare",
      layout: "side-by-side",
      title: "Before and after",
      subtitle: "A clearer product experience in one frame.",
      badge: "IMPROVED",
      beforeLabel: "BEFORE",
      beforeSublabel: "Old flow",
      afterLabel: "AFTER",
      afterSublabel: "New flow",
      labelPosition: "above",
      exportSize: "linkedin",
    },
  },
] satisfies {
  id: string
  label: string
  compareOnly?: boolean
  settings: Partial<EditorState>
}[]

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function normalizeHexColor(value: string) {
  const trimmed = value.trim()
  const prefixed = trimmed.startsWith("#") ? trimmed : `#${trimmed}`
  return prefixed.toUpperCase()
}

function isValidHexColor(value: string) {
  return HEX_COLOR_RE.test(value)
}

interface FontSizeControlProps {
  value: number
  onChange: (value: number) => void
}

function FontSizeControl({ value, onChange }: FontSizeControlProps) {
  const isPreset = FONT_SIZE_PRESETS.includes(value)
  const [customValue, setCustomValue] = useState(String(value))

  useEffect(() => {
    setCustomValue(String(value))
  }, [value])

  function commitCustom(nextValue: string) {
    const parsed = Number(nextValue)
    if (Number.isFinite(parsed)) {
      onChange(clampNumber(Math.round(parsed), 8, 96))
    }
  }

  return (
    <div>
      <label className="text-xs text-gray-500 mb-1 block">Font Size</label>
      <select
        value={isPreset ? String(value) : "custom"}
        onChange={(e) => {
          if (e.target.value !== "custom") {
            onChange(Number(e.target.value))
          }
        }}
        className="w-full border border-gray-200 rounded-md px-2 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {FONT_SIZE_PRESETS.map((size) => (
          <option key={size} value={size}>{size}px</option>
        ))}
        <option value="custom">Custom: {value}px</option>
      </select>
      <div className="mt-2 flex items-center gap-2">
        <input
          type="number"
          min={8}
          max={96}
          value={customValue}
          onChange={(e) => {
            setCustomValue(e.target.value)
            commitCustom(e.target.value)
          }}
          onBlur={(e) => {
            commitCustom(e.target.value)
            const parsed = Number(e.target.value)
            setCustomValue(Number.isFinite(parsed) ? String(clampNumber(Math.round(parsed), 8, 96)) : String(value))
          }}
          className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <span className="text-xs text-gray-400">px</span>
      </div>
    </div>
  )
}

interface LineThicknessControlProps {
  value: number
  onChange: (value: number) => void
}

function LineThicknessControl({ value, onChange }: LineThicknessControlProps) {
  const dropdownRef = useRef<HTMLDetailsElement>(null)
  const [customValue, setCustomValue] = useState(String(value))

  useEffect(() => {
    setCustomValue(String(value))
  }, [value])

  function commitThickness(nextValue: string) {
    const parsed = Number(nextValue)
    if (Number.isFinite(parsed)) {
      onChange(clampNumber(Math.round(parsed), 1, 24))
    }
  }

  return (
    <div>
      <label className="text-xs text-gray-500 mb-1 block">Line Thickness</label>
      <details ref={dropdownRef} className="relative">
        <summary className="flex h-10 cursor-pointer list-none items-center justify-between rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500">
          <span className="flex flex-1 items-center gap-3">
            <span className="h-6 flex-1 rounded-sm bg-gray-50 px-1 flex items-center">
              <span
                className="block w-full rounded-full bg-gray-800"
                style={{ height: `${value}px` }}
              />
            </span>
            <span className="text-xs text-gray-500">{value}px</span>
          </span>
        </summary>
        <div className="absolute z-20 mt-1 w-full rounded-md border border-gray-200 bg-white p-2 shadow-lg">
          <div className="space-y-1">
            {LINE_THICKNESS_PRESETS.map((thickness) => (
              <button
                key={thickness}
                type="button"
                onClick={() => {
                  onChange(thickness)
                  dropdownRef.current?.removeAttribute("open")
                }}
                className={`flex h-9 w-full items-center gap-3 rounded-md px-2 text-left text-xs transition-colors ${
                  value === thickness ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span className="flex h-5 flex-1 items-center">
                  <span
                    className="block w-full rounded-full bg-gray-800"
                    style={{ height: `${thickness}px` }}
                  />
                </span>
                <span className="w-8 text-right">{thickness}px</span>
              </button>
            ))}
          </div>
          <div className="mt-2 border-t border-gray-100 pt-2">
            <label className="text-xs text-gray-400 mb-1 block">Custom px</label>
            <input
              type="number"
              min={1}
              max={24}
              value={customValue}
              onChange={(e) => {
                setCustomValue(e.target.value)
                commitThickness(e.target.value)
              }}
              onBlur={(e) => {
                commitThickness(e.target.value)
                const parsed = Number(e.target.value)
                setCustomValue(Number.isFinite(parsed) ? String(clampNumber(Math.round(parsed), 1, 24)) : String(value))
              }}
              className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </details>
    </div>
  )
}

interface HexColorControlProps {
  label: string
  value: string
  onChange: (value: string) => void
}

function HexColorControl({ label, value, onChange }: HexColorControlProps) {
  const safeValue = isValidHexColor(value) ? normalizeHexColor(value) : "#000000"
  const [draftValue, setDraftValue] = useState(safeValue)

  useEffect(() => {
    setDraftValue(safeValue)
  }, [safeValue])

  function commitHex(nextValue: string) {
    const normalized = normalizeHexColor(nextValue)
    if (isValidHexColor(normalized)) {
      onChange(normalized)
    }
  }

  return (
    <div>
      <label className="text-xs text-gray-500 mb-1 block">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} picker`}
          value={safeValue}
          onChange={(e) => onChange(normalizeHexColor(e.target.value))}
          className="h-10 w-10 shrink-0 rounded-md border border-gray-200 p-1 cursor-pointer"
        />
        <input
          type="text"
          value={draftValue}
          maxLength={7}
          spellCheck={false}
          onChange={(e) => {
            const nextValue = e.target.value
            if (!HEX_COLOR_DRAFT_RE.test(nextValue)) return
            const normalizedDraft = nextValue.startsWith("#") ? nextValue : `#${nextValue}`
            setDraftValue(normalizedDraft.toUpperCase())
            commitHex(normalizedDraft)
          }}
          onBlur={(e) => {
            const normalized = normalizeHexColor(e.target.value)
            if (isValidHexColor(normalized)) {
              onChange(normalized)
              setDraftValue(normalized)
            } else {
              setDraftValue(safeValue)
            }
          }}
          className="min-w-0 flex-1 border border-gray-200 rounded-md px-2 py-2 text-sm uppercase focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
    </div>
  )
}

interface SidebarProps {
  state: EditorState
  onChange: (partial: Partial<EditorState>) => void
}

export function Sidebar({ state, onChange }: SidebarProps) {
  const hasBothImages = !!(state.beforeImage && state.afterImage)
  const isCompareMode = state.mode === "compare" && hasBothImages
  const showArrowSection = isCompareMode
  const singleLabel = state.beforeImage ? state.beforeLabel : state.afterLabel
  const singleSublabel = state.beforeImage ? state.beforeSublabel : state.afterSublabel
  const singleLabelKey = state.beforeImage ? "beforeLabel" : "afterLabel"
  const singleSublabelKey = state.beforeImage ? "beforeSublabel" : "afterSublabel"

  function update(partial: Partial<EditorState>) {
    onChange({ ...partial, presetId: "custom" })
  }

  return (
    <div className="space-y-6 pb-4">

      {/* MODE */}
      <div>
        <SectionLabel>Mode</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onChange({ mode: "single" })}
            className={`px-3 py-2.5 rounded-lg text-xs font-medium border transition-colors text-left ${
              state.mode === "single" || !hasBothImages
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
            }`}
          >
            Single
          </button>
          <button
            onClick={() => hasBothImages && onChange({ mode: "compare" })}
            disabled={!hasBothImages}
            className={`px-3 py-2.5 rounded-lg text-xs font-medium border transition-colors text-left ${
              isCompareMode
                ? "bg-blue-600 text-white border-blue-600"
                : hasBothImages
                  ? "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                  : "bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed"
            }`}
          >
            Compare
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {hasBothImages ? "Compare is optional. Switch back to Single any time." : "Add a second screenshot only when you need a comparison."}
        </p>
      </div>

      {/* TEXT */}
      <div>
        <SectionLabel>Text</SectionLabel>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Title</label>
            <input
              type="text"
              value={state.title}
              placeholder="e.g. Product updates"
              maxLength={90}
              onChange={(e) => onChange({ title: e.target.value })}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Subtitle</label>
            <input
              type="text"
              value={state.subtitle}
              placeholder="e.g. Faster review flow for teams"
              maxLength={140}
              onChange={(e) => onChange({ subtitle: e.target.value })}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Badge / Tag</label>
            <input
              type="text"
              value={state.badge}
              placeholder="e.g. NEW"
              maxLength={28}
              onChange={(e) => onChange({ badge: e.target.value })}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <p className="text-xs text-gray-400">Fixed above the image. Keep it short.</p>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Starter Copy</label>
            <div className="grid grid-cols-3 gap-2">
              {CONTENT_STARTERS.map((starter) => {
                const disabled = starter.compareOnly && !hasBothImages

                return (
                  <button
                    key={starter.id}
                    type="button"
                    onClick={() => !disabled && onChange(starter.settings)}
                    disabled={disabled}
                    className={`px-3 py-2.5 rounded-lg text-xs font-medium border transition-colors text-left ${
                      disabled
                        ? "bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed"
                        : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600"
                    }`}
                  >
                    {starter.label}
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-gray-400 mt-2">Start from a launch, update, or before-after story and edit the words.</p>
          </div>
        </div>
      </div>

      {/* PRESETS */}
      <div>
        <SectionLabel>Presets</SectionLabel>
        <div className="grid grid-cols-3 gap-2">
          {EDITOR_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onChange(preset.settings)}
              className={`px-3 py-2.5 rounded-lg text-xs font-medium border transition-colors text-left ${
                state.presetId === preset.id
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* QUICK EDITS */}
      <div>
        <SectionLabel>Quick Edits</SectionLabel>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Canvas Padding: {state.canvasPadding}%</label>
            <input
              type="range"
              min={0}
              max={14}
              value={state.canvasPadding}
              onChange={(e) => update({ canvasPadding: Number(e.target.value) })}
              className="w-full"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Image Fit</label>
            <SegmentedControl
              options={[
                { value: "contain", label: "Contain" },
                { value: "cover", label: "Cover" },
              ]}
              value={state.imageFitMode}
              onChange={(val) => update({ imageFitMode: val })}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Vertical Align</label>
            <SegmentedControl
              options={[
                { value: "top", label: "Top" },
                { value: "center", label: "Center" },
                { value: "bottom", label: "Bottom" },
              ]}
              value={state.imageVAlign}
              onChange={(val) => update({ imageVAlign: val })}
            />
          </div>
        </div>
      </div>

      {/* LAYOUT */}
      {isCompareMode && (
        <div>
          <SectionLabel>Compare</SectionLabel>
          <div className="space-y-3">
            <p className="text-xs text-gray-400">Tune the comparison only when both images are part of the story.</p>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: "side-by-side", label: "Side by side" },
                { value: "stacked", label: "Stacked" },
                { value: "spotlight", label: "Spotlight" },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onChange({ layout: opt.value })}
                  className={`px-3 py-2.5 rounded-lg text-xs font-medium border transition-colors text-left ${
                    state.layout === opt.value
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* LABELS */}
      <div>
        <SectionLabel>Labels</SectionLabel>
        <div className="space-y-3">
          {isCompareMode ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Screenshot Label</label>
                  <input
                    type="text"
                    value={state.beforeLabel}
                    onChange={(e) => onChange({ beforeLabel: e.target.value })}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Second Label</label>
                  <input
                    type="text"
                    value={state.afterLabel}
                    onChange={(e) => onChange({ afterLabel: e.target.value })}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Screenshot Sublabel</label>
                  <input
                    type="text"
                    value={state.beforeSublabel}
                    placeholder="e.g. Product Dashboard"
                    onChange={(e) => onChange({ beforeSublabel: e.target.value })}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Second Sublabel</label>
                  <input
                    type="text"
                    value={state.afterSublabel}
                    placeholder="e.g. Mobile View"
                    onChange={(e) => onChange({ afterSublabel: e.target.value })}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              <label className="text-xs text-gray-500 mb-1 block">Screenshot Label</label>
              <input
                type="text"
                value={singleLabel}
                onChange={(e) => onChange({ [singleLabelKey]: e.target.value })}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <label className="text-xs text-gray-500 mt-2 mb-1 block">Screenshot Sublabel</label>
              <input
                type="text"
                value={singleSublabel}
                placeholder="e.g. Product Dashboard"
                onChange={(e) => onChange({ [singleSublabelKey]: e.target.value })}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Label Position</label>
            <SegmentedControl
              options={[
                { value: "above", label: "Above" },
                { value: "below", label: "Below" },
                { value: "inside", label: "Inside" },
                { value: "hidden", label: "Hidden" },
              ]}
              value={state.labelPosition}
              onChange={(val) => onChange({ labelPosition: val })}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Spacing from Image: {state.labelGap}px</label>
            <input
              type="range"
              min={0}
              max={48}
              value={state.labelGap}
              onChange={(e) => onChange({ labelGap: Number(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* SHAPES + STYLE */}
      <div>
        <SectionLabel>Toolbar</SectionLabel>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-3">
            <p className="text-xs font-semibold text-gray-500">Shapes</p>
            {showArrowSection ? (
              <>
                <Toggle
                  checked={state.showArrow}
                  onChange={(val) => onChange({ showArrow: val })}
                  label="Show Arrow"
                />
                {state.showArrow && (
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Arrow Style</label>
                    <SegmentedControl
                      options={[
                        { value: "solid", label: "Solid" },
                        { value: "dashed", label: "Dashed" },
                        { value: "double", label: "Double" },
                      ]}
                      value={state.arrowStyle}
                      onChange={(val) => onChange({ arrowStyle: val })}
                    />
                  </div>
                )}
              </>
            ) : (
              <p className="text-xs text-gray-400">Add a second screenshot to use arrows.</p>
            )}
          </div>
          <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-3">
            <p className="text-xs font-semibold text-gray-500">Style</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <FontSizeControl
                value={state.labelFontSize}
                onChange={(value) => onChange({ labelFontSize: value })}
              />
              <LineThicknessControl
                value={state.arrowThickness}
                onChange={(value) => onChange({ arrowThickness: value })}
              />
              <HexColorControl
                label="Color"
                value={state.arrowColor}
                onChange={(value) => onChange({ arrowColor: value })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* BACKGROUND */}
      <div>
        <SectionLabel>Background</SectionLabel>
        <div className="space-y-3">
          <SegmentedControl
            options={[
              { value: "solid", label: "Solid" },
              { value: "gradient", label: "Gradient" },
              { value: "transparent", label: "None" },
            ]}
            value={state.backgroundType}
            onChange={(val) => onChange({ backgroundType: val })}
          />
          {state.backgroundType === "solid" && (
            <input
              type="color"
              value={state.backgroundColor}
              onChange={(e) => onChange({ backgroundColor: e.target.value })}
              className="h-9 w-full rounded-md border border-gray-200 p-1 cursor-pointer"
            />
          )}
          {state.backgroundType === "gradient" && (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                {GRADIENT_PRESETS.map((preset, i) => (
                  <button
                    key={i}
                    onClick={() => onChange({ gradientPresetIndex: i, gradientStart: preset.start, gradientEnd: preset.end })}
                    title={preset.name}
                    className={`h-9 rounded-lg border-2 transition-all ${
                      state.gradientPresetIndex === i ? "border-blue-500 scale-105" : "border-transparent"
                    }`}
                    style={{ background: `linear-gradient(135deg, ${preset.start}, ${preset.end})` }}
                  />
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Start</label>
                  <input
                    type="color"
                    value={state.gradientStart}
                    onChange={(e) => onChange({ gradientStart: e.target.value, gradientPresetIndex: -1 })}
                    className="h-8 w-full rounded border border-gray-200 p-0.5 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">End</label>
                  <input
                    type="color"
                    value={state.gradientEnd}
                    onChange={(e) => onChange({ gradientEnd: e.target.value, gradientPresetIndex: -1 })}
                    className="h-8 w-full rounded border border-gray-200 p-0.5 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* IMAGE FRAMES */}
      <div>
        <SectionLabel>Image Frames</SectionLabel>
        <div className="space-y-3">
          <SegmentedControl
            options={[
              { value: "none", label: "None" },
              { value: "shadow", label: "Shadow" },
              { value: "browser", label: "Browser" },
              { value: "rounded", label: "Rounded" },
            ]}
            value={state.frameStyle}
            onChange={(val) => onChange({ frameStyle: val })}
          />
          {state.frameStyle === "rounded" && (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Border Radius: {state.borderRadius}px</label>
              <input
                type="range"
                min={0}
                max={24}
                value={state.borderRadius}
                onChange={(e) => onChange({ borderRadius: Number(e.target.value) })}
                className="w-full"
              />
            </div>
          )}
          {state.frameStyle === "shadow" && (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Shadow Intensity</label>
              <SegmentedControl
                options={[
                  { value: "light", label: "Light" },
                  { value: "medium", label: "Medium" },
                  { value: "strong", label: "Strong" },
                ]}
                value={state.shadowIntensity}
                onChange={(val) => onChange({ shadowIntensity: val })}
              />
            </div>
          )}
        </div>
      </div>

      {/* EXPORT SIZE */}
      <div>
        <SectionLabel>Export Size</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          {(Object.entries(EXPORT_SIZES) as [keyof typeof EXPORT_SIZES, { label: string; sub: string }][]).map(([key, val]) => (
            <button
              key={key}
              onClick={() => onChange({ exportSize: key })}
              className={`px-3 py-3 rounded-lg border text-left transition-colors ${
                state.exportSize === key
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 bg-white text-gray-600 hover:border-blue-300"
              }`}
            >
              <p className="text-xs font-semibold">{val.label}</p>
              <p className="text-xs text-gray-400">{val.sub}</p>
            </button>
          ))}
        </div>
      </div>

      {/* WATERMARK */}
      <div>
        <SectionLabel>Watermark</SectionLabel>
        <div className="space-y-2">
          <Toggle
            checked={state.showWatermark}
            onChange={(val) => onChange({ showWatermark: val })}
            label="Show &quot;Made with GleamShot&quot;"
          />
          <p className="text-xs text-gray-400 pl-13">Keeping this on helps us grow ❤️</p>
        </div>
      </div>

    </div>
  )
}
