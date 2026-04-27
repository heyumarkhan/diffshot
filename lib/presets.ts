import type { EditorState } from "@/lib/constants"

export type EditorPreset = {
  id: string
  name: string
  settings: Partial<Omit<EditorState, "beforeImage" | "afterImage">>
}

export const EDITOR_PRESETS: EditorPreset[] = [
  {
    id: "clean",
    name: "Clean",
    settings: {
      presetId: "clean",
      canvasPadding: 4,
      imageFitMode: "contain",
      imageVAlign: "center",
      backgroundType: "gradient",
      gradientPresetIndex: 5,
      gradientStart: "#f093fb",
      gradientEnd: "#f5576c",
      frameStyle: "rounded",
      borderRadius: 8,
      labelPosition: "above",
    },
  },
  {
    id: "tight",
    name: "Tight",
    settings: {
      presetId: "tight",
      canvasPadding: 2,
      imageFitMode: "cover",
      imageVAlign: "top",
      backgroundType: "solid",
      backgroundColor: "#F8FAFC",
      frameStyle: "shadow",
      shadowIntensity: "light",
      labelPosition: "hidden",
    },
  },
  {
    id: "captioned",
    name: "Captioned",
    settings: {
      presetId: "captioned",
      canvasPadding: 6,
      imageFitMode: "contain",
      imageVAlign: "center",
      backgroundType: "solid",
      backgroundColor: "#FFFFFF",
      frameStyle: "rounded",
      borderRadius: 8,
      labelPosition: "below",
      labelFontSize: 30,
      labelGap: 16,
    },
  },
]
