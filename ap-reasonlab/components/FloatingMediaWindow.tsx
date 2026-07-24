"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import RichContent from "@/components/RichContent";
import { useEditorMode } from "@/components/EditorModeProvider";
import type { ManagedDocument, ManagedFile } from "@/lib/managed-types";
import { ROOT_SPACE, matchesSpace, normalizeSpace } from "@/lib/storage-space";

type Tab = "all" | "pics" | "docs" | "files";

type Props = {
  folderArea: string;
  spaceKey?: string;
  title?: string;
  alsoShow?: Array<
    "concept" | "topic" | "formula" | "document" | "member" | "folder" | "subject" | "questionnaire"
  >;
  defaultSubject?: string;
  spaceBasePath?: string;
};

type Preview =
  | { kind: "file"; item: ManagedFile }
  | { kind: "document"; item: ManagedDocument };

function isImage(file: ManagedFile): boolean {
  return Boolean(file.mime?.startsWith("image/") || file.dataUrl?.startsWith("data:image"));
}

/**
 * Built-in per-page media box (top-right).
 * One box ↔ one webpage: upload pictures/files/docs here and they display automatically.
 */
export function FloatingMediaWindow({
  folderArea,
  spaceKey = ROOT_SPACE,
  title = "This page",
}: Props) {
  const scoped = normalizeSpace(spaceKey);
  const { unlocked, editor } = useEditorMode();
  const [minimized, setMinimized] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("all");
  const [files, setFiles] = useState<ManagedFile[]>([]);
  const [documents, setDocuments] = useState<ManagedDocument[]>([]);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [changeCode, setChangeCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [docTitle, setDocTitle] = useState("");
  const [docBody, setDocBody] = useState("");
  const [showDocForm, setShowDocForm] = useState(false);
  const uploadId = useId();
  const uploadRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    try {
      const params = new URLSearchParams({ area: folderArea, space: scoped });
      const res = await fetch(`/api/edit?${params}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) return;
      const allFiles: ManagedFile[] = Array.isArray(data.files) ? data.files : [];
      const allDocs: ManagedDocument[] = Array.isArray(data.documents) ? data.documents : [];
      setFiles(
        allFiles
          .filter((f) => matchesSpace(f, folderArea, scoped))
          .sort((a, b) => (b.uploadedAt || 0) - (a.uploadedAt || 0))
      );
      setDocuments(
        allDocs
          .filter((d) => matchesSpace(d, folderArea, scoped))
          .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
      );
    } catch {
      /* keep last good list */
    }
  }, [folderArea, scoped]);

  useEffect(() => {
    void refresh();
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    const id = window.setInterval(() => void refresh(), 8_000);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.clearInterval(id);
    };
  }, [refresh]);

  // Reset view when navigating to another page’s box
  useEffect(() => {
    setTab("all");
    setPreview(null);
    setNote("");
    setError("");
    setMinimized(false);
  }, [folderArea, scoped]);

  const pics = useMemo(() => files.filter(isImage), [files]);
  const otherFiles = useMemo(() => files.filter((f) => !isImage(f)), [files]);

  const list = useMemo(() => {
    if (tab === "pics") return pics.map((item) => ({ kind: "file" as const, item }));
    if (tab === "docs") return documents.map((item) => ({ kind: "document" as const, item }));
    if (tab === "files") return otherFiles.map((item) => ({ kind: "file" as const, item }));
    return [
      ...pics.map((item) => ({ kind: "file" as const, item })),
      ...otherFiles.map((item) => ({ kind: "file" as const, item })),
      ...documents.map((item) => ({ kind: "document" as const, item })),
    ];
  }, [tab, pics, otherFiles, documents]);

  const counts = {
    all: files.length + documents.length,
    pics: pics.length,
    docs: documents.length,
    files: otherFiles.length,
  };

  const canPublish = unlocked || Boolean(changeCode.trim());

  async function publishFiles(fileList: FileList | File[]) {
    const chosen = Array.from(fileList).slice(0, 10);
    if (!chosen.length) return;
    if (!canPublish) {
      setError("Unlock edit mode or paste the content code below to publish to this page.");
      return;
    }
    setBusy(true);
    setError("");
    setNote("");
    try {
      const items = [];
      for (const file of chosen) {
        if (file.size > 1_000_000) {
          throw new Error(`${file.name} is too large (keep under ~1MB each).`);
        }
        const dataUrl = await readAsDataUrl(file);
        items.push({
          name: file.name,
          mime: file.type || "application/octet-stream",
          dataUrl,
          area: folderArea,
          space: scoped,
        });
      }
      const res = await fetch("/api/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_files",
          items,
          changeCode: changeCode.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setNote(`Added ${items.length} item(s) — showing on this page now.`);
      if (uploadRef.current) uploadRef.current.value = "";
      // Prefer server content when returned
      if (data.content) {
        const allFiles: ManagedFile[] = Array.isArray(data.content.files) ? data.content.files : [];
        const allDocs: ManagedDocument[] = Array.isArray(data.content.documents)
          ? data.content.documents
          : [];
        setFiles(
          allFiles
            .filter((f) => matchesSpace(f, folderArea, scoped))
            .sort((a, b) => (b.uploadedAt || 0) - (a.uploadedAt || 0))
        );
        setDocuments(
          allDocs
            .filter((d) => matchesSpace(d, folderArea, scoped))
            .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
        );
      } else {
        await refresh();
      }
      // Auto-open Pics tab if we uploaded images
      if (chosen.some((f) => f.type.startsWith("image/"))) setTab("pics");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Upload failed");
    } finally {
      setBusy(false);
      setDragOver(false);
    }
  }

  async function publishDocument(event: React.FormEvent) {
    event.preventDefault();
    if (!docTitle.trim() || !docBody.trim()) return;
    if (!canPublish) {
      setError("Unlock edit mode or paste the content code to add a document.");
      return;
    }
    setBusy(true);
    setError("");
    setNote("");
    try {
      const res = await fetch("/api/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_document",
          item: {
            title: docTitle.trim(),
            content: docBody.trim(),
            category: "Uploaded",
            area: folderArea,
            space: scoped,
          },
          changeCode: changeCode.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setDocTitle("");
      setDocBody("");
      setShowDocForm(false);
      setNote("Document added — it appears in this page’s box.");
      setTab("docs");
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  const chrome = (
    <div
      className={`overflow-hidden rounded-xl border shadow-2xl shadow-black/30 ${
        dragOver ? "border-sky-400 ring-2 ring-sky-300/60" : "border-slate-300/90"
      } bg-white`}
    >
      <div className="flex items-center gap-2 border-b border-slate-200 bg-gradient-to-b from-slate-100 to-slate-200/90 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Close mobile"
            onClick={() => setMobileOpen(false)}
            className="h-3 w-3 rounded-full bg-[#ff5f57] hover:brightness-110"
          />
          <button
            type="button"
            aria-label={minimized ? "Expand" : "Minimize"}
            onClick={() => setMinimized((v) => !v)}
            className="h-3 w-3 rounded-full bg-[#febc2e] hover:brightness-110"
          />
          <Link
            href="/manage?tab=files"
            aria-label="Open Manage Finder"
            className="h-3 w-3 rounded-full bg-[#28c840] hover:brightness-110"
            title="Whole-site Mac Finder in Manage"
          />
        </div>
        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-[11px] font-semibold text-slate-800">{title}</p>
          <p className="truncate text-[9px] text-slate-500">Built-in · this page only</p>
        </div>
        <button
          type="button"
          onClick={() => setMinimized((v) => !v)}
          className="rounded px-1.5 py-0.5 text-[10px] text-slate-500 hover:bg-white"
        >
          {minimized ? "▸" : "▾"}
        </button>
      </div>

      {!minimized ? (
        <>
          <div className="flex gap-1 border-b border-slate-100 bg-slate-50 px-2 py-1.5">
            {(
              [
                ["all", "All"],
                ["pics", "Pics"],
                ["docs", "Docs"],
                ["files", "Files"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`rounded-md px-2 py-1 text-[10px] font-medium ${
                  tab === id
                    ? "bg-slate-800 text-white"
                    : "text-slate-500 hover:bg-white hover:text-slate-800"
                }`}
              >
                {label}
                <span className="ml-1 opacity-70">{counts[id]}</span>
              </button>
            ))}
          </div>

          {/* Auto gallery / list */}
          <div
            className="max-h-[260px] overflow-y-auto overscroll-contain px-2 py-2"
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              void publishFiles(e.dataTransfer.files);
            }}
          >
            {list.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-8 text-center">
                <p className="text-[11px] font-medium text-slate-600">Nothing on this page yet</p>
                <p className="mt-1 text-[10px] text-slate-400">
                  Drop pictures or files here — they display automatically.
                </p>
              </div>
            ) : tab === "pics" ||
              (tab === "all" &&
                pics.length > 0 &&
                otherFiles.length === 0 &&
                documents.length === 0) ? (
              <ul className="grid grid-cols-3 gap-1.5">
                {pics.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setPreview({ kind: "file", item })}
                      className="group block w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
                    >
                      {item.dataUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.dataUrl}
                          alt={item.name}
                          className="aspect-square w-full object-cover transition group-hover:opacity-90"
                        />
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="space-y-1">
                {list.map((row) => {
                  const name = row.kind === "file" ? row.item.name : row.item.title;
                  return (
                    <li key={`${row.kind}-${row.item.id}`}>
                      <button
                        type="button"
                        onClick={() => setPreview(row)}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-slate-100"
                      >
                        {row.kind === "file" && isImage(row.item) && row.item.dataUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={row.item.dataUrl}
                            alt=""
                            className="h-9 w-9 shrink-0 rounded object-cover"
                          />
                        ) : (
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-slate-100 text-sm">
                            {row.kind === "document" ? "📄" : "📎"}
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[11px] font-medium text-slate-800">
                            {name}
                          </span>
                          <span className="block truncate text-[10px] text-slate-400">
                            {row.kind === "file" ? row.item.mime || "file" : "document"}
                          </span>
                        </span>
                        <span className="shrink-0 text-[10px] font-medium text-sky-600">View</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {/* When All has mixed content, also show pic strip if any */}
            {tab === "all" && pics.length > 0 && (otherFiles.length > 0 || documents.length > 0) ? (
              <div className="mt-2 border-t border-slate-100 pt-2">
                <p className="mb-1 px-1 text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                  Pictures
                </p>
                <ul className="grid grid-cols-4 gap-1">
                  {pics.slice(0, 8).map((item) => (
                    <li key={`strip-${item.id}`}>
                      <button
                        type="button"
                        onClick={() => setPreview({ kind: "file", item })}
                        className="block w-full overflow-hidden rounded border border-slate-200"
                      >
                        {item.dataUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.dataUrl}
                            alt={item.name}
                            className="aspect-square w-full object-cover"
                          />
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          {/* Built-in upload */}
          <div className="space-y-2 border-t border-slate-200 bg-slate-50 px-2 py-2">
            {!unlocked && (
              <input
                type="password"
                className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px]"
                placeholder="Content code to publish…"
                value={changeCode}
                onChange={(e) => setChangeCode(e.target.value)}
              />
            )}
            {unlocked && (
              <p className="px-1 text-[9px] text-emerald-700">
                Editor unlocked ({editor?.level}) — uploads go to this page.
              </p>
            )}

            <div className="flex flex-wrap gap-1.5">
              <label
                htmlFor={uploadId}
                className={`cursor-pointer rounded-md px-2.5 py-1.5 text-[10px] font-semibold text-white ${
                  busy ? "bg-slate-400" : "bg-slate-800 hover:bg-slate-700"
                }`}
              >
                {busy ? "Uploading…" : "Upload pics / files"}
              </label>
              <input
                id={uploadId}
                ref={uploadRef}
                type="file"
                multiple
                accept="image/*,.pdf,.txt,.md,.doc,.docx,.png,.jpg,.jpeg,.gif,.webp"
                className="sr-only"
                disabled={busy}
                onChange={(e) => {
                  if (e.target.files) void publishFiles(e.target.files);
                }}
              />
              <button
                type="button"
                onClick={() => setShowDocForm((v) => !v)}
                className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-100"
              >
                {showDocForm ? "Hide text doc" : "+ Text document"}
              </button>
            </div>

            {showDocForm ? (
              <form onSubmit={(e) => void publishDocument(e)} className="space-y-1.5 rounded-lg border border-slate-200 bg-white p-2">
                <input
                  className="w-full rounded border border-slate-200 px-2 py-1 text-[11px]"
                  placeholder="Document title"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  required
                />
                <textarea
                  className="min-h-[64px] w-full rounded border border-slate-200 px-2 py-1 text-[11px]"
                  placeholder="Paste text…"
                  value={docBody}
                  onChange={(e) => setDocBody(e.target.value)}
                  required
                />
                <button type="submit" className="rounded bg-sky-600 px-2 py-1 text-[10px] font-semibold text-white" disabled={busy}>
                  Save document to this page
                </button>
              </form>
            ) : null}

            {note ? <p className="px-1 text-[10px] text-emerald-700">{note}</p> : null}
            {error ? <p className="px-1 text-[10px] text-red-600">{error}</p> : null}
            <p className="px-1 text-[9px] text-slate-400">
              Shared with this webpage · private pictures → Learning Box only
            </p>
          </div>
        </>
      ) : (
        <div className="px-3 py-2 text-[10px] text-slate-500">
          {counts.all} item{counts.all === 1 ? "" : "s"} on this page · expand
        </div>
      )}
    </div>
  );

  return (
    <>
      <div
        className={`fixed z-[70] hidden sm:block ${
          minimized ? "top-16 right-3 w-[220px]" : "top-16 right-3 w-[320px]"
        }`}
        aria-label={`Media for ${title}`}
      >
        {chrome}
      </div>

      <div className="fixed bottom-20 right-3 z-[70] sm:hidden">
        {!mobileOpen ? (
          <button
            type="button"
            onClick={() => {
              setMobileOpen(true);
              setMinimized(false);
            }}
            className="rounded-full border border-slate-300 bg-white px-3 py-2 text-[11px] font-semibold text-slate-800 shadow-lg"
          >
            Page media ({counts.all})
          </button>
        ) : (
          <div className="w-[min(92vw,320px)]">{chrome}</div>
        )}
      </div>

      {preview ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 p-4"
          onClick={() => setPreview(null)}
          role="presentation"
        >
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2">
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="h-3 w-3 rounded-full bg-[#ff5f57]"
                aria-label="Close"
              />
              <p className="flex-1 truncate text-center text-xs font-medium text-slate-800">
                {preview.kind === "file" ? preview.item.name : preview.item.title}
              </p>
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="text-[11px] text-slate-500 hover:text-slate-800"
              >
                Close
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto p-4">
              {preview.kind === "file" && isImage(preview.item) && preview.item.dataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview.item.dataUrl}
                  alt={preview.item.name}
                  className="mx-auto max-h-[60vh] rounded-lg"
                />
              ) : null}
              {preview.kind === "file" && !isImage(preview.item) && preview.item.dataUrl ? (
                <a
                  href={preview.item.dataUrl}
                  download={preview.item.name}
                  className="inline-flex rounded-lg bg-sky-600 px-3 py-2 text-sm text-white"
                >
                  Download {preview.item.name}
                </a>
              ) : null}
              {preview.kind === "document" ? (
                <div className="rounded-lg bg-slate-50 p-3 text-slate-800">
                  <RichContent className="text-sm">{preview.item.content}</RichContent>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

export default FloatingMediaWindow;
