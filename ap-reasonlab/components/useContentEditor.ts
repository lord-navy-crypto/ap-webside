"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export type ContentEditorInfo = {
  level: "content" | "master";
} | null;

/**
 * Content/master editor session for this browser.
 * Re-fetches on every route change so upgrading Content → Master on /login
 * is not stuck on a cached `content` level when opening Manage.
 */
export function useContentEditor() {
  const pathname = usePathname();
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
  }, [refresh, pathname]);

  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === "visible") void refresh();
    }
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [refresh]);

  return { editor, unlocked: Boolean(editor), loading, refresh };
}
