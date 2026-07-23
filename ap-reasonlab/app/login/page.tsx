"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useContentEditor } from "@/components/useContentEditor";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/manage";
  const { editor, unlocked, refresh } = useContentEditor();
  const [changeCode, setChangeCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (unlocked && editor) {
      setNote(`Currently unlocked as ${editor.level} editor on this browser.`);
    }
  }, [editor, unlocked]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNote("");
    try {
      const res = await fetch("/api/auth/content-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changeCode: changeCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      await refresh();
      setNote(
        data.note ||
          "Content editor unlocked. AI Developer and History & Undo are available from the ✎ menu."
      );
      setChangeCode("");
      router.push(next.startsWith("/") ? next : "/manage");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/content-logout", { method: "POST" });
    await refresh();
    setNote("Editor session cleared. Enter the content change code again to unlock.");
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Editor login</h1>
        <p className="mt-2 text-slate-600">
          Enter the <strong>content change code</strong> once. This browser stays unlocked for
          saving, AI Developer, and History &amp; Undo.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        {unlocked && editor && (
          <div className="rounded-xl bg-emerald-50 px-3 py-3 text-sm text-emerald-900">
            Current session: <strong>{editor.level}</strong>
            <span className="mt-1 block text-xs">
              Open the ✎ circle for AI Developer and History &amp; Undo, or continue to Manage.
            </span>
          </div>
        )}
        <div>
          <label className="mb-2 block text-sm font-medium">Content change code</label>
          <input
            type="password"
            className="input"
            value={changeCode}
            onChange={(e) => setChangeCode(e.target.value)}
            placeholder="Content change code"
            required
            autoFocus
          />
          <p className="mt-2 text-xs text-slate-500">
            Only the content code is required for editing, AI Developer, and History.
          </p>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {note && <p className="text-sm text-emerald-700">{note}</p>}
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="btn-primary" disabled={loading || !changeCode.trim()}>
            {loading ? "Checking…" : unlocked ? "Re-unlock" : "Unlock editor"}
          </button>
          {unlocked && (
            <button type="button" className="btn-secondary" onClick={handleLogout}>
              Lock again
            </button>
          )}
          <Link href="/" className="btn-ghost">
            Home
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-sm text-slate-500">Loading login…</div>}>
      <LoginForm />
    </Suspense>
  );
}
