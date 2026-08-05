"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ChangePanel from "@/components/ChangePanel";
import MediaFinderBrowser, { type MediaRow } from "@/components/MediaFinderBrowser";
import MediaPreviewPane from "@/components/MediaPreviewPane";
import ResourceEditor from "@/components/ResourceEditor";
import { useEditorMode } from "@/components/EditorModeProvider";
import type {
  ManagedContent,
  ManagedDocument,
  ManagedFile,
  ManagedFolder,
} from "@/lib/managed-types";
import { managedSubjectNames } from "@/lib/managed-types";
import { isImageFile } from "@/lib/media-files";
import { readResponseJson } from "@/lib/safe-json";
import {
  ROOT_SPACE,
  folderSpaceId,
  matchesSpace,
  normalizeSpace,
  spaceHref,
  spaceLabel,
} from "@/lib/storage-space";

type Props = {
  alsoShow?: Array<
    "concept" | "topic" | "formula" | "document" | "member" | "folder" | "subject" | "questionnaire"
  >;
  defaultSubject?: string;
  /** Page area key, e.g. concepts | formulas | code */
  folderArea?: string;
  /** Isolated storage space for this folder / panel */
  spaceKey?: string;
  /** Base path for opening nested folders, e.g. /concepts */
  spaceBasePath?: string;
  title?: string;
  /** Called when managed subjects list changes (parent can refresh folder grids) */
  onSubjectsChange?: (subjects: string[]) => void;
  /** Called when managed questionnaires change */
  onQuestionnairesChange?: (quizzes: unknown[]) => void;
  /** Keep uploads collapsed so study content stays first */
  collapsedByDefault?: boolean;
  /** Anonymous users may add to Sharing Materials; deletion still requires a code. */
  allowPublicContributions?: boolean;
  /** Files/images/documents only — no concept/formula/practice lists or add buttons. */
  mediaOnly?: boolean;
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
  onSubjectsChange,
  onQuestionnairesChange,
  collapsedByDefault = false,
  allowPublicContributions = false,
  mediaOnly = false,
}: Props) {
  const { active: editMode, unlocked } = useEditorMode();
  const [allFiles, setAllFiles] = useState<ManagedFile[]>([]);
  const [allDocuments, setAllDocuments] = useState<ManagedDocument[]>([]);
  const [allFolders, setAllFolders] = useState<ManagedFolder[]>([]);
  const [allSubjects, setAllSubjects] = useState<string[]>([]);
  const [allQuizzes, setAllQuizzes] = useState<
    Array<{ id: string; title: string; subject: string; description?: string; items?: unknown[] }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [changeCode, setChangeCode] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(!collapsedByDefault);
  const [previewSelection, setPreviewSelection] = useState<MediaRow | null>(null);
  const [baseUpdatedAt, setBaseUpdatedAt] = useState<number | undefined>(undefined);

  const scopedSpace = normalizeSpace(spaceKey);
  const subjectForForms =
    defaultSubject ||
    (scopedSpace !== ROOT_SPACE && !scopedSpace.startsWith("folder:")
      ? scopedSpace
      : "AP Physics 1");

  const applyContent = useCallback(
    (data: Partial<ManagedContent> | null) => {
      if (!data) return;
      setAllFiles(Array.isArray(data.files) ? data.files : []);
      setAllDocuments(Array.isArray(data.documents) ? data.documents : []);
      setAllFolders(Array.isArray(data.folders) ? data.folders : []);
      if (typeof data.updatedAt === "number" && data.updatedAt > 0) {
        setBaseUpdatedAt(data.updatedAt);
      }
      const subjects = managedSubjectNames(data.subjects);
      setAllSubjects(subjects);
      onSubjectsChange?.(subjects);
      // Only update quizzes when the payload includes them (media view omits this field).
      if (Array.isArray(data.questionnaires)) {
        const quizzes = data.questionnaires;
        setAllQuizzes(quizzes as typeof allQuizzes);
        onQuestionnairesChange?.(quizzes);
      }
    },
    [onQuestionnairesChange, onSubjectsChange]
  );

  const refresh = useCallback(async () => {
    setError("");
    try {
      const params = new URLSearchParams({
        area: folderArea,
        space: scopedSpace,
      });
      // Lightweight payload for file boxes. Practice pages that sync quizzes keep the full scope.
      if (!onQuestionnairesChange) {
        params.set("view", "media");
      }
      const res = await fetch(`/api/edit?${params}`, {
        cache: "no-store",
        credentials: "include",
      });
      const parsed = await readResponseJson<ManagedContent & { error?: string }>(res);
      if (!parsed.ok) throw new Error(parsed.error);
      if (!res.ok) throw new Error(parsed.data.error || "Failed to load files");
      applyContent(parsed.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load files");
    } finally {
      setLoading(false);
    }
  }, [applyContent, folderArea, onQuestionnairesChange, scopedSpace]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const canAdd = editMode || unlocked || allowPublicContributions;

  useEffect(() => {
    if (editMode || unlocked) setExpanded(true);
  }, [editMode, unlocked]);

  const onSaved = (content?: unknown) => {
    // Prefer the slim POST payload when present, then re-load metadata-only list.
    if (content && typeof content === "object") {
      applyContent(content as Partial<ManagedContent>);
    }
    void refresh();
  };

  async function downloadManagedFile(file: ManagedFile) {
    try {
      if (file.dataUrl) {
        const link = document.createElement("a");
        link.href = file.dataUrl;
        link.download = file.name;
        link.target = "_blank";
        link.rel = "noreferrer";
        link.click();
        return;
      }
      const res = await fetch(`/api/edit?fileId=${encodeURIComponent(file.id)}`, {
        cache: "no-store",
      });
      const parsed = await readResponseJson<{ file?: ManagedFile; error?: string }>(res);
      if (!parsed.ok) throw new Error(parsed.error);
      const dataUrl = parsed.data.file?.dataUrl;
      if (!res.ok || !dataUrl) throw new Error(parsed.data.error || "Download unavailable");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = file.name;
      link.target = "_blank";
      link.rel = "noreferrer";
      link.click();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed");
    }
  }

  function downloadDocument(doc: ManagedDocument) {
    const safeName = `${doc.title.replace(/[^\w\s.-]+/g, "_").trim() || "document"}.md`;
    const blob = new Blob([doc.content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = safeName;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function downloadMediaRow(row: MediaRow) {
    if (row.kind === "file") {
      await downloadManagedFile(row.item);
      return;
    }
    downloadDocument(row.item);
  }

  async function handleDelete(
    target:
      | "file"
      | "document"
      | "folder"
      | "concept"
      | "topic"
      | "formula"
      | "subject"
      | "questionnaire",
    id: string
  ) {
    let code = changeCode.trim();
    if (!unlocked && !code) {
      const prompted = window.prompt("Enter a content or master change code to delete:");
      if (!prompted) return;
      code = prompted.trim();
      setChangeCode(code);
    }
    if (!confirm("Delete this item from this folder’s storage?")) return;
    setDeletingId(id);
    setError("");
    try {
      const res = await fetch("/api/edit", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          target,
          id,
          changeCode: code || undefined,
          githubToken: githubToken.trim() || undefined,
          baseUpdatedAt: baseUpdatedAt || undefined,
        }),
      });
      const parsed = await readResponseJson<{ error?: string; content?: ManagedContent }>(res);
      if (!parsed.ok) throw new Error(parsed.error);
      if (!res.ok) throw new Error(parsed.data.error || "Delete failed");
      if (previewSelection?.item.id === id) setPreviewSelection(null);
      if (parsed.data.content) applyContent(parsed.data.content);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  const folders = useMemo(
    () =>
      allFolders
        .filter((f) => f.area === folderArea && normalizeSpace(f.space) === scopedSpace)
        .slice()
        .sort((a, b) =>
          a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: "base" })
        ),
    [allFolders, folderArea, scopedSpace]
  );

  const files = useMemo(
    () =>
      allFiles
        .filter((f) => matchesSpace(f, folderArea, scopedSpace))
        .slice()
        .sort((a, b) => {
          const byName = a.name.localeCompare(b.name, undefined, {
            numeric: true,
            sensitivity: "base",
          });
          if (byName !== 0) return byName;
          return (a.uploadedAt || 0) - (b.uploadedAt || 0);
        }),
    [allFiles, folderArea, scopedSpace]
  );

  const images = useMemo(() => files.filter((f) => isImageFile(f)), [files]);
  const otherFiles = useMemo(() => files.filter((f) => !isImageFile(f)), [files]);

  const documents = useMemo(
    () => allDocuments.filter((d) => matchesSpace(d, folderArea, scopedSpace)),
    [allDocuments, folderArea, scopedSpace]
  );

  const imageRows = useMemo<MediaRow[]>(
    () =>
      images.map((file) => ({
        kind: "file" as const,
        item: file,
        timestamp: file.uploadedAt || 0,
        title: file.name,
        subtitle: file.note || "Picture",
        searchFields: [file.name, file.note, file.mime].filter(Boolean) as string[],
      })),
    [images]
  );

  const fileRows = useMemo<MediaRow[]>(
    () =>
      otherFiles.map((file) => ({
        kind: "file" as const,
        item: file,
        timestamp: file.uploadedAt || 0,
        title: file.name,
        subtitle: file.mime || "file",
        searchFields: [file.name, file.note, file.mime].filter(Boolean) as string[],
      })),
    [otherFiles]
  );

  const documentRows = useMemo<MediaRow[]>(
    () =>
      documents.map((doc) => ({
        kind: "document" as const,
        item: doc,
        timestamp: doc.updatedAt || 0,
        title: doc.title,
        subtitle: doc.category || "Document",
        searchFields: [doc.title, doc.category, doc.content],
      })),
    [documents]
  );

  const panelTitle = `${title} · ${spaceLabel(
    scopedSpace,
    folders.find((f) => folderSpaceId(f.id) === scopedSpace)?.title
  )}`;

  const uploadExtras = mediaOnly
    ? alsoShow.filter((key) => key === "document" || key === "folder")
    : alsoShow;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{panelTitle}</p>
          <p className="text-xs text-slate-500">
            {images.length} image{images.length === 1 ? "" : "s"}
            {otherFiles.length
              ? ` · ${otherFiles.length} file${otherFiles.length === 1 ? "" : "s"}`
              : ""}
            {folders.length ? ` · ${folders.length} folder${folders.length === 1 ? "" : "s"}` : ""}
            {documents.length ? ` · ${documents.length} doc${documents.length === 1 ? "" : "s"}` : ""}
            {" · 3 columns · newest first · download"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={refresh} className="text-xs text-brand-700 hover:underline">
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="btn-secondary text-xs"
            aria-expanded={expanded}
          >
            {expanded ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      {expanded && (
        <>
      {error ? <p className="mb-2 whitespace-pre-wrap text-sm text-red-600">{error}</p> : null}

      <div className="space-y-4">
        {canAdd ? (
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Upload &amp; add
            </h2>
            <div className="flex flex-wrap gap-2">
              {uploadExtras.includes("subject") && (
                <ChangePanel
                  mode="subject"
                  label="+ Add subject folder"
                  folderArea={folderArea}
                  spaceKey={scopedSpace}
                  baseUpdatedAt={baseUpdatedAt}
                  onSaved={onSaved}
                />
              )}
              <ChangePanel
                mode="file"
                label="+ Upload files"
                folderArea={folderArea}
                spaceKey={scopedSpace}
                baseUpdatedAt={baseUpdatedAt}
                onSaved={onSaved}
                allowPublicContribution={allowPublicContributions}
              />
              <ChangePanel
                mode="file"
                label="+ Upload images"
                fileAccept="image/*"
                folderArea={folderArea}
                spaceKey={scopedSpace}
                baseUpdatedAt={baseUpdatedAt}
                onSaved={onSaved}
                allowPublicContribution={allowPublicContributions}
              />
              {uploadExtras.includes("document") && (
                <ChangePanel
                  mode="document"
                  label="+ Add documents"
                  folderArea={folderArea}
                  spaceKey={scopedSpace}
                  baseUpdatedAt={baseUpdatedAt}
                  onSaved={onSaved}
                  allowPublicContribution={allowPublicContributions}
                />
              )}
              {uploadExtras.includes("topic") && (
                <ChangePanel
                  mode="topic"
                  label="+ Add topics"
                  defaultSubject={subjectForForms}
                  folderArea={folderArea}
                  spaceKey={scopedSpace}
                  baseUpdatedAt={baseUpdatedAt}
                  onSaved={onSaved}
                />
              )}
              {uploadExtras.includes("concept") && (
                <ChangePanel
                  mode="concept"
                  label="+ Add concepts"
                  defaultSubject={subjectForForms}
                  folderArea={folderArea}
                  spaceKey={scopedSpace}
                  baseUpdatedAt={baseUpdatedAt}
                  onSaved={onSaved}
                />
              )}
              {uploadExtras.includes("formula") && (
                <ChangePanel
                  mode="formula"
                  label="+ Add formulas"
                  defaultSubject={subjectForForms}
                  folderArea={folderArea}
                  spaceKey={scopedSpace}
                  baseUpdatedAt={baseUpdatedAt}
                  onSaved={onSaved}
                />
              )}
              {uploadExtras.includes("questionnaire") && (
                <ChangePanel
                  mode="questionnaire"
                  label="+ Add generated practice set"
                  defaultSubject={subjectForForms}
                  folderArea={folderArea}
                  spaceKey={scopedSpace}
                  baseUpdatedAt={baseUpdatedAt}
                  onSaved={onSaved}
                />
              )}
              {uploadExtras.includes("member") && (
                <ChangePanel
                  mode="member"
                  label="+ Add member"
                  baseUpdatedAt={baseUpdatedAt}
                  onSaved={onSaved}
                />
              )}
              <ChangePanel
                mode="folder"
                label="+ Add file folders"
                folderArea={folderArea}
                spaceKey={scopedSpace}
                baseUpdatedAt={baseUpdatedAt}
                onSaved={onSaved}
                allowPublicContribution={allowPublicContributions}
              />
            </div>
            {(editMode || unlocked) && (
              <div className="flex flex-wrap items-end gap-3 border-t border-slate-200 pt-3">
                {unlocked ? (
                  <p className="text-xs text-emerald-800">
                    Editor unlocked — delete uses your session.
                  </p>
                ) : (
                  <label className="block min-w-[12rem] flex-1 text-xs font-medium text-slate-600">
                    Change code (needed to Delete — or enter when prompted)
                    <input
                      type="password"
                      className="input mt-1"
                      placeholder="Content or master change code"
                      value={changeCode}
                      onChange={(e) => setChangeCode(e.target.value)}
                    />
                  </label>
                )}
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
            )}
            {allSubjects.length > 0 && uploadExtras.includes("subject") ? (
              <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-2 text-xs text-emerald-900">
                Custom subjects saved: {allSubjects.join(" · ")}
              </div>
            ) : null}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-500">
            Loading files…
          </div>
        ) : (
          <div className="space-y-4">
            {folders.length > 0 ? (
              <section className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Folders
                </h3>
                <ul className="flex flex-col gap-2">
                  {folders.map((f) => (
                    <li key={f.id}>
                      <div className="flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50/70 px-3 py-2.5 transition hover:bg-amber-50">
                        <span
                          className="relative flex h-10 w-10 shrink-0 items-end justify-center pb-1"
                          aria-hidden
                        >
                          <span className="absolute left-1.5 top-1.5 h-2 w-4 rounded-t-sm bg-amber-300" />
                          <span className="h-6 w-8 rounded-md bg-gradient-to-b from-amber-300 to-amber-500 shadow-sm" />
                        </span>
                        <div className="min-w-0 flex-1">
                          {spaceBasePath ? (
                            <Link
                              href={spaceHref(spaceBasePath, folderSpaceId(f.id))}
                              className="block truncate text-sm font-semibold text-slate-900 hover:text-brand-700"
                            >
                              {f.title}
                            </Link>
                          ) : (
                            <p className="truncate text-sm font-semibold text-slate-900">{f.title}</p>
                          )}
                          {f.note ? (
                            <p className="truncate text-[11px] text-slate-500">{f.note}</p>
                          ) : (
                            <p className="text-[11px] text-slate-400">Open folder</p>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          {editMode ? (
                            <ResourceEditor
                              target="folder"
                              item={f}
                              baseUpdatedAt={baseUpdatedAt}
                              onSaved={(content) => applyContent(content as ManagedContent)}
                            />
                          ) : null}
                          <button
                            type="button"
                            title="Delete folder"
                            disabled={deletingId === f.id}
                            onClick={() => void handleDelete("folder", f.id)}
                            className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-700 hover:bg-red-100"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {/* Three vertical columns: Images | Files | Documents */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:items-stretch">
              <MediaFinderBrowser
                sectionTitle="Images"
                sectionHint="Fixed height · scroll inside this column"
                emptyMessage="No images yet. Use + Upload images."
                rows={imageRows}
                variant="image"
                onDownload={downloadMediaRow}
                editMode={editMode}
                showDelete
                deletingId={deletingId}
                selectedId={previewSelection?.item.id ?? null}
                onSelect={(row) => {
                  setPreviewSelection(row);
                  window.requestAnimationFrame(() => {
                    document.getElementById("media-preview")?.scrollIntoView({
                      behavior: "smooth",
                      block: "nearest",
                    });
                  });
                }}
                onDelete={(row) => {
                  if (row.kind === "file") void handleDelete("file", row.item.id);
                }}
                onContentSaved={(content) => {
                  applyContent(content);
                  void refresh();
                }}
                baseUpdatedAt={baseUpdatedAt}
              />

              <MediaFinderBrowser
                sectionTitle="Files"
                sectionHint="Fixed height · scroll inside this column"
                emptyMessage="No files yet. Use + Upload files."
                rows={fileRows}
                variant="file"
                onDownload={downloadMediaRow}
                editMode={editMode}
                showDelete
                deletingId={deletingId}
                selectedId={previewSelection?.item.id ?? null}
                onSelect={(row) => {
                  setPreviewSelection(row);
                  window.requestAnimationFrame(() => {
                    document.getElementById("media-preview")?.scrollIntoView({
                      behavior: "smooth",
                      block: "nearest",
                    });
                  });
                }}
                onDelete={(row) => {
                  if (row.kind === "file") void handleDelete("file", row.item.id);
                }}
                onContentSaved={(content) => {
                  applyContent(content);
                  void refresh();
                }}
                baseUpdatedAt={baseUpdatedAt}
              />

              <MediaFinderBrowser
                sectionTitle="Documents"
                sectionHint="Fixed height · scroll inside this column"
                emptyMessage="No documents yet. Use + Add documents."
                rows={documentRows}
                variant="document"
                onDownload={downloadMediaRow}
                editMode={editMode}
                showDelete
                deletingId={deletingId}
                selectedId={previewSelection?.item.id ?? null}
                onSelect={(row) => {
                  setPreviewSelection(row);
                  window.requestAnimationFrame(() => {
                    document.getElementById("media-preview")?.scrollIntoView({
                      behavior: "smooth",
                      block: "nearest",
                    });
                  });
                }}
                onDelete={(row) => {
                  if (row.kind === "document") void handleDelete("document", row.item.id);
                }}
                onContentSaved={(content) => applyContent(content)}
              />
            </div>

            <MediaPreviewPane
              selection={previewSelection}
              onClose={() => setPreviewSelection(null)}
              onDownload={downloadMediaRow}
            />
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
}
