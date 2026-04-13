"use client"

import { useCallback, useState } from "react"
import { DEFAULT_STATE, EditorState } from "@/lib/constants"

const initialState: EditorState = {
  ...DEFAULT_STATE,
  beforeImage: null,
  afterImage: null,
}

export function useEditorState() {
  const [state, setState] = useState<EditorState>(initialState)

  const updateState = useCallback((partial: Partial<EditorState>) => {
    setState((prev) => ({ ...prev, ...partial }))
  }, [])

  const resetState = useCallback(() => {
    setState(initialState)
  }, [])

  return { state, setState, updateState, resetState }
}
