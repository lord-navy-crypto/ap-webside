"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Concept, Formula } from "@/lib/types";
import type { ManagedContent, ManagedDocument, ManagedFile } from "@/lib/managed-store";

type SessionUser = { id: string; name: string; role: "user" | "partner" | "admin" };
type Tab = "concepts" | "formulas" | "documents" | "files" | "users";

export default function AdminPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [tab, setTab] = useState<Tab>("concepts");
  const [content, setContent] = useState<ManagedContent | null>(null);
  const [users, setUsers] = useState<Array<{ id: string; name: string; role: string; createdAt: number }>>([]);
  const [saveNote, setSaveNote] = useState("");

  // concept form
  const [cTitle, setCTitle] = useState("");
  const [cSubject, setCSubject] = useState("AP Physics 1");
  const [cSummary, setCSummary] = useState("");
  const [cPoints, setCPoints] = useState("");
  const [cMistakes, setCMistakes] = useState("");
  const [cExample, setCExample] = useState("");

  // formula form
  const [fName, setFName] = useState("");
  const [fSubject, setFSubject] = useState("AP Physics 1");
  const [fUnit, setFUnit] = useState("Managed");
  const [fExpr, setFExpr] = useState("");
  const [fVars, setFVars] = useState("");
  const [fWhen, setFWhen] = useState("");

  // document form
  const [dTitle, setDTitle] = useState("");
  const [dCategory, setDCategory] = useState("Uploaded");
  const [dContent, setDContent] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const me = await fetch("/api/auth/me").then((r) => r.json());
        setUser(me.user);
        if (me.user && (me.user.role === "admin" || me.user.role === "partner")) {
          await refreshContent();
          if (me.user.role === "admin") await refreshUsers();
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function refreshContent() {
    const data = await fetch("/api/admin/content").then((r) => r.json());
    setContent(data);
  }

  async function refreshUsers() {
    const res = await fetch("/api/admin/users");
    if (!res.ok) return;
    const data = await res.json();
    setUsers(data.users || []);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", name, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Login failed");
      return;
    }
    setUser(data.user);
    setPassword("");
    if (data.user.role === "admin" || data.user.role === "partner") {
      await refreshContent();
      if (data.user.role === "admin") await refreshUsers();
    } else {
      setError("Logged in as user. Only admin/partner can use Manager UI.");
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setContent(null);
  }

  async function putItem(kind: string, item: unknown) {
    setSaveNote("");
    setError("");
    const res = await fetch("/api/admin/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind,
        item,
        githubToken: githubToken.trim() || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Save failed");
      return;
    }
    setContent(data.content);
    setSaveNote(
      data.mode === "github"
        ? "Saved to GitHub. Vercel will redeploy so everyone sees it (1–2 min)."
        : "Saved locally (dev). On Vercel you must set GITHUB_TOKEN or paste a GitHub token below."
    );
  }

  async function saveGithubToken(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaveNote("");
    const res = await fetch("/api/admin/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "set_github_token", githubToken: githubToken.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not save token");
      return;
    }
    setSaveNote(data.note || "GitHub token saved for this session.");
  }

  async function deleteItem(target: string, id: string) {
    if (!confirm("Delete this item?")) return;
    const res = await fetch("/api/admin/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "delete",
        target,
        id,
        githubToken: githubToken.trim() || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Delete failed");
      return;
    }
    setContent(data.content);
  }

  async function addConcept(e: React.FormEvent) {
    e.preventDefault();
    await putItem("concept", {
      title: cTitle,
      subject: cSubject,
      summary: cSummary,
      keyPoints: cPoints.split("\n").map((s) => s.trim()).filter(Boolean),
      commonMistakes: cMistakes.split("\n").map((s) => s.trim()).filter(Boolean),
      example: cExample,
    } satisfies Partial<Concept>);
    setCTitle("");
    setCSummary("");
    setCPoints("");
    setCMistakes("");
    setCExample("");
  }

  async function addFormula(e: React.FormEvent) {
    e.preventDefault();
    await putItem("formula", {
      name: fName,
      subject: fSubject,
      unit: fUnit,
      expression: fExpr,
      variables: fVars,
      whenToUse: fWhen,
    } satisfies Partial<Formula>);
    setFName("");
    setFExpr("");
    setFVars("");
    setFWhen("");
  }

  async function addDocument(e: React.FormEvent) {
    e.preventDefault();
    await putItem("document", {
      title: dTitle,
      category: dCategory,
      content: dContent,
    } satisfies Partial<ManagedDocument>);
    setDTitle("");
    setDContent("");
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    for (const file of Array.from(files)) {
      const dataUrl = await readFileAsDataURL(file);
      await putItem("file", {
        name: file.name,
        mime: file.type || "application/octet-stream",
        dataUrl,
        note: dCategory,
      } satisfies Partial<ManagedFile>);
    }
    e.target.value = "";
  }

  async function setRole(userId: string, role: string) {
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Role update failed");
      return;
    }
    await refreshUsers();
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading manager...</p>;
  }

  const canManage = user && (user.role === "admin" || user.role === "partner");

  if (!canManage) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Manager UI</h1>
          <p className="mt-2 text-slate-600">
            Upload concepts, formulas, documents, and files without asking AI.
            Full admin or partner password required.
          </p>
        </div>
        <form onSubmit={handleLogin} className="card space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Name (for registered users)</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Optional for env admin login" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Admin / partner / your account password"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="btn-primary w-full">
            Sign in to Manager
          </button>
          <p className="text-xs text-slate-500">
            Default until you set env on Vercel: admin password <code>results-admin</code>,
            partner <code>results-partner</code>. Or{" "}
            <Link href="/register" className="text-brand-600 hover:underline">
              register a user account
            </Link>
            .
          </p>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Manager UI</h1>
          <p className="mt-1 text-sm text-slate-600">
            Signed in as <strong>{user.name}</strong> ({user.role}). Add content here — no AI tokens.
          </p>
        </div>
        <button type="button" onClick={handleLogout} className="btn-ghost">
          Log out
        </button>
      </div>

      {saveNote && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {saveNote}
        </div>
      )}
      {error && <p className="text-sm text-red-600 whitespace-pre-wrap">{error}</p>}

      <form onSubmit={saveGithubToken} className="card space-y-3">
        <h2 className="text-lg font-semibold">Publish token (required on Vercel)</h2>
        <p className="text-sm text-slate-600">
          Vercel cannot write files to disk. To make Save work, either set{" "}
          <code>GITHUB_TOKEN</code> in Vercel env, or paste a GitHub PAT here (Contents: Read and
          Write on this repo). Token stays in an httpOnly cookie for this browser only.
        </p>
        <input
          type="password"
          className="input"
          placeholder="ghp_... or github_pat_..."
          value={githubToken}
          onChange={(e) => setGithubToken(e.target.value)}
        />
        <button type="submit" className="btn-secondary">
          Save token for this session
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["concepts", "Concepts"],
            ["formulas", "Formulas"],
            ["documents", "Documents"],
            ["files", "Files"],
            ...(user.role === "admin" ? [["users", "Users / Partners"] as const] : []),
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value as Tab)}
            className={tab === value ? "filter-pill-active" : "filter-pill"}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "concepts" && content && (
        <div className="grid gap-6 lg:grid-cols-2">
          <form onSubmit={addConcept} className="card space-y-3">
            <h2 className="text-lg font-semibold">Add concept</h2>
            <input className="input" placeholder="Title" value={cTitle} onChange={(e) => setCTitle(e.target.value)} required />
            <input className="input" placeholder="Subject" value={cSubject} onChange={(e) => setCSubject(e.target.value)} required />
            <textarea className="textarea" placeholder="Summary" value={cSummary} onChange={(e) => setCSummary(e.target.value)} />
            <textarea className="textarea" placeholder="Key points (one per line)" value={cPoints} onChange={(e) => setCPoints(e.target.value)} />
            <textarea className="textarea" placeholder="Common mistakes (one per line)" value={cMistakes} onChange={(e) => setCMistakes(e.target.value)} />
            <textarea className="textarea" placeholder="Example" value={cExample} onChange={(e) => setCExample(e.target.value)} />
            <button type="submit" className="btn-primary">Save concept</button>
          </form>
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Managed concepts ({content.concepts.length})</h2>
            {content.concepts.length === 0 ? (
              <div className="card text-sm text-slate-500">None yet.</div>
            ) : (
              content.concepts.map((c) => (
                <div key={c.id} className="card space-y-1">
                  <div className="flex justify-between gap-2">
                    <p className="font-medium">{c.title}</p>
                    <button type="button" className="text-xs text-red-500" onClick={() => deleteItem("concept", c.id)}>Delete</button>
                  </div>
                  <p className="text-xs text-slate-500">{c.subject}</p>
                  <p className="text-sm text-slate-600 line-clamp-2">{c.summary}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {tab === "formulas" && content && (
        <div className="grid gap-6 lg:grid-cols-2">
          <form onSubmit={addFormula} className="card space-y-3">
            <h2 className="text-lg font-semibold">Add formula</h2>
            <input className="input" placeholder="Name" value={fName} onChange={(e) => setFName(e.target.value)} required />
            <input className="input" placeholder="Subject" value={fSubject} onChange={(e) => setFSubject(e.target.value)} required />
            <input className="input" placeholder="Unit" value={fUnit} onChange={(e) => setFUnit(e.target.value)} />
            <input className="input" placeholder="Expression" value={fExpr} onChange={(e) => setFExpr(e.target.value)} required />
            <input className="input" placeholder="Variables" value={fVars} onChange={(e) => setFVars(e.target.value)} />
            <input className="input" placeholder="When to use" value={fWhen} onChange={(e) => setFWhen(e.target.value)} />
            <button type="submit" className="btn-primary">Save formula</button>
          </form>
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Managed formulas ({content.formulas.length})</h2>
            {content.formulas.map((f) => (
              <div key={f.id} className="card space-y-1">
                <div className="flex justify-between gap-2">
                  <p className="font-medium">{f.name}</p>
                  <button type="button" className="text-xs text-red-500" onClick={() => deleteItem("formula", f.id)}>Delete</button>
                </div>
                <p className="font-mono text-sm">{f.expression}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "documents" && content && (
        <div className="grid gap-6 lg:grid-cols-2">
          <form onSubmit={addDocument} className="card space-y-3">
            <h2 className="text-lg font-semibold">Add / upload document text</h2>
            <input className="input" placeholder="Title" value={dTitle} onChange={(e) => setDTitle(e.target.value)} required />
            <input className="input" placeholder="Category" value={dCategory} onChange={(e) => setDCategory(e.target.value)} />
            <textarea className="textarea min-h-[180px]" placeholder="Paste document content..." value={dContent} onChange={(e) => setDContent(e.target.value)} required />
            <button type="submit" className="btn-primary">Save document</button>
            <p className="text-xs text-slate-500">Documents appear in Academic Platform → Learning materials (managed).</p>
          </form>
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Documents ({content.documents.length})</h2>
            {content.documents.map((d) => (
              <div key={d.id} className="card space-y-1">
                <div className="flex justify-between gap-2">
                  <p className="font-medium">{d.title}</p>
                  <button type="button" className="text-xs text-red-500" onClick={() => deleteItem("document", d.id)}>Delete</button>
                </div>
                <p className="text-xs text-slate-500">{d.category}</p>
                <p className="line-clamp-3 whitespace-pre-wrap text-sm text-slate-600">{d.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "files" && content && (
        <div className="space-y-4">
          <div className="card space-y-3">
            <h2 className="text-lg font-semibold">Upload files</h2>
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:text-white"
            />
            <p className="text-xs text-slate-500">Keep each file under ~1MB. Text/images work best.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {content.files.map((f) => (
              <div key={f.id} className="card space-y-2">
                <div className="flex justify-between gap-2">
                  <p className="font-medium">{f.name}</p>
                  <button type="button" className="text-xs text-red-500" onClick={() => deleteItem("file", f.id)}>Delete</button>
                </div>
                <p className="text-xs text-slate-500">{f.mime} · {f.uploadedBy}</p>
                {f.dataUrl?.startsWith("data:image") && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.dataUrl} alt={f.name} className="max-h-40 rounded-lg object-contain" />
                )}
                {f.dataUrl && (
                  <a href={f.dataUrl} download={f.name} className="text-xs text-brand-600 hover:underline">
                    Download
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "users" && user.role === "admin" && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Registered users & partners</h2>
          <p className="text-sm text-slate-600">
            Promote a registered user to <strong>partner</strong> so they can use Manager UI.
            Only you (admin) can change roles.
          </p>
          {users.length === 0 ? (
            <div className="card text-sm text-slate-500">No registered users yet. Share /register.</div>
          ) : (
            users.map((u) => (
              <div key={u.id} className="card flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{u.name}</p>
                  <p className="text-xs text-slate-500">role: {u.role}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" className="filter-pill" onClick={() => setRole(u.id, "user")}>User</button>
                  <button type="button" className="filter-pill" onClick={() => setRole(u.id, "partner")}>Partner</button>
                  <button type="button" className="filter-pill" onClick={() => setRole(u.id, "admin")}>Admin</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
