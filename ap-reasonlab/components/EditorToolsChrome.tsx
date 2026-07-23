"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AIDeveloperBlocks from "@/components/AIDeveloperBlocks";
import EditHistory from "@/components/EditHistory";
import { useEditorMode } from "@/components/EditorModeProvider";

/**
 * Always-visible editor chrome once unlocked with the content code:
 * - Top bar in edit mode with AI Developer + History + Advanced Default
 * - Full-screen overlay panels
 */
export default function EditorToolsChrome() {
  const { active, unlocked, editor, toolsPanel, openTools, closeTools } = useEditorMode();
  const [advancedDefault, setAdvancedDefault] = useState(false);
  const [savingAdvanced, setSavingAdvanced] = useState(false);

  useEffect(() => {
    if (!unlocked || !active) return;
    let cancelled = false;
    fetch("/api/ai/site-tier", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: { advancedDefault?: boolean }) => {
        if (!cancelled) setAdvancedDefault(Boolean(payload.advancedDefault));
      })
      .catch(() => {
        if (!cancelled) setAdvancedDefault(false);
      });
    return () => {
      cancelled = true;
    };
  }, [unlocked, active]);

  async function toggleAdvancedDefault() {
    setSavingAdvanced(true);
    try {
      const next = !advancedDefault;
      const response = await fetch("/api/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set_advanced_default",
          advancedDefault: next,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Save failed");
      setAdvancedDefault(Boolean(result.content?.settings?.advancedDefault ?? next));
    } catch {
      // Keep previous state; pencil menu shows detailed errors.
    } finally {
      setSavingAdvanced(false);
    }
  }

  if (!unlocked) return null;

  return (
    <>
      {active && (
        <div className="sticky top-[57px] z-40 border-b border-brand-200 bg-brand-50/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-2">
            <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-brand-700">
              Edit mode · {editor?.level}
            </span>
            <button
              type="button"
              className={advancedDefault ? "btn-primary" : "btn-secondary"}
              disabled={savingAdvanced}
              onClick={toggleAdvancedDefault}
              aria-pressed={advancedDefault}
              title={
                advancedDefault
                  ? "Advanced Default ON — website API mid-tier"
                  : "Advanced Default OFF — website API Instant"
              }
            >
              {savingAdvanced
                ? "Saving…"
                : advancedDefault
                  ? "Advanced Default · ON"
                  : "Advanced Default · OFF"}
            </button>
            <button type="button" className="btn-primary" onClick={() => openTools("ai")}>
              AI Developer
            </button>
            <button type="button" className="btn-secondary" onClick={() => openTools("history")}>
              History &amp; Undo
            </button>
            <Link href="/manage" className="btn-ghost">
              Open Manage
            </Link>
          </div>
        </div>
      )}

      {toolsPanel && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-slate-950/40 p-3 md:p-6">
          <div className="mx-auto flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
                  Editor tools
                </p>
                <h2 className="text-lg font-bold text-slate-900">
                  {toolsPanel === "ai" ? "AI Developer" : "History & Undo"}
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={toolsPanel === "ai" ? "btn-primary" : "btn-ghost"}
                  onClick={() => openTools("ai")}
                >
                  AI Developer
                </button>
                <button
                  type="button"
                  className={toolsPanel === "history" ? "btn-primary" : "btn-ghost"}
                  onClick={() => openTools("history")}
                >
                  History &amp; Undo
                </button>
                <button type="button" className="btn-secondary" onClick={closeTools}>
                  Close
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
              {toolsPanel === "ai" ? <AIDeveloperBlocks embedded /> : <EditHistory />}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
