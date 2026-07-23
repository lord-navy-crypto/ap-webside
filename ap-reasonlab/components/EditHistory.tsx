"use client";

import { useCallback, useEffect, useState } from "react";
import type { ManagedContent } from "@/lib/managed-types";

type HistoryEntry = {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
};

export default function EditHistory({
  onRestored,
}: {
  onRestored?: (content: ManagedContent) => void;
}) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [confirmSha, setConfirmSha] = useState("");
  const [restoring, setRestoring] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/edit-history", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not load history.");
      setHistory(Array.isArray(result.history) ? result.history : []);
      if (!result.history?.length) setMessage(result.note || "No history is available.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load history.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function restoreVersion() {
    if (!confirmSha) return;
    setRestoring(true);
    setMessage("");
    try {
      const response = await fetch("/api/edit-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sha: confirmSha }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Undo failed.");
      setConfirmSha("");
      setMessage(
        `Restored version ${String(result.restoredFrom || "").slice(0, 7)}. The restoration is also recorded in history.`
      );
      onRestored?.(result.content as ManagedContent);
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Undo failed.");
      setConfirmSha("");
    } finally {
      setRestoring(false);
    }
  }

  const undoTarget = history[1];
  const confirmTarget = history.find((entry) => entry.sha === confirmSha);

  return (
    <section className="space-y-4">
      <div className="card flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
            Content recovery
          </p>
          <h2 className="mt-1 text-2xl font-bold">Modification history</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Every Manager or AI Developer save creates a version of managed website content.
            Restoring never deletes history—it creates another traceable version.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-secondary"
            disabled={loading}
            onClick={() => void refresh()}
          >
            {loading ? "Loading…" : "Refresh history"}
          </button>
          <button
            type="button"
            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
            disabled={!undoTarget || restoring}
            onClick={() => undoTarget && setConfirmSha(undoTarget.sha)}
          >
            Undo latest change
          </button>
        </div>
      </div>

      {message && (
        <p role="status" className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {message}
        </p>
      )}

      <div className="space-y-3">
        {history.map((entry, index) => (
          <article
            key={entry.sha}
            className={`card flex flex-wrap items-center justify-between gap-4 ${
              index === 0 ? "border-emerald-200 bg-emerald-50/40" : ""
            }`}
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <code className="text-xs text-slate-500">{entry.sha.slice(0, 7)}</code>
                {index === 0 && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                    Current version
                  </span>
                )}
              </div>
              <h3 className="mt-1 break-words font-semibold text-slate-900">{entry.message}</h3>
              <p className="mt-1 text-xs text-slate-500">
                {entry.author}
                {entry.date ? ` · ${new Date(entry.date).toLocaleString()}` : ""}
              </p>
            </div>
            <div className="flex gap-2">
              {entry.url && (
                <a
                  className="btn-ghost"
                  href={entry.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  View
                </a>
              )}
              {index > 0 && (
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={restoring}
                  onClick={() => setConfirmSha(entry.sha)}
                >
                  Restore this version
                </button>
              )}
            </div>
          </article>
        ))}
      </div>

      {confirmSha && confirmTarget && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="restore-version-title"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h2 id="restore-version-title" className="text-xl font-semibold">
              Restore this website-content version?
            </h2>
            <p className="mt-3 text-sm text-slate-600">
              Restore <strong>{confirmTarget.message}</strong> (
              <code>{confirmTarget.sha.slice(0, 7)}</code>)? Current content will remain recoverable
              in history.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="btn-secondary"
                disabled={restoring}
                onClick={() => setConfirmSha("")}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                disabled={restoring}
                onClick={() => void restoreVersion()}
              >
                {restoring ? "Restoring…" : "Confirm restore"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
