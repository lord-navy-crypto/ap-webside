"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  deletePrivateDoc,
  deletePrivateFile,
  deletePrivateFolder,
  getPrivateDocs,
  getPrivateFiles,
  getPrivateFolders,
  savePrivateDoc,
  savePrivateFile,
  savePrivateFolder,
  type PrivateDoc,
  type PrivateFile,
  type PrivateFolder,
} from "@/lib/storage";

const ROOT = "root";

type Props = {
  /** Default folder key when embedded on a page, e.g. concepts::AP Physics 1 */
  defaultFolder?: string;
  title?: string;
  compact?: boolean;
};

/**
 * Private file manager — IndexedDB only. Never sent to the server / public site.
 */
export default function PrivateFileManager({
  defaultFolder = ROOT,
  title = "My private files",
  compact = false,
}: Props) {
  const [folder, setFolder] = useState(defaultFolder);
  const [folders, setFolders] = useState<PrivateFolder[]>([]);
  const [files, setFiles] = useState<PrivateFile[]>([]);
  const [docs, setDocs] = useState<PrivateDoc[]>([]);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [mounted, setMounted] = useState(false);

  const [newFolderName, setNewFolderName] = useState("");
  const [docTitle, setDocTitle] = useState("");
  const [docContent, setDocContent] = useState("");
  const [fileNote, setFileNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setFolder(defaultFolder);
  }, [defaultFolder]);

  const refresh = useCallback(async () => {
    setError("");
    try {
      const [f, fl, d] = await Promise.all([
        getPrivateFolders(folder),
        getPrivateFiles(folder),
        getPrivateDocs(folder),
      ]);
      setFolders(f);
      setFiles(fl);
      setDocs(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load private files");
    }
  }, [folder]);

  useEffect(() => {
    if (mounted) void refresh();
  }, [mounted, refresh]);

  const crumbs = useMemo(() => {
    if (folder === ROOT) return [{ id: ROOT, label: "My Files" }];
    return [
      { id: ROOT, label: "My Files" },
      { id: folder, label: folder },
    ];
  }, [folder]);

  async function handleAddFolder(e: React.FormEvent) {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    setBusy(true);
    setError("");
    try {
      await savePrivateFolder({ title: newFolderName.trim(), parent: folder });
      setNewFolderName("");
      setNote("Private folder created (this device only).");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      if (file.size > 4_000_000) throw new Error("Keep private files under ~4MB");
      const dataUrl = await readFileAsDataURL(file);
      await savePrivateFile({
        name: file.name,
        mime: file.type || "application/octet-stream",
        dataUrl,
        note: fileNote.trim() || undefined,
        folder,
      });
      setFile(null);
      setFileNote("");
      setNote("Saved privately on this device. Not visible to other visitors.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleAddDoc(e: React.FormEvent) {
    e.preventDefault();
    if (!docTitle.trim() || !docContent.trim()) return;
    setBusy(true);
    setError("");
    try {
      await savePrivateDoc({
        title: docTitle.trim(),
        content: docContent.trim(),
        folder,
      });
      setDocTitle("");
      setDocContent("");
      setNote("Private note saved on this device only.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  if (!mounted) {
    return <div className="card text-sm text-slate-500">Loading private file manager…</div>;
  }

  return (
    <div className={`space-y-4 ${compact ? "" : ""}`}>
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-950">
        <strong>Private — this browser only.</strong> Files here are not uploaded to the public site
        and other visitors cannot see them. Clearing browser data will remove them.
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        {crumbs.map((c, i) => (
          <span key={c.id} className="flex items-center gap-2">
            {i > 0 && <span className="text-slate-300">/</span>}
            <button
              type="button"
              className="font-medium text-brand-700 hover:underline"
              onClick={() => setFolder(c.id)}
            >
              {c.label}
            </button>
          </span>
        ))}
        <button type="button" onClick={refresh} className="ml-auto text-xs text-brand-600 hover:underline">
          Refresh
        </button>
      </div>

      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <form onSubmit={handleAddFolder} className="card space-y-2">
            <h3 className="text-sm font-semibold">New private folder</h3>
            <input
              className="input"
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
            />
            <button type="submit" className="btn-secondary" disabled={busy || !newFolderName.trim()}>
              Create folder
            </button>
          </form>

          <form onSubmit={handleUpload} className="card space-y-2">
            <h3 className="text-sm font-semibold">Upload private file</h3>
            <input
              className="input"
              placeholder="Note (optional)"
              value={fileNote}
              onChange={(e) => setFileNote(e.target.value)}
            />
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:text-white"
              required
            />
            <button type="submit" className="btn-primary" disabled={busy || !file}>
              {busy ? "Saving…" : "Save privately"}
            </button>
          </form>

          <form onSubmit={handleAddDoc} className="card space-y-2">
            <h3 className="text-sm font-semibold">Private note / document</h3>
            <input
              className="input"
              placeholder="Title"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              required
            />
            <textarea
              className="textarea min-h-[100px]"
              placeholder="Content (stays on this device)"
              value={docContent}
              onChange={(e) => setDocContent(e.target.value)}
              required
            />
            <button type="submit" className="btn-secondary" disabled={busy}>
              Save private note
            </button>
          </form>
        </div>

        <div className="card max-h-[32rem] space-y-4 overflow-y-auto">
          {error && <p className="text-sm text-red-600">{error}</p>}
          {note && <p className="text-sm text-emerald-700">{note}</p>}

          <section className="space-y-2">
            <h3 className="text-sm font-semibold">Folders ({folders.length})</h3>
            {folders.length === 0 ? (
              <p className="text-sm text-slate-500">No subfolders here yet.</p>
            ) : (
              <ul className="space-y-2">
                {folders.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-amber-100 bg-amber-50/50 p-3"
                  >
                    <button
                      type="button"
                      className="text-left text-sm font-medium text-brand-800 hover:underline"
                      onClick={() => setFolder(f.id)}
                    >
                      📁 {f.title}
                    </button>
                    <button
                      type="button"
                      className="text-lg font-bold text-red-600"
                      onClick={async () => {
                        if (!confirm("Delete this private folder?")) return;
                        await deletePrivateFolder(f.id);
                        await refresh();
                      }}
                    >
                      −
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold">Files ({files.length})</h3>
            {files.length === 0 ? (
              <p className="text-sm text-slate-500">No private files in this folder.</p>
            ) : (
              <ul className="space-y-2">
                {files.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-start justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{f.name}</p>
                      <p className="text-xs text-slate-500">
                        {f.mime}
                        {f.note ? ` · ${f.note}` : ""}
                      </p>
                      {f.dataUrl?.startsWith("data:image") && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={f.dataUrl}
                          alt={f.name}
                          className="mt-2 max-h-28 w-full rounded-lg object-contain"
                        />
                      )}
                      {f.dataUrl && (
                        <a
                          href={f.dataUrl}
                          download={f.name}
                          className="mt-2 inline-block text-xs font-medium text-brand-600 hover:underline"
                        >
                          Download
                        </a>
                      )}
                    </div>
                    <button
                      type="button"
                      className="text-lg font-bold text-red-600"
                      onClick={async () => {
                        if (!confirm("Delete this private file?")) return;
                        await deletePrivateFile(f.id);
                        await refresh();
                      }}
                    >
                      −
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-2 border-t border-slate-100 pt-3">
            <h3 className="text-sm font-semibold">Notes ({docs.length})</h3>
            {docs.length === 0 ? (
              <p className="text-sm text-slate-500">No private notes here.</p>
            ) : (
              <ul className="space-y-2">
                {docs.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-start justify-between gap-2 rounded-xl border border-slate-100 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{d.title}</p>
                      <p className="mt-1 line-clamp-4 whitespace-pre-wrap text-sm text-slate-600">
                        {d.content}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="text-lg font-bold text-red-600"
                      onClick={async () => {
                        if (!confirm("Delete this private note?")) return;
                        await deletePrivateDoc(d.id);
                        await refresh();
                      }}
                    >
                      −
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
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
