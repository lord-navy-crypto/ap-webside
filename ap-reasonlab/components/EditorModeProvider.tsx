"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useContentEditor } from "@/components/useContentEditor";

export type EditorToolsPanel = null | "ai" | "history";

type EditorModeValue = {
  active: boolean;
  setActive: (active: boolean) => void;
  unlocked: boolean;
  editor: ReturnType<typeof useContentEditor>["editor"];
  loading: boolean;
  refresh: () => Promise<void>;
  toolsPanel: EditorToolsPanel;
  openTools: (panel: Exclude<EditorToolsPanel, null>) => void;
  closeTools: () => void;
};

const EditorModeContext = createContext<EditorModeValue | null>(null);

export function EditorModeProvider({ children }: { children: React.ReactNode }) {
  const session = useContentEditor();
  const [active, setActiveState] = useState(false);
  const [toolsPanel, setToolsPanel] = useState<EditorToolsPanel>(null);

  useEffect(() => {
    setActiveState(sessionStorage.getItem("results-editor-ui") === "on");
  }, []);

  useEffect(() => {
    if (!session.loading && !session.unlocked && active) {
      setActiveState(false);
      sessionStorage.removeItem("results-editor-ui");
      setToolsPanel(null);
    }
  }, [active, session.loading, session.unlocked]);

  const setActive = useCallback(
    (next: boolean) => {
      const safeNext = next && session.unlocked;
      setActiveState(safeNext);
      if (safeNext) sessionStorage.setItem("results-editor-ui", "on");
      else {
        sessionStorage.removeItem("results-editor-ui");
        setToolsPanel(null);
      }
    },
    [session.unlocked]
  );

  const openTools = useCallback(
    (panel: Exclude<EditorToolsPanel, null>) => {
      if (!session.unlocked) return;
      setActiveState(true);
      sessionStorage.setItem("results-editor-ui", "on");
      setToolsPanel(panel);
    },
    [session.unlocked]
  );

  const closeTools = useCallback(() => setToolsPanel(null), []);

  const value = useMemo(
    () => ({
      active: active && session.unlocked,
      setActive,
      unlocked: session.unlocked,
      editor: session.editor,
      loading: session.loading,
      refresh: session.refresh,
      toolsPanel,
      openTools,
      closeTools,
    }),
    [
      active,
      closeTools,
      openTools,
      session.editor,
      session.loading,
      session.refresh,
      session.unlocked,
      setActive,
      toolsPanel,
    ]
  );

  return <EditorModeContext.Provider value={value}>{children}</EditorModeContext.Provider>;
}

export function useEditorMode() {
  const value = useContext(EditorModeContext);
  if (!value) throw new Error("useEditorMode must be used inside EditorModeProvider");
  return value;
}
