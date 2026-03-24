"use client"

import { EditorState, EXPORT_SIZES, GRADIENT_PRESETS } from "@/lib/constants"
import { SectionLabel } from "@/components/ui/SectionLabel"
import { SegmentedControl } from "@/components/ui/SegmentedControl"
import { Toggle } from "@/components/ui/Toggle"

interface SidebarProps {
  state: EditorState
  onChange: (partial: Partial<EditorState>) => void
}

export function Sidebar({ state, onChange }: SidebarProps) {
  const showArrowSection = state.layout !== "before-only" && state.layout !== "after-only"

  return (
    <div className="space-y-6 pb-4">

      {/* LAYOUT */}
      <div>
        <SectionLabel>Layout</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          {([
            { value: "side-by-side", label: "⇌ Side by Side" },
            { value: "stacked", label: "⇅ Stacked" },
            { value: "spotlight", label: "◎ Spotlight" },
            { value: "before-only", label: "◧ Before Only" },
            { value: "after-only", label: "◨ After Only" },
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

      {/* LABELS */}
      <div>
        <SectionLabel>Labels</SectionLabel>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Before Label</label>
              <input
                type="text"
                value={state.beforeLabel}
                onChange={(e) => onChange({ beforeLabel: e.target.value })}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">After Label</label>
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
              <label className="text-xs text-gray-500 mb-1 block">Before Sublabel</label>
              <input
                type="text"
                value={state.beforeSublabel}
                placeholder="e.g. Old Dashboard"
                onChange={(e) => onChange({ beforeSublabel: e.target.value })}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">After Sublabel</label>
              <input
                type="text"
                value={state.afterSublabel}
                placeholder="e.g. Dashboard 2.0"
                onChange={(e) => onChange({ afterSublabel: e.target.value })}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
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
            <label className="text-xs text-gray-500 mb-1 block">Font Size: {state.labelFontSize}px</label>
            <input
              type="range"
              min={12}
              max={48}
              value={state.labelFontSize}
              onChange={(e) => onChange({ labelFontSize: Number(e.target.value) })}
              className="w-full"
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
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Label Color</label>
            <input
              type="color"
              value={state.labelColor}
              onChange={(e) => onChange({ labelColor: e.target.value })}
              className="h-9 w-full rounded-md border border-gray-200 p-1 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* ARROW */}
      {showArrowSection && (
        <div>
          <SectionLabel>Arrow</SectionLabel>
          <div className="space-y-3">
            <Toggle
              checked={state.showArrow}
              onChange={(val) => onChange({ showArrow: val })}
              label="Show Arrow"
            />
            {state.showArrow && (
              <>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Style</label>
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
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Color</label>
                  <input
                    type="color"
                    value={state.arrowColor}
                    onChange={(e) => onChange({ arrowColor: e.target.value })}
                    className="h-9 w-full rounded-md border border-gray-200 p-1 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Size</label>
                  <SegmentedControl
                    options={[
                      { value: "small", label: "Small" },
                      { value: "medium", label: "Medium" },
                      { value: "large", label: "Large" },
                    ]}
                    value={state.arrowSize}
                    onChange={(val) => onChange({ arrowSize: val })}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}

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
            label="Show &quot;Made with DiffShot&quot;"
          />
          <p className="text-xs text-gray-400 pl-13">Keeping this on helps us grow ❤️</p>
        </div>
      </div>

    </div>
  )
}
