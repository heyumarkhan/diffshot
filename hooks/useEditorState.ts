"use client"

import { useState } from "react"
import { DEFAULT_STATE, EditorState } from "@/lib/constants"

const initialState: EditorState = {
  ...DEFAULT_STATE,
  beforeImage: null,
  afterImage: null,
}

export function useEditorState() {
  const [state, setState] = useState<EditorState>(initialState)

  function updateState(partial: Partial<EditorState>) {
    setState((prev) => ({ ...prev, ...partial }))
  }

  function resetState() {
    setState(initialState)
  }

  return { state, setState, updateState, resetState }
}
