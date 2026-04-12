import type { EditorState } from "@/lib/constants"

export type EditorPreset = {
  id: string
  name: string
  description: string
  settings: Partial<Omit<EditorState, "beforeImage" | "afterImage">>
}

export const EDITOR_PRESETS: EditorPreset[] = [
  {
    id: "clean",
    name: "Clean",
    description: "Balanced spacing with a subtle outline.",
    settings: {
      presetId: "clean",
      canvasPadding: 5,
      imageFitMode: "contain",
      imageVAlign: "center",
      backgroundType: "gradient",
      gradientPresetIndex: 4,
      gradientStart: "#d4edda",
      gradientEnd: "#a8d5b5",
      frameStyle: "rounded",
      borderRadius: 10,
      borderEnabled: true,
      borderWidth: 1,
      borderColor: "#C7D8CA",
      shadowIntensity: "light",
      labelPosition: "above",
      labelFontSize: 28,
      labelGap: 12,
      labelColor: "#111111",
      showArrow: true,
      arrowStyle: "solid",
      arrowColor: "#0557F0",
    },
  },
  {
    id: "tight",
    name: "Tight",
    description: "Cropped, compact, and label-free.",
    settings: {
      presetId: "tight",
      canvasPadding: 2,
      imageFitMode: "cover",
      imageVAlign: "top",
      backgroundType: "solid",
      backgroundColor: "#F8FAFC",
      frameStyle: "shadow",
      shadowIntensity: "light",
      borderEnabled: false,
      borderWidth: 1,
      borderColor: "#E5E7EB",
      labelPosition: "hidden",
      labelGap: 8,
      showArrow: false,
    },
  },
  {
    id: "captioned",
    name: "Captioned",
    description: "Plain background with a stronger caption.",
    settings: {
      presetId: "captioned",
      canvasPadding: 6,
      imageFitMode: "contain",
      imageVAlign: "center",
      backgroundType: "solid",
      backgroundColor: "#FFFFFF",
      frameStyle: "rounded",
      borderRadius: 8,
      borderEnabled: true,
      borderWidth: 1,
      borderColor: "#E5E7EB",
      labelPosition: "below",
      labelFontSize: 30,
      labelGap: 16,
      labelColor: "#111111",
      showArrow: true,
      arrowStyle: "solid",
    },
  },
]
