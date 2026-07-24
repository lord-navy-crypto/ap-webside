"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import UploadAndShow from "@/components/UploadAndShow";
import RichContent from "@/components/RichContent";
import { saveImage, saveLearningItem } from "@/lib/storage";
import type { ManagedDocument, ManagedFile } from "@/lib/managed-types";
import { ROOT_SPACE, matchesSpace, normalizeSpace } from "@/lib/storage-space";

type Tab = "all" | "pics" | "docs" | "files";

type Props = {
  folderArea: string;
  spaceKey?: string;
  title?: string;
  /** Extra add actions for pages that need topic/subject forms in the floating window */
  alsoShow?: Array<
    "concept" | "topic" | "formula" | "document" | "member" | "folder" | "subject" | "questionnaire"
  >;
  defaultSubject?: string;
  spaceBasePath?: string;
  enablePrivateImages?: boolean;
};

type Preview =
  | { kind: "file"; item: ManagedFile }
  | { kind: "document"; item: ManagedDocument };

function isImage(file: ManagedFile): boolean {
  return Boolean(file.mime?.startsWith("image/") || file.dataUrl?.startsWith("data:image"));
}

export function FloatingMediaWindow({
  folderArea,
  spaceKey = ROOT_SPACE,
  title = "Media",
  alsoShow = ["document", "folder"],
  defaultSubject,
  spaceBasePath,
  enablePrivateImages = true,
}: Props) {
  const scoped = normalizeSpace(spaceKey);
  const [minimized, setMinimized] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("all");
  const [files, setFiles] = useState<ManagedFile[]>([]);
  const [documents, setDocuments] = useState<ManagedDocument[]>([]);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [privateNote, setPrivateNote] = useState("");
  const [privateError, setPrivateError] = useState("");
  const [privateBusy, setPrivateBusy] = useState(false);
  const privateInputId = useId();
  const privateRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    try {
      const params = new URLSearchParams({ area: folderArea, space: scoped });
      const res = await fetch(`/api/edit?${params}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) return;
      const allFiles: ManagedFile[] = Array.isArray(data.files) ? data.files : [];
      const allDocs: ManagedDocument[] = Array.isArray(data.documents) ? data.documents : [];
      setFiles(allFiles.filter((f) => matchesSpace(f, folderArea, scoped)));
      setDocuments(allDocs.filter((d) => matchesSpace(d, folderArea, scoped)));
    } catch {
      /* ignore — window stays empty */
    }
  }, [folderArea, scoped]);

  useEffect(() => {
    void refresh();
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    const id = window.setInterval(() => void refresh(), 12_000);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.clearInterval(id);
    };
  }, [refresh]);

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

  async function onPrivateImages(fileList: FileList | null) {
    if (!fileList?.length) return;
    setPrivateBusy(true);
    setPrivateError("");
    setPrivateNote("");
    try {
      for (const file of Array.from(fileList)) {
        if (!file.type.startsWith("image/")) {
          throw new Error("Private upload accepts images only.");
        }
        if (file.size > 4_500_000) throw new Error("Keep private images under ~4 MB.");
        const dataUrl = await readAsDataUrl(file);
        const name = file.name.replace(/\.[^.]+$/, "") || "Picture";
        await saveImage({
          kind: "uploaded",
          name,
          dataUrl,
          note: `From ${title}`,
          tags: ["learning-box", folderArea],
        });
        await saveLearningItem({
          title: name,
          content: dataUrl,
          category: "Private image",
        });
      }
      setPrivateNote("Saved privately (Learning Box).");
      if (privateRef.current) privateRef.current.value = "";
    } catch (caught) {
      setPrivateError(caught instanceof Error ? caught.message : "Private save failed");
    } finally {
      setPrivateBusy(false);
    }
  }

  const chrome = (
    <div
      className="overflow-hidden rounded-xl border border-slate-700/80 bg-[#1e1e1e] shadow-2xl shadow-black/40"
      style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
    >
      <div className="flex items-center gap-2 border-b border-white/10 bg-[#2a2a2a] px-3 py-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Close preview"
            onClick={() => {
              setPreview(null);
              setMobileOpen(false);
            }}
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
            aria-label="Open Manage Files"
            className="h-3 w-3 rounded-full bg-[#28c840] hover:brightness-110"
            title="Open Mac Files in Manage"
          />
        </div>
        <p className="min-w-0 flex-1 truncate text-center text-[11px] font-medium text-white/85">
          {title}
        </p>
        <button
          type="button"
          onClick={() => setMinimized((v) => !v)}
          className="rounded px-1.5 py-0.5 text-[10px] text-white/55 hover:bg-white/10 hover:text-white"
        >
          {minimized ? "▸" : "▾"}
        </button>
      </div>

      {!minimized ? (
        <>
          <div className="flex gap-1 border-b border-white/5 bg-[#232323] px-2 py-1.5">
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
                    ? "bg-white/15 text-white"
                    : "text-white/55 hover:bg-white/5 hover:text-white/80"
                }`}
              >
                {label}
                <span className="ml-1 opacity-60">{counts[id]}</span>
              </button>
            ))}
          </div>

          <div className="max-h-[220px] overflow-y-auto overscroll-contain px-2 py-2">
            {list.length === 0 ? (
              <p className="px-2 py-6 text-center text-[11px] text-white/40">
                No uploaded files, pictures, or documents here yet.
              </p>
            ) : (
              <ul className="space-y-1">
                {list.map((row) => {
                  const key = `${row.kind}-${row.item.id}`;
                  const name =
                    row.kind === "file" ? row.item.name : row.item.title;
                  const meta =
                    row.kind === "file"
                      ? row.item.mime || "file"
                      : row.item.category || "document";
                  return (
                    <li key={key}>
                      <button
                        type="button"
                        onClick={() => setPreview(row)}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-white/8"
                      >
                        {row.kind === "file" && isImage(row.item) && row.item.dataUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={row.item.dataUrl}
                            alt=""
                            className="h-8 w-8 shrink-0 rounded object-cover"
                          />
                        ) : (
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-white/10 text-sm">
                            {row.kind === "document" ? "📄" : isImage(row.item as ManagedFile) ? "🖼" : "📎"}
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[11px] font-medium text-white/90">
                            {name}
                          </span>
                          <span className="block truncate text-[10px] text-white/40">{meta}</span>
                        </span>
                        <span className="shrink-0 text-[10px] text-sky-300/80">View</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="max-h-[200px] overflow-y-auto border-t border-white/10 bg-[#252525] px-2 py-2">
            <UploadAndShow
              title="Upload to this page"
              folderArea={folderArea}
              spaceKey={scoped}
              spaceBasePath={spaceBasePath}
              defaultSubject={defaultSubject}
              alsoShow={alsoShow}
              collapsedByDefault
              allowPublicContributions={false}
            />
            {enablePrivateImages ? (
              <div className="mt-2 rounded-lg border border-violet-400/30 bg-violet-950/40 p-2">
                <p className="text-[10px] font-semibold text-violet-100">Private picture</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <label
                    htmlFor={privateInputId}
                    className="cursor-pointer rounded bg-violet-600/80 px-2 py-1 text-[10px] text-white"
                  >
                    {privateBusy ? "Saving…" : "Upload"}
                  </label>
                  <input
                    id={privateInputId}
                    ref={privateRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    disabled={privateBusy}
                    onChange={(e) => void onPrivateImages(e.target.files)}
                  />
                  <Link href="/learning-box?tab=pictures" className="text-[10px] text-violet-200 underline">
                    Learning Box
                  </Link>
                </div>
                {privateNote ? <p className="mt-1 text-[10px] text-emerald-300">{privateNote}</p> : null}
                {privateError ? <p className="mt-1 text-[10px] text-red-300">{privateError}</p> : null}
              </div>
            ) : null}
            <p className="mt-1 px-1 text-[9px] text-white/35">
              This page’s uploads · scroll · View · green → Manage Mac Finder
            </p>
          </div>
        </>
      ) : (
        <div className="px-3 py-2 text-[10px] text-white/55">
          {counts.all} item{counts.all === 1 ? "" : "s"} · expand to browse
        </div>
      )}
    </div>
  );

  return (
    <>
      <div
        className={`fixed z-[70] hidden sm:block ${
          minimized ? "top-16 right-3 w-[220px]" : "top-16 right-3 w-[300px]"
        }`}
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
            className="rounded-full border border-slate-600 bg-[#1e1e1e] px-3 py-2 text-[11px] font-medium text-white shadow-lg"
          >
            Media ({counts.all})
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
            className="max-h-[85vh] w-full max-w-lg overflow-hidden rounded-2xl border border-white/15 bg-[#1e1e1e] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center gap-2 border-b border-white/10 bg-[#2a2a2a] px-3 py-2">
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="h-3 w-3 rounded-full bg-[#ff5f57]"
                aria-label="Close"
              />
              <p className="flex-1 truncate text-center text-xs text-white/85">
                {preview.kind === "file" ? preview.item.name : preview.item.title}
              </p>
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="text-[11px] text-white/50 hover:text-white"
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
                <div className="rounded-lg bg-white p-3 text-slate-800">
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
