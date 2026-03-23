export const EXPORT_SIZES = {
  linkedin: { width: 1200, height: 627, label: "LinkedIn", sub: "1200 × 627" },
  twitter: { width: 1200, height: 675, label: "Twitter / X", sub: "1200 × 675" },
  square: { width: 1080, height: 1080, label: "Square", sub: "1080 × 1080" },
  tall: { width: 1080, height: 1350, label: "Tall", sub: "1080 × 1350" },
} as const

export const GRADIENT_PRESETS = [
  { name: "Blue Grey", start: "#F0F2FF", end: "#E0E6FF" },
  { name: "Dark", start: "#1a1a2e", end: "#16213e" },
  { name: "Purple", start: "#667eea", end: "#764ba2" },
  { name: "Warm", start: "#ffecd2", end: "#fcb69f" },
  { name: "Green", start: "#d4edda", end: "#a8d5b5" },
  { name: "Sunset", start: "#f093fb", end: "#f5576c" },
] as const

export const DEFAULT_STATE = {
  layout: "side-by-side" as "side-by-side" | "stacked" | "spotlight" | "before-only" | "after-only",
  beforeLabel: "BEFORE",
  beforeSublabel: "",
  afterLabel: "AFTER",
  afterSublabel: "",
  labelPosition: "above" as "above" | "below" | "inside" | "hidden",
  labelFontSize: 28,
  labelColor: "#111111",
  showArrow: true,
  arrowStyle: "solid" as "solid" | "dashed" | "double",
  arrowColor: "#0557F0",
  arrowSize: "medium" as "small" | "medium" | "large",
  backgroundType: "solid" as "solid" | "gradient" | "transparent",
  backgroundColor: "#F0F2FF",
  gradientPresetIndex: 0,
  gradientStart: "#F0F2FF",
  gradientEnd: "#E0E6FF",
  frameStyle: "none" as "none" | "shadow" | "browser" | "rounded",
  borderRadius: 8,
  shadowIntensity: "medium" as "light" | "medium" | "strong",
  exportSize: "linkedin" as "linkedin" | "twitter" | "square" | "tall",
  showWatermark: true,
}

export type EditorState = typeof DEFAULT_STATE & {
  beforeImage: File | null
  afterImage: File | null
}
