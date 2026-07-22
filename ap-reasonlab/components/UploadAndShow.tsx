"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ChangePanel from "@/components/ChangePanel";
import RichContent from "@/components/RichContent";
import type {
  ManagedContent,
  ManagedDocument,
  ManagedFile,
  ManagedFolder,
} from "@/lib/managed-store";
import type { Concept, Formula } from "@/lib/types";
import {
  ROOT_SPACE,
  folderSpaceId,
  matchesSpace,
  normalizeSpace,
  spaceHref,
  spaceLabel,
} from "@/lib/storage-space";

type Props = {
  alsoShow?: Array<"concept" | "formula" | "document" | "member" | "folder">;
  defaultSubject?: string;
  /** Page area key, e.g. concepts | formulas | code */
  folderArea?: string;
  /** Isolated storage space for this folder / panel */
  spaceKey?: string;
  /** Base path for opening nested folders, e.g. /concepts */
  spaceBasePath?: string;
  title?: string;
  /** Keep uploads collapsed so study content stays first */
  collapsedByDefault?: boolean;
};

/**
 * Per-area / per-folder storage panel.
 * Each area + folder space is its own bucket — files do not mix across panels.
 * This is shared site content (change code to edit), not per-user private storage.
 */
export default function UploadAndShow({
  alsoShow = [],
  defaultSubject,
  folderArea = "general",
  spaceKey = ROOT_SPACE,
  spaceBasePath,
  title = "This folder’s storage",
  collapsedByDefault = false,
}: Props) {
  const [allFiles, setAllFiles] = useState<ManagedFile[]>([]);
  const [allDocuments, setAllDocuments] = useState<ManagedDocument[]>([]);
  const [allFolders, setAllFolders] = useState<ManagedFolder[]>([]);
  const [allConcepts, setAllConcepts] = useState<Concept[]>([]);
  const [allFormulas, setAllFormulas] = useState<Formula[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [changeCode, setChangeCode] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(!collapsedByDefault);

  const scopedSpace = normalizeSpace(spaceKey);
  const subjectForForms =
    defaultSubject ||
    (scopedSpace !== ROOT_SPACE && !scopedSpace.startsWith("folder:")
      ? scopedSpace
      : "AP Physics 1");

  const applyContent = useCallback((data: Partial<ManagedContent> | null) => {
    if (!data) return;
    setAllFiles(Array.isArray(data.files) ? data.files : []);
    setAllDocuments(Array.isArray(data.documents) ? data.documents : []);
    setAllFolders(Array.isArray(data.folders) ? data.folders : []);
    setAllConcepts(Array.isArray(data.concepts) ? data.concepts : []);
    setAllFormulas(Array.isArray(data.formulas) ? data.formulas : []);
  }, []);

  const refresh = useCallback(async () => {
    setError("");
    try {
      const params = new URLSearchParams({
        area: folderArea,
        space: scopedSpace,
      });
      const res = await fetch(`/api/edit?${params}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load files");
      applyContent(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load files");
    } finally {
      setLoading(false);
    }
  }, [applyContent, folderArea, scopedSpace]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const onSaved = (content?: unknown) => {
    if (content) applyContent(content as ManagedContent);
    else void refresh();
  };

  async function handleDelete(
    target: "file" | "document" | "folder" | "concept" | "formula",
    id: string
  ) {
    if (!changeCode.trim()) {
      setError("Enter a change code below, then press − to delete.");
      return;
    }
    if (!confirm("Delete this item from this folder’s storage?")) return;
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

  const folders = useMemo(
    () =>
      allFolders.filter(
        (f) => f.area === folderArea && normalizeSpace(f.space) === scopedSpace
      ),
    [allFolders, folderArea, scopedSpace]
  );

  const files = useMemo(
    () => allFiles.filter((f) => matchesSpace(f, folderArea, scopedSpace)),
    [allFiles, folderArea, scopedSpace]
  );

  const documents = useMemo(
    () => allDocuments.filter((d) => matchesSpace(d, folderArea, scopedSpace)),
    [allDocuments, folderArea, scopedSpace]
  );

  const conceptsHere = useMemo(() => {
    if (!alsoShow.includes("concept")) return [];
    if (scopedSpace.startsWith("folder:")) {
      return allConcepts.filter(
        (c) => c.subject === subjectForForms || c.subject === scopedSpace
      );
    }
    if (scopedSpace === ROOT_SPACE) {
      return allConcepts.filter((c) => !c.subject || c.subject === ROOT_SPACE);
    }
    return allConcepts.filter((c) => c.subject === scopedSpace);
  }, [allConcepts, alsoShow, scopedSpace, subjectForForms]);

  const formulasHere = useMemo(() => {
    if (!alsoShow.includes("formula")) return [];
    if (scopedSpace.startsWith("folder:")) {
      return allFormulas.filter(
        (f) => f.subject === subjectForForms || f.subject === scopedSpace
      );
    }
    if (scopedSpace === ROOT_SPACE) return [];
    return allFormulas.filter((f) => f.subject === scopedSpace);
  }, [allFormulas, alsoShow, scopedSpace, subjectForForms]);

  const panelTitle = `${title} · ${spaceLabel(
    scopedSpace,
    folders.find((f) => folderSpaceId(f.id) === scopedSpace)?.title
  )}`;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-slate-800">{panelTitle}</p>
          <p className="text-xs text-slate-500">
            Uploads stay in this panel only. Open when you need to add or manage files.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="btn-secondary"
          aria-expanded={expanded}
        >
          {expanded ? "Hide storage" : "Show storage & uploads"}
        </button>
      </div>

      {expanded && (
        <>
          <div className="rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 text-sm text-brand-950">
            <strong>Separate storage for this panel.</strong> Files and notes here belong only to{" "}
            <span className="font-semibold">{folderArea}</span> /{" "}
            <span className="font-semibold">{spaceLabel(scopedSpace)}</span>. They do not appear in
            other areas or other subject folders.
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Add / upload in this folder only
              </h2>
              <div className="flex flex-col gap-3">
                <ChangePanel
                  mode="file"
                  label="+ Upload file"
                  folderArea={folderArea}
                  spaceKey={scopedSpace}
                  onSaved={onSaved}
                />
                {alsoShow.includes("document") && (
                  <ChangePanel
                    mode="document"
                    label="+ Add document"
                    folderArea={folderArea}
                    spaceKey={scopedSpace}
                    onSaved={onSaved}
                  />
                )}
                {alsoShow.includes("concept") && (
                  <ChangePanel
                    mode="concept"
                    label="+ Add concept (AI sort)"
                    defaultSubject={subjectForForms}
                    folderArea={folderArea}
                    spaceKey={scopedSpace}
                    onSaved={onSaved}
                  />
                )}
                {alsoShow.includes("formula") && (
                  <ChangePanel
                    mode="formula"
                    label="+ Add formula"
                    defaultSubject={subjectForForms}
                    folderArea={folderArea}
                    spaceKey={scopedSpace}
                    onSaved={onSaved}
                  />
                )}
                {alsoShow.includes("member") && (
                  <ChangePanel mode="member" label="+ Add member" onSaved={onSaved} />
                )}
                {alsoShow.includes("folder") && (
                  <ChangePanel
                    mode="folder"
                    label="+ Add nested folder"
                    folderArea={folderArea}
                    spaceKey={scopedSpace}
                    onSaved={onSaved}
                  />
                )}
              </div>
              <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
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
                  {panelTitle}
                </h2>
                <button
                  type="button"
                  onClick={refresh}
                  className="text-xs text-brand-600 hover:underline"
                >
                  Refresh
                </button>
              </div>

              {loading ? (
                <div className="card text-sm text-slate-500">Loading this folder…</div>
              ) : (
                <div className="card max-h-[28rem] space-y-4 overflow-y-auto overscroll-contain pr-1">
                  {error && <p className="whitespace-pre-wrap text-sm text-red-600">{error}</p>}

                  <p className="text-xs text-slate-500">
                    Only items saved into this area + folder. Other panels keep their own lists.
                  </p>

                  {folders.length > 0 && (
                    <section className="space-y-2">
                      <h3 className="text-sm font-semibold">Nested folders ({folders.length})</h3>
                      <ul className="space-y-2">
                        {folders.map((f) => (
                          <li
                            key={f.id}
                            className="flex items-start justify-between gap-2 rounded-xl border border-amber-100 bg-amber-50/60 p-3"
                          >
                            <div className="min-w-0">
                              {spaceBasePath ? (
                                <Link
                                  href={spaceHref(spaceBasePath, folderSpaceId(f.id))}
                                  className="truncate text-sm font-medium text-brand-800 hover:underline"
                                >
                                  📁 {f.title} → open its storage
                                </Link>
                              ) : (
                                <p className="truncate text-sm font-medium">📁 {f.title}</p>
                              )}
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

                  {conceptsHere.length > 0 && (
                    <section className="space-y-2">
                      <h3 className="text-sm font-semibold">
                        Concepts in this folder ({conceptsHere.length})
                      </h3>
                      <ul className="space-y-2">
                        {conceptsHere.map((c) => (
                          <li
                            key={c.id}
                            className="flex items-start justify-between gap-2 rounded-xl border border-brand-100 bg-brand-50/40 p-3"
                          >
                            <div className="min-w-0">
                              <Link
                                href={`/concepts/${c.id}`}
                                className="text-sm font-medium text-brand-800 hover:underline"
                              >
                                {c.title}
                              </Link>
                              <p className="mt-1 line-clamp-2 text-xs text-slate-600">{c.summary}</p>
                            </div>
                            <button
                              type="button"
                              title="Delete concept"
                              disabled={deletingId === c.id}
                              onClick={() => handleDelete("concept", c.id)}
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-lg font-bold text-red-600 shadow-sm hover:bg-red-50"
                            >
                              −
                            </button>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {formulasHere.length > 0 && (
                    <section className="space-y-2">
                      <h3 className="text-sm font-semibold">
                        Formulas in this folder ({formulasHere.length})
                      </h3>
                      <ul className="space-y-2">
                        {formulasHere.map((f) => (
                          <li
                            key={f.id}
                            className="flex items-start justify-between gap-2 rounded-xl border border-slate-100 bg-white p-3"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium">{f.name}</p>
                              <p className="font-mono text-xs text-slate-600">{f.expression}</p>
                            </div>
                            <button
                              type="button"
                              title="Delete formula"
                              disabled={deletingId === f.id}
                              onClick={() => handleDelete("formula", f.id)}
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-50 text-lg font-bold text-red-600 hover:bg-red-50"
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
                        No files in this folder yet. Upload on the left — they stay in this panel only.
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
        </>
      )}
    </div>
  );
}
