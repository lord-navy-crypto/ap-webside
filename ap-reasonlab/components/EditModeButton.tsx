"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useContentEditor } from "@/components/useContentEditor";

/**
 * Small edit circle on every page.
 * Closed → click to open. Open → enter content code (if needed) or jump into edit tools.
 */
export default function EditModeButton() {
  const pathname = usePathname();
  const { unlocked, editor, refresh } = useContentEditor();
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
      setNote(data.note || "Unlocked.");
      setChangeCode("");
      await refresh();
      window.dispatchEvent(new CustomEvent("results-edit-mode", { detail: { on: true } }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unlock failed");
    } finally {
      setBusy(false);
    }
  }

  async function lock() {
    await fetch("/api/auth/content-logout", { method: "POST" });
    await refresh();
    setNote("Editor locked on this browser.");
    window.dispatchEvent(new CustomEvent("results-edit-mode", { detail: { on: false } }));
  }

  function turnOnEditMode() {
    window.dispatchEvent(new CustomEvent("results-edit-mode", { detail: { on: true } }));
    setNote("Edit mode on — storage panels on this page will expand when present.");
  }

  return (
    <div className="fixed bottom-20 right-3 z-50 md:bottom-6">
      {open && (
        <div className="mb-3 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
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
              <button type="button" className="btn-primary w-full" onClick={turnOnEditMode}>
                Show edit panels on this page
              </button>
              <Link href="/manage" className="btn-secondary block w-full text-center" onClick={() => setOpen(false)}>
                Open Manage
              </Link>
              <Link href="/partners" className="btn-ghost block w-full text-center" onClick={() => setOpen(false)}>
                Partners / join people
              </Link>
              <button type="button" className="btn-ghost w-full" onClick={lock}>
                Lock editor
              </button>
            </div>
          ) : (
            <form onSubmit={unlock} className="space-y-3">
              <p className="text-xs text-slate-600">
                Enter the <strong>content change code</strong> once. Then you can edit without
                typing it on every save.
              </p>
              <input
                type="password"
                className="input"
                value={changeCode}
                onChange={(e) => setChangeCode(e.target.value)}
                placeholder="Content change code"
                required
                autoFocus
              />
              <button type="submit" className="btn-primary w-full" disabled={busy || !changeCode.trim()}>
                {busy ? "Checking…" : "Unlock edit"}
              </button>
              <Link href="/login" className="btn-ghost block w-full text-center" onClick={() => setOpen(false)}>
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
          unlocked
            ? "flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-lg font-bold text-white shadow-lg hover:bg-brand-700"
            : "flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-lg font-bold text-slate-700 shadow-lg hover:border-brand-300 hover:text-brand-700"
        }
      >
        ✎
      </button>
    </div>
  );
}
