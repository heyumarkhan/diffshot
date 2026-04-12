"use client"

import { EditorState, EXPORT_SIZES, GRADIENT_PRESETS } from "@/lib/constants"
import { EDITOR_PRESETS } from "@/lib/presets"
import { SectionLabel } from "@/components/ui/SectionLabel"
import { SegmentedControl } from "@/components/ui/SegmentedControl"
import { Toggle } from "@/components/ui/Toggle"

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
        </div>
      </div>

      {/* PRESETS */}
      <div>
        <SectionLabel>Presets</SectionLabel>
        <div className="space-y-2">
          {EDITOR_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onChange(preset.settings)}
              className={`w-full px-3 py-2.5 rounded-lg border transition-colors text-left ${
                state.presetId === preset.id
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-200 hover:border-blue-300"
              }`}
            >
              <span className="block text-xs font-semibold">{preset.name}</span>
              <span className={`mt-0.5 block text-xs ${state.presetId === preset.id ? "text-blue-100" : "text-gray-400"}`}>
                {preset.description}
              </span>
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
                  onClick={() => update({ layout: opt.value })}
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
              onChange={(val) => update({ labelPosition: val })}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Font Size: {state.labelFontSize}px</label>
            <input
              type="range"
              min={12}
              max={48}
              value={state.labelFontSize}
              onChange={(e) => update({ labelFontSize: Number(e.target.value) })}
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
              onChange={(e) => update({ labelGap: Number(e.target.value) })}
              className="w-full"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Label Color</label>
            <input
              type="color"
              value={state.labelColor}
              onChange={(e) => update({ labelColor: e.target.value })}
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
              onChange={(val) => update({ showArrow: val })}
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
                    onChange={(val) => update({ arrowStyle: val })}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Color</label>
                  <input
                    type="color"
                    value={state.arrowColor}
                    onChange={(e) => update({ arrowColor: e.target.value })}
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
                    onChange={(val) => update({ arrowSize: val })}
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
            onChange={(val) => update({ backgroundType: val })}
          />
          {state.backgroundType === "solid" && (
            <input
              type="color"
              value={state.backgroundColor}
              onChange={(e) => update({ backgroundColor: e.target.value })}
              className="h-9 w-full rounded-md border border-gray-200 p-1 cursor-pointer"
            />
          )}
          {state.backgroundType === "gradient" && (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                {GRADIENT_PRESETS.map((preset, i) => (
                  <button
                    key={i}
                    onClick={() => update({ gradientPresetIndex: i, gradientStart: preset.start, gradientEnd: preset.end })}
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
                    onChange={(e) => update({ gradientStart: e.target.value, gradientPresetIndex: -1 })}
                    className="h-8 w-full rounded border border-gray-200 p-0.5 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">End</label>
                  <input
                    type="color"
                    value={state.gradientEnd}
                    onChange={(e) => update({ gradientEnd: e.target.value, gradientPresetIndex: -1 })}
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
            onChange={(val) => update({ frameStyle: val })}
          />
          {state.frameStyle === "rounded" && (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Border Radius: {state.borderRadius}px</label>
              <input
                type="range"
                min={0}
                max={24}
                value={state.borderRadius}
                onChange={(e) => update({ borderRadius: Number(e.target.value) })}
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
                onChange={(val) => update({ shadowIntensity: val })}
              />
            </div>
          )}
          <div className="pt-1 space-y-3">
            <Toggle
              checked={state.borderEnabled}
              onChange={(val) => update({ borderEnabled: val })}
              label="Add border"
            />
            {state.borderEnabled && (
              <div className="grid grid-cols-[1fr_72px] gap-3 items-end">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Border Width: {state.borderWidth}px</label>
                  <input
                    type="range"
                    min={1}
                    max={8}
                    value={state.borderWidth}
                    onChange={(e) => update({ borderWidth: Number(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Color</label>
                  <input
                    type="color"
                    value={state.borderColor}
                    onChange={(e) => update({ borderColor: e.target.value })}
                    className="h-9 w-full rounded-md border border-gray-200 p-1 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
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
