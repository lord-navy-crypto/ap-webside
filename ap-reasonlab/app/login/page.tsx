"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/manage";
  const [changeCode, setChangeCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [alreadyIn, setAlreadyIn] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data.contentEditor) {
          setAlreadyIn(true);
          setNote(`Already unlocked as ${data.contentEditor.level} editor on this browser.`);
        }
      })
      .catch(() => undefined);
  }, []);

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
      setNote(data.note || "Unlocked.");
      setAlreadyIn(true);
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
    setAlreadyIn(false);
    setNote("Editor session cleared. Enter the content code again to unlock.");
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Editor login</h1>
        <p className="mt-2 text-slate-600">
          Enter the <strong>content change code</strong> once. This browser stays unlocked for
          saving content — you will not be asked for the code on every upload.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium">Content change code</label>
          <input
            type="password"
            className="input"
            value={changeCode}
            onChange={(e) => setChangeCode(e.target.value)}
            placeholder="Content code"
            required={!alreadyIn}
            autoFocus
          />
          <p className="mt-2 text-xs text-slate-500">
            Master code is not required for normal editing right now. Ask an admin if you do not
            have the content code.
          </p>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {note && <p className="text-sm text-emerald-700">{note}</p>}
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="btn-primary" disabled={loading || !changeCode.trim()}>
            {loading ? "Checking…" : alreadyIn ? "Re-unlock / refresh" : "Unlock editor"}
          </button>
          {alreadyIn && (
            <button type="button" className="btn-secondary" onClick={handleLogout}>
              Lock again
            </button>
          )}
          <Link href="/" className="btn-ghost">
            Home
          </Link>
        </div>
      </form>

      <p className="text-xs text-slate-500">
        Publishing still uses Vercel <code>CONTENT_GITHUB_TOKEN</code> (GitHub PAT with Contents
        write on this repo). That is separate from the content change code.
      </p>
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
