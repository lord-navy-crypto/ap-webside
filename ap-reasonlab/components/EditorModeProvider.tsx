"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useContentEditor } from "@/components/useContentEditor";

type EditorModeValue = {
  active: boolean;
  setActive: (active: boolean) => void;
  unlocked: boolean;
  editor: ReturnType<typeof useContentEditor>["editor"];
  loading: boolean;
  refresh: () => Promise<void>;
};

const EditorModeContext = createContext<EditorModeValue | null>(null);

export function EditorModeProvider({ children }: { children: React.ReactNode }) {
  const session = useContentEditor();
  const [active, setActiveState] = useState(false);

  useEffect(() => {
    setActiveState(sessionStorage.getItem("results-editor-ui") === "on");
  }, []);

  useEffect(() => {
    if (!session.loading && !session.unlocked && active) {
      setActiveState(false);
      sessionStorage.removeItem("results-editor-ui");
    }
  }, [active, session.loading, session.unlocked]);

  function setActive(next: boolean) {
    const safeNext = next && session.unlocked;
    setActiveState(safeNext);
    if (safeNext) sessionStorage.setItem("results-editor-ui", "on");
    else sessionStorage.removeItem("results-editor-ui");
  }

  const value = useMemo(
    () => ({
      active: active && session.unlocked,
      setActive,
      unlocked: session.unlocked,
      editor: session.editor,
      loading: session.loading,
      refresh: session.refresh,
    }),
    [active, session.editor, session.loading, session.refresh, session.unlocked]
  );

  return <EditorModeContext.Provider value={value}>{children}</EditorModeContext.Provider>;
}

export function useEditorMode() {
  const value = useContext(EditorModeContext);
  if (!value) throw new Error("useEditorMode must be used inside EditorModeProvider");
  return value;
}

