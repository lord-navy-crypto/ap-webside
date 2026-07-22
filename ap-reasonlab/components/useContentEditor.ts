"use client";

import { useCallback, useEffect, useState } from "react";

export type ContentEditorInfo = {
  level: "content" | "master";
} | null;

export function useContentEditor() {
  const [editor, setEditor] = useState<ContentEditorInfo>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await res.json();
      setEditor(data.contentEditor || null);
    } catch {
      setEditor(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { editor, unlocked: Boolean(editor), loading, refresh };
}
