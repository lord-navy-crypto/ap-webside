"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEditorMode } from "@/components/EditorModeProvider";

/**
 * Small edit circle on every page (blue pencil when edit mode is on).
 * Opens unlock / edit controls, Advanced Default, AI Developer, and History.
 */
export default function EditModeButton() {
  const pathname = usePathname();
  const { active, setActive, unlocked, editor, refresh, openTools } = useEditorMode();
  const [open, setOpen] = useState(false);
  const [changeCode, setChangeCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [advancedDefault, setAdvancedDefault] = useState(false);
  const [savingAdvanced, setSavingAdvanced] = useState(false);

  useEffect(() => {
    setOpen(false);
    setError("");
    setNote("");
  }, [pathname]);

  useEffect(() => {
    if (!unlocked) return;
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
  }, [unlocked, open]);

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
      setNote(data.note || "Unlocked. AI Developer and History are available from this menu.");
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

  async function toggleAdvancedDefault() {
    setSavingAdvanced(true);
    setError("");
    setNote("");
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
      if (!response.ok) throw new Error(result.error || "Could not save Advanced Default");
      setAdvancedDefault(Boolean(result.content?.settings?.advancedDefault ?? next));
      setNote(
        next
          ? "Advanced Default ON — website API uses Advanced mid-tier models."
          : "Advanced Default OFF — website API back to Instant."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save Advanced Default");
    } finally {
      setSavingAdvanced(false);
    }
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

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="font-semibold text-slate-900">Advanced Default</p>
                <p className="mt-1 text-xs text-slate-600">
                  {advancedDefault
                    ? "ON — Default website API uses Advanced mid-tier (same class as Your own API)."
                    : "OFF — Default website API stays Instant (lowest)."}
                </p>
                <button
                  type="button"
                  className={
                    advancedDefault
                      ? "btn-primary mt-2 w-full"
                      : "btn-secondary mt-2 w-full"
                  }
                  disabled={savingAdvanced}
                  onClick={toggleAdvancedDefault}
                  aria-pressed={advancedDefault}
                >
                  {savingAdvanced
                    ? "Saving…"
                    : advancedDefault
                      ? "Advanced Default · ON"
                      : "Advanced Default · OFF"}
                </button>
              </div>

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
                  placeholder="Content change code"
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
                Enter the <strong>content change code</strong> once.
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
