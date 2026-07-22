"use client";

import { useCallback, useEffect, useState } from "react";
import ChangePanel from "@/components/ChangePanel";
import RichContent from "@/components/RichContent";
import type {
  ManagedContent,
  ManagedDocument,
  ManagedFile,
  ManagedFolder,
} from "@/lib/managed-store";

type Props = {
  alsoShow?: Array<"concept" | "formula" | "document" | "member" | "folder">;
  defaultSubject?: string;
  /** Area key for new folders, e.g. concepts | formulas | code | academic */
  folderArea?: string;
  title?: string;
};

export default function UploadAndShow({
  alsoShow = [],
  defaultSubject,
  folderArea = "general",
  title = "Files on this page",
}: Props) {
  const [files, setFiles] = useState<ManagedFile[]>([]);
  const [documents, setDocuments] = useState<ManagedDocument[]>([]);
  const [folders, setFolders] = useState<ManagedFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [changeCode, setChangeCode] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const applyContent = useCallback((data: Partial<ManagedContent> | null) => {
    if (!data) return;
    setFiles(Array.isArray(data.files) ? data.files : []);
    setDocuments(Array.isArray(data.documents) ? data.documents : []);
    setFolders(Array.isArray(data.folders) ? data.folders : []);
  }, []);

  const refresh = useCallback(async () => {
    setError("");
    try {
      const res = await fetch("/api/edit", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load files");
      applyContent(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load files");
    } finally {
      setLoading(false);
    }
  }, [applyContent]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const onSaved = (content?: unknown) => {
    if (content) applyContent(content as ManagedContent);
    else void refresh();
  };

  async function handleDelete(target: "file" | "document" | "folder", id: string) {
    if (!changeCode.trim()) {
      setError("Enter a change code below, then press − to delete.");
      return;
    }
    if (!confirm("Delete this item?")) return;
    setDeletingId(id);
    setError("");
    try {
      const res = await fetch("/api/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          target,
          id,
          changeCode: changeCode.trim(),
          githubToken: githubToken.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      applyContent(data.content);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  const areaFolders = folders.filter((f) => f.area === folderArea || folderArea === "general");

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Add / upload / folder
        </h2>
        <div className="flex flex-col gap-3">
          <ChangePanel mode="file" label="+ Upload file" onSaved={onSaved} />
          {alsoShow.includes("document") && (
            <ChangePanel mode="document" label="+ Add document" onSaved={onSaved} />
          )}
          {alsoShow.includes("concept") && (
            <ChangePanel
              mode="concept"
              label="+ Add concept"
              defaultSubject={defaultSubject}
              onSaved={onSaved}
            />
          )}
          {alsoShow.includes("formula") && (
            <ChangePanel
              mode="formula"
              label="+ Add formula"
              defaultSubject={defaultSubject}
              onSaved={onSaved}
            />
          )}
          {alsoShow.includes("member") && (
            <ChangePanel mode="member" label="+ Add member" onSaved={onSaved} />
          )}
          {alsoShow.includes("folder") && (
            <ChangePanel
              mode="folder"
              label="+ Add folder"
              folderArea={folderArea}
              onSaved={onSaved}
            />
          )}
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
          <label className="block text-xs font-medium text-slate-600">
            Change code (needed to delete with −)
          </label>
          <input
            type="password"
            className="input"
            placeholder="Content or master change code"
            value={changeCode}
            onChange={(e) => setChangeCode(e.target.value)}
          />
          <details className="text-xs text-slate-500">
            <summary className="cursor-pointer">GitHub token (optional)</summary>
            <input
              type="password"
              className="input mt-2"
              placeholder="ghp_... if not set on Vercel"
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
            />
          </details>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            {title}
          </h2>
          <button type="button" onClick={refresh} className="text-xs text-brand-600 hover:underline">
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="card text-sm text-slate-500">Loading files...</div>
        ) : (
          <div className="card max-h-[22rem] space-y-4 overflow-y-auto overscroll-contain pr-1">
            {error && <p className="text-sm text-red-600 whitespace-pre-wrap">{error}</p>}

            {areaFolders.length > 0 && (
              <section className="space-y-2">
                <h3 className="text-sm font-semibold">Folders ({areaFolders.length})</h3>
                <ul className="space-y-2">
                  {areaFolders.map((f) => (
                    <li
                      key={f.id}
                      className="flex items-start justify-between gap-2 rounded-xl border border-amber-100 bg-amber-50/60 p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">📁 {f.title}</p>
                        {f.note && <p className="text-xs text-slate-500">{f.note}</p>}
                      </div>
                      <button
                        type="button"
                        title="Delete folder"
                        disabled={deletingId === f.id}
                        onClick={() => handleDelete("folder", f.id)}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-lg font-bold text-red-600 shadow-sm hover:bg-red-50"
                      >
                        −
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-800">
                Uploaded files ({files.length})
              </h3>
              {files.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No files yet. Upload on the left — they appear here after save. Scroll if the list is long.
                </p>
              ) : (
                <ul className="space-y-3">
                  {files.map((f) => (
                    <li
                      key={f.id}
                      className="flex items-start justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900">{f.name}</p>
                        <p className="text-xs text-slate-500">
                          {f.mime}
                          {f.note ? ` · ${f.note}` : ""}
                        </p>
                        {f.dataUrl?.startsWith("data:image") && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={f.dataUrl}
                            alt={f.name}
                            className="mt-2 max-h-32 w-full rounded-lg object-contain"
                          />
                        )}
                        {f.dataUrl && (
                          <a
                            href={f.dataUrl}
                            download={f.name}
                            className="mt-2 inline-block text-xs font-medium text-brand-600 hover:underline"
                          >
                            Open / download
                          </a>
                        )}
                      </div>
                      <button
                        type="button"
                        title="Delete file"
                        disabled={deletingId === f.id}
                        onClick={() => handleDelete("file", f.id)}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-lg font-bold text-red-600 shadow-sm hover:bg-red-50"
                      >
                        −
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {documents.length > 0 && (
              <section className="space-y-2 border-t border-slate-100 pt-3">
                <h3 className="text-sm font-semibold text-slate-800">
                  Documents ({documents.length})
                </h3>
                <ul className="space-y-2">
                  {documents.map((d) => (
                    <li
                      key={d.id}
                      className="flex items-start justify-between gap-2 rounded-xl border border-slate-100 bg-white p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{d.title}</p>
                        <p className="text-xs text-slate-500">{d.category}</p>
                        <RichContent clampLines={4} className="mt-1 text-sm text-slate-600">
                          {d.content}
                        </RichContent>
                      </div>
                      <button
                        type="button"
                        title="Delete document"
                        disabled={deletingId === d.id}
                        onClick={() => handleDelete("document", d.id)}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-50 text-lg font-bold text-red-600 hover:bg-red-50"
                      >
                        −
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
