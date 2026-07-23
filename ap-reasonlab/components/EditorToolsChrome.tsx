"use client";

import Link from "next/link";
import AIDeveloperBlocks from "@/components/AIDeveloperBlocks";
import EditHistory from "@/components/EditHistory";
import { useEditorMode } from "@/components/EditorModeProvider";

/**
 * Always-visible editor chrome once unlocked:
 * - Top bar in edit mode with AI Developer + History
 * - Full-screen overlay panels (not buried in Manage tabs)
 */
export default function EditorToolsChrome() {
  const { active, unlocked, editor, toolsPanel, openTools, closeTools } = useEditorMode();

  if (!unlocked) return null;

  const needsMaster = editor?.level !== "master";

  return (
    <>
      {active && (
        <div className="sticky top-[57px] z-40 border-b border-brand-200 bg-brand-50/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-2">
            <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-brand-700">
              Edit mode · {editor?.level}
            </span>
            <button type="button" className="btn-primary" onClick={() => openTools("ai")}>
              AI Developer
            </button>
            <button type="button" className="btn-secondary" onClick={() => openTools("history")}>
              History &amp; Undo
            </button>
            <Link href="/manage" className="btn-ghost">
              Open Manage
            </Link>
            {needsMaster && (
              <span className="text-xs text-amber-800">
                Master code unlocks apply/undo actions inside these tools.
              </span>
            )}
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
              {needsMaster ? (
                <div className="card mx-auto max-w-xl space-y-3 text-center">
                  <h3 className="text-xl font-bold">Master code required for this tool</h3>
                  <p className="text-sm text-slate-600">
                    You are unlocked as <strong>content</strong>. Open the ✎ circle, enter the{" "}
                    <strong>Master code</strong>, click Re-unlock, then open this tool again.
                  </p>
                  <p className="text-xs text-slate-500">
                    The buttons stay here in edit mode so you do not need Manage tabs.
                  </p>
                </div>
              ) : toolsPanel === "ai" ? (
                <AIDeveloperBlocks embedded />
              ) : (
                <EditHistory />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
