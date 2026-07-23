"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEditorMode } from "@/components/EditorModeProvider";

/**
 * Small edit circle on every page.
 * Opens unlock / edit controls, plus direct AI Developer and History panels.
 */
export default function EditModeButton() {
  const pathname = usePathname();
  const { active, setActive, unlocked, editor, refresh, openTools } = useEditorMode();
  const [open, setOpen] = useState(false);
  const [changeCode, setChangeCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    setOpen(false);
    setError("");
    setNote("");
  }, [pathname]);

  async function unlock(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNote("");
    try {
      const res = await fetch("/api/auth/content-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changeCode: changeCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unlock failed");
      setNote(
        data.level === "master"
          ? "Master unlocked. Use AI Developer / History from this menu or the top edit bar."
          : data.note || "Unlocked."
      );
      setChangeCode("");
      await refresh();
      setActive(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unlock failed");
    } finally {
      setBusy(false);
    }
  }

  async function lock() {
    await fetch("/api/auth/content-logout", { method: "POST" });
    await refresh();
    setActive(false);
    setNote("Editor locked on this browser.");
  }

  function turnOnEditMode() {
    setActive(!active);
    setNote(
      active
        ? "Edit controls hidden."
        : "Edit mode on — top bar shows AI Developer and History."
    );
  }

  function openPanel(panel: "ai" | "history") {
    openTools(panel);
    setOpen(false);
  }

  return (
    <div className="fixed bottom-20 right-3 z-50 md:bottom-6">
      {open && (
        <div className="mb-3 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-900">Page edit</p>
            <button
              type="button"
              className="text-xs text-slate-500 hover:text-slate-800"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </div>

          {unlocked ? (
            <div className="space-y-3 text-sm">
              <p className="rounded-xl bg-emerald-50 px-3 py-2 text-emerald-900">
                Unlocked as <strong>{editor?.level}</strong> editor.
              </p>
              <button
                type="button"
                className={active ? "btn-secondary w-full" : "btn-primary w-full"}
                onClick={turnOnEditMode}
              >
                {active ? "Hide edit controls" : "Start editing this page"}
              </button>

              <div className="grid gap-2">
                <button type="button" className="btn-primary w-full" onClick={() => openPanel("ai")}>
                  AI Developer
                </button>
                <button
                  type="button"
                  className="btn-secondary w-full"
                  onClick={() => openPanel("history")}
                >
                  History &amp; Undo
                </button>
              </div>

              <Link
                href="/manage"
                className="btn-ghost block w-full text-center"
                onClick={() => setOpen(false)}
              >
                Open Manage
              </Link>

              <form onSubmit={unlock} className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-medium text-slate-700">Switch / upgrade code</p>
                <input
                  type="password"
                  className="input"
                  value={changeCode}
                  onChange={(e) => setChangeCode(e.target.value)}
                  placeholder="Content or Master code"
                />
                <button
                  type="submit"
                  className="btn-secondary w-full"
                  disabled={busy || !changeCode.trim()}
                >
                  {busy ? "Checking…" : "Re-unlock"}
                </button>
              </form>

              <button type="button" className="btn-ghost w-full" onClick={lock}>
                Lock editor
              </button>
            </div>
          ) : (
            <form onSubmit={unlock} className="space-y-3">
              <p className="text-xs text-slate-600">
                Enter the <strong>content</strong> or <strong>master</strong> change code once.
              </p>
              <input
                type="password"
                className="input"
                value={changeCode}
                onChange={(e) => setChangeCode(e.target.value)}
                placeholder="Content or Master code"
                required
                autoFocus
              />
              <button
                type="submit"
                className="btn-primary w-full"
                disabled={busy || !changeCode.trim()}
              >
                {busy ? "Checking…" : "Unlock edit"}
              </button>
              <Link
                href="/login"
                className="btn-ghost block w-full text-center"
                onClick={() => setOpen(false)}
              >
                Full login page
              </Link>
            </form>
          )}

          {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
          {note && <p className="mt-3 text-xs text-emerald-700">{note}</p>}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        title={unlocked ? "Edit this page" : "Unlock edit with content code"}
        aria-label={unlocked ? "Open page edit menu" : "Unlock page edit"}
        aria-expanded={open}
        className={
          active
            ? "flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-lg font-bold text-white shadow-lg hover:bg-brand-700"
            : "flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-lg font-bold text-slate-700 shadow-lg hover:border-brand-300 hover:text-brand-700"
        }
      >
        ✎
      </button>
    </div>
  );
}
