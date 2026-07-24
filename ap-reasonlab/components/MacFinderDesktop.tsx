"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import ChangePanel from "@/components/ChangePanel";
import RichContent from "@/components/RichContent";
import { useEditorMode } from "@/components/EditorModeProvider";
import type { ManagedContent, ManagedDocument, ManagedFile } from "@/lib/managed-types";
import {
  SITE_SECTION_FOLDERS,
  collectDynamicPageFolders,
  type SitePageFolder,
  type SiteSectionFolder,
} from "@/lib/site-media-map";
import { ROOT_SPACE, normalizeSpace } from "@/lib/storage-space";

type FileRow =
  | { kind: "file"; item: ManagedFile }
  | { kind: "document"; item: ManagedDocument };

type NavLevel =
  | { kind: "desktop" }
  | { kind: "section"; section: SiteSectionFolder }
  | { kind: "page"; section: SiteSectionFolder; page: SitePageFolder };

type Props = {
  data: Partial<ManagedContent>;
  changeCode: string;
  githubToken: string;
  onMutate: (action: string, extra: Record<string, unknown>) => Promise<boolean>;
  onContent: (content: Partial<ManagedContent>) => void;
};

function isImage(file: ManagedFile): boolean {
  return Boolean(file.mime?.startsWith("image/") || file.dataUrl?.startsWith("data:image"));
}

function countInPage(
  data: Partial<ManagedContent>,
  page: SitePageFolder
): number {
  const files = (data.files || []).filter(
    (f) => (f.area || "general") === page.area && normalizeSpace(f.space) === normalizeSpace(page.space)
  ).length;
  const docs = (data.documents || []).filter(
    (d) => (d.area || "general") === page.area && normalizeSpace(d.space) === normalizeSpace(page.space)
  ).length;
  return files + docs;
}

function countInSection(data: Partial<ManagedContent>, section: SiteSectionFolder): number {
  return section.pages.reduce((sum, page) => sum + countInPage(data, page), 0);
}

/**
 * Mac desktop / Finder for the whole website.
 * Big folders = site sections (AP, English, Academic…).
 * Small folders = webpages. Open a page folder to see its uploaded files.
 */
export default function MacFinderDesktop({
  data,
  changeCode,
  onMutate,
  onContent,
}: Props) {
  const { unlocked } = useEditorMode();
  const [nav, setNav] = useState<NavLevel>({ kind: "desktop" });
  const [view, setView] = useState<"icons" | "list">("icons");
  const [selected, setSelected] = useState<FileRow | null>(null);
  const [message, setMessage] = useState("");
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  const dynamicPages = useMemo(
    () =>
      collectDynamicPageFolders(data.files || [], data.documents || [], data.folders || []),
    [data.documents, data.files, data.folders]
  );

  const sections = useMemo(() => {
    const ap = SITE_SECTION_FOLDERS.find((s) => s.id === "ap");
    const subjectPages = dynamicPages.filter((p) => p.area === "ap-subject");
    const otherDynamic = dynamicPages.filter((p) => p.area !== "ap-subject");

    const withApSubjects: SiteSectionFolder[] = SITE_SECTION_FOLDERS.map((section) => {
      if (section.id !== "ap" || !ap) return section;
      return {
        ...section,
        pages: [...section.pages, ...subjectPages],
      };
    });

    if (otherDynamic.length === 0) return withApSubjects;

    return [
      ...withApSubjects,
      {
        id: "other",
        label: "Other page folders",
        icon: "📂",
        pages: otherDynamic,
      },
    ];
  }, [dynamicPages]);

  const pageFiles = useMemo((): FileRow[] => {
    if (nav.kind !== "page") return [];
    const { area, space } = nav.page;
    const scoped = normalizeSpace(space);
    const files: FileRow[] = (data.files || [])
      .filter((f) => (f.area || "general") === area && normalizeSpace(f.space) === scoped)
      .map((item) => ({ kind: "file", item }));
    const docs: FileRow[] = (data.documents || [])
      .filter((d) => (d.area || "general") === area && normalizeSpace(d.space) === scoped)
      .map((item) => ({ kind: "document", item }));
    return [...files, ...docs].sort((a, b) => {
      const an = a.kind === "file" ? a.item.name : a.item.title;
      const bn = b.kind === "file" ? b.item.name : b.item.title;
      return an.localeCompare(bn);
    });
  }, [data.documents, data.files, nav]);

  const breadcrumbs = useMemo(() => {
    const crumbs: Array<{ label: string; go: () => void }> = [
      { label: "Macintosh HD", go: () => { setNav({ kind: "desktop" }); setSelected(null); } },
    ];
    if (nav.kind === "section" || nav.kind === "page") {
      crumbs.push({
        label: nav.section.label,
        go: () => {
          setNav({ kind: "section", section: nav.section });
          setSelected(null);
        },
      });
    }
    if (nav.kind === "page") {
      crumbs.push({
        label: nav.page.label,
        go: () => setSelected(null),
      });
    }
    return crumbs;
  }, [nav]);

  const relocate = useCallback(
    async (row: FileRow, area: string, space: string) => {
      if (!unlocked && !changeCode.trim()) {
        setMessage("Unlock with the content code to move files.");
        return;
      }
      const ok = await onMutate("update", {
        target: row.kind,
        id: row.item.id,
        item: { area, space },
      });
      if (ok) setMessage(`Moved into ${area} / ${space}`);
    },
    [changeCode, onMutate, unlocked]
  );

  async function onDesktopFileDrop(event: React.DragEvent) {
    event.preventDefault();
    setDragOverKey(null);
    if (nav.kind !== "page") {
      setMessage("Open a page folder first, then drop files to upload into that webpage.");
      return;
    }
    const fileList = event.dataTransfer.files;
    if (!fileList?.length) {
      const raw = event.dataTransfer.getData("application/x-ke-media");
      if (!raw) return;
      try {
        const payload = JSON.parse(raw) as { kind: "file" | "document"; id: string };
        const source =
          payload.kind === "file"
            ? (data.files || []).find((f) => f.id === payload.id)
            : (data.documents || []).find((d) => d.id === payload.id);
        if (!source) return;
        await relocate(
          { kind: payload.kind, item: source } as FileRow,
          nav.page.area,
          nav.page.space
        );
      } catch {
        /* ignore */
      }
      return;
    }
    if (!unlocked && !changeCode.trim()) {
      setMessage("Unlock with the content code to upload.");
      return;
    }
    const items: Array<{ name: string; mime: string; dataUrl: string; area: string; space: string }> =
      [];
    for (const file of Array.from(fileList).slice(0, 10)) {
      if (file.size > 1_000_000) {
        setMessage(`${file.name} is too large (keep under ~1MB).`);
        continue;
      }
      const dataUrl = await readAsDataUrl(file);
      items.push({
        name: file.name,
        mime: file.type || "application/octet-stream",
        dataUrl,
        area: nav.page.area,
        space: nav.page.space,
      });
    }
    if (!items.length) return;
    const ok = await onMutate("add_files", { items });
    if (ok) setMessage(`Uploaded ${items.length} file(s) into ${nav.page.label}.`);
  }

  function onItemDragStart(event: React.DragEvent, row: FileRow) {
    event.dataTransfer.setData(
      "application/x-ke-media",
      JSON.stringify({ kind: row.kind, id: row.item.id })
    );
    event.dataTransfer.effectAllowed = "move";
  }

  async function deleteRow(row: FileRow) {
    await onMutate("delete", { target: row.kind, id: row.item.id });
    if (selected?.item.id === row.item.id) setSelected(null);
  }

  const titleBar =
    nav.kind === "desktop"
      ? "Knowledge Explorer · Macintosh HD"
      : nav.kind === "section"
        ? `${nav.section.label} · page folders`
        : `${nav.page.label} · uploaded files`;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-400 bg-[#c8c8c8] shadow-xl">
      <div className="flex items-center gap-3 border-b border-slate-400 bg-gradient-to-b from-[#e8e8e8] to-[#d0d0d0] px-3 py-2">
        <div className="flex gap-1.5" aria-hidden>
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        </div>
        <p className="min-w-0 flex-1 truncate text-center text-xs font-semibold text-slate-700">
          {titleBar}
        </p>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setView("icons")}
            className={`rounded px-2 py-0.5 text-[10px] font-medium ${
              view === "icons" ? "bg-white shadow" : "text-slate-600 hover:bg-white/60"
            }`}
          >
            Icons
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={`rounded px-2 py-0.5 text-[10px] font-medium ${
              view === "list" ? "bg-white shadow" : "text-slate-600 hover:bg-white/60"
            }`}
          >
            List
          </button>
        </div>
      </div>

      {/* Path bar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-300 bg-[#ececec] px-3 py-1.5 text-[11px]">
        {breadcrumbs.map((crumb, index) => (
          <span key={`${crumb.label}-${index}`} className="flex items-center gap-1">
            {index > 0 && <span className="text-slate-400">›</span>}
            <button
              type="button"
              onClick={crumb.go}
              className="rounded px-1.5 py-0.5 font-medium text-sky-800 hover:bg-white"
            >
              {crumb.label}
            </button>
          </span>
        ))}
      </div>

      <div className="grid min-h-[30rem] gap-0 md:grid-cols-[1fr_15rem]">
        <div
          className="relative overflow-y-auto bg-[radial-gradient(circle_at_18%_12%,#dce9f7,transparent_42%),linear-gradient(165deg,#5f87a8_0%,#2f4a63_100%)] p-4"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => void onDesktopFileDrop(e)}
        >
          <p className="mb-4 text-center text-[11px] font-medium text-white/90 drop-shadow">
            {nav.kind === "desktop" &&
              "Big folders = site sections. Double-click to open page folders for each webpage."}
            {nav.kind === "section" &&
              "Each small folder is a webpage. Open it to see files uploaded on that page."}
            {nav.kind === "page" &&
              "Files, pictures, and documents for this webpage (same as the in-page media panel)."}
          </p>

          {nav.kind === "desktop" && (
            <FolderIconGrid
              view={view}
              items={sections.map((section) => ({
                key: section.id,
                icon: section.icon,
                label: section.label,
                meta: `${section.pages.length} pages · ${countInSection(data, section)} files`,
                onOpen: () => {
                  setNav({ kind: "section", section });
                  setSelected(null);
                },
                dropKey: `section:${section.id}`,
                dragOverKey,
                setDragOverKey,
                onDropMedia: async (payload) => {
                  // Dropping on a section opens it — move into first page if any
                  const target = section.pages[0];
                  if (!target) return;
                  const source =
                    payload.kind === "file"
                      ? (data.files || []).find((f) => f.id === payload.id)
                      : (data.documents || []).find((d) => d.id === payload.id);
                  if (!source) return;
                  await relocate(
                    { kind: payload.kind, item: source } as FileRow,
                    target.area,
                    target.space
                  );
                  setNav({ kind: "page", section, page: target });
                },
              }))}
            />
          )}

          {nav.kind === "section" && (
            <FolderIconGrid
              view={view}
              items={nav.section.pages.map((page) => ({
                key: `${page.area}:${page.space}`,
                icon: "📁",
                label: page.label,
                meta: `${countInPage(data, page)} items · ${page.href}`,
                onOpen: () => {
                  setNav({ kind: "page", section: nav.section, page });
                  setSelected(null);
                },
                dropKey: `page:${page.area}:${page.space}`,
                dragOverKey,
                setDragOverKey,
                onDropMedia: async (payload) => {
                  const source =
                    payload.kind === "file"
                      ? (data.files || []).find((f) => f.id === payload.id)
                      : (data.documents || []).find((d) => d.id === payload.id);
                  if (!source) return;
                  await relocate(
                    { kind: payload.kind, item: source } as FileRow,
                    page.area,
                    page.space
                  );
                },
              }))}
            />
          )}

          {nav.kind === "page" &&
            (pageFiles.length === 0 ? (
              <p className="mt-16 text-center text-sm text-white/85">
                No uploads in this webpage folder yet. Drop files here or use Upload on the right.
              </p>
            ) : view === "icons" ? (
              <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
                {pageFiles.map((row) => {
                  const name = row.kind === "file" ? row.item.name : row.item.title;
                  const active =
                    selected?.kind === row.kind && selected.item.id === row.item.id;
                  return (
                    <li key={`${row.kind}-${row.item.id}`}>
                      <button
                        type="button"
                        draggable
                        onDragStart={(e) => onItemDragStart(e, row)}
                        onClick={() => setSelected(row)}
                        className={`flex w-full flex-col items-center gap-1 rounded-xl p-2 text-center ${
                          active ? "bg-sky-500/40 ring-1 ring-white/50" : "hover:bg-white/15"
                        }`}
                      >
                        {row.kind === "file" && isImage(row.item) && row.item.dataUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={row.item.dataUrl}
                            alt=""
                            className="h-14 w-14 rounded-lg object-cover shadow"
                          />
                        ) : (
                          <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-white/90 text-2xl shadow">
                            {row.kind === "document" ? "📄" : isImage(row.item) ? "🖼" : "📎"}
                          </span>
                        )}
                        <span className="line-clamp-2 w-full text-[11px] font-medium text-white drop-shadow">
                          {name}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <ul className="overflow-hidden rounded-xl bg-white/95 shadow">
                {pageFiles.map((row) => {
                  const name = row.kind === "file" ? row.item.name : row.item.title;
                  const active =
                    selected?.kind === row.kind && selected.item.id === row.item.id;
                  return (
                    <li key={`${row.kind}-${row.item.id}`}>
                      <button
                        type="button"
                        draggable
                        onDragStart={(e) => onItemDragStart(e, row)}
                        onClick={() => setSelected(row)}
                        className={`flex w-full items-center gap-3 border-b border-slate-100 px-3 py-2 text-left text-sm ${
                          active ? "bg-sky-100" : "hover:bg-slate-50"
                        }`}
                      >
                        <span className="text-lg">
                          {row.kind === "document" ? "📄" : isImage(row.item) ? "🖼" : "📎"}
                        </span>
                        <span className="min-w-0 flex-1 truncate font-medium">{name}</span>
                        <span className="text-xs text-slate-500">{row.kind}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ))}
        </div>

        <aside className="border-t border-slate-300 bg-[#f6f6f6] p-3 md:border-l md:border-t-0">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Get Info</p>

          {nav.kind === "page" ? (
            <div className="mt-2 space-y-2 text-xs text-slate-600">
              <p>
                <strong className="text-slate-900">{nav.page.label}</strong>
              </p>
              <p>
                Storage: {nav.page.area} / {nav.page.space}
              </p>
              <Link href={nav.page.href} className="inline-block text-sky-700 underline">
                Open webpage →
              </Link>
            </div>
          ) : nav.kind === "section" ? (
            <p className="mt-3 text-sm text-slate-600">
              Section <strong>{nav.section.label}</strong> contains webpage folders. Open one to
              manage its uploads.
            </p>
          ) : (
            <p className="mt-3 text-sm text-slate-600">
              Whole-site file system. Same files as the small Media box on every page.
            </p>
          )}

          {selected ? (
            <div className="mt-4 space-y-3 border-t border-slate-200 pt-3">
              <div className="flex justify-center">
                {selected.kind === "file" && isImage(selected.item) && selected.item.dataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selected.item.dataUrl}
                    alt=""
                    className="max-h-36 rounded-lg object-contain shadow"
                  />
                ) : (
                  <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white text-3xl shadow">
                    {selected.kind === "document" ? "📄" : "📎"}
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-slate-900">
                {selected.kind === "file" ? selected.item.name : selected.item.title}
              </p>
              {selected.kind === "document" ? (
                <div className="max-h-32 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2 text-xs">
                  <RichContent className="text-xs">{selected.item.content}</RichContent>
                </div>
              ) : null}
              {selected.kind === "file" && selected.item.dataUrl && !isImage(selected.item) ? (
                <a
                  href={selected.item.dataUrl}
                  download={selected.item.name}
                  className="inline-flex text-xs font-medium text-sky-700 underline"
                >
                  Download
                </a>
              ) : null}
              <button
                type="button"
                className="btn-ghost w-full text-xs text-red-600"
                onClick={() => void deleteRow(selected)}
              >
                Delete
              </button>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">Select a file to preview.</p>
          )}

          {nav.kind === "page" ? (
            <div className="mt-6 border-t border-slate-200 pt-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Upload into this webpage
              </p>
              <ChangePanel
                mode="file"
                folderArea={nav.page.area}
                spaceKey={nav.page.space}
                onSaved={(content) => {
                  if (content) onContent(content as ManagedContent);
                }}
              />
              <div className="mt-2">
                <ChangePanel
                  mode="document"
                  folderArea={nav.page.area}
                  spaceKey={nav.page.space}
                  onSaved={(content) => {
                    if (content) onContent(content as ManagedContent);
                  }}
                />
              </div>
            </div>
          ) : null}

          {message ? <p className="mt-2 text-xs text-slate-600">{message}</p> : null}
        </aside>
      </div>
    </section>
  );
}

type GridItem = {
  key: string;
  icon: string;
  label: string;
  meta: string;
  onOpen: () => void;
  dropKey: string;
  dragOverKey: string | null;
  setDragOverKey: (key: string | null) => void;
  onDropMedia: (payload: { kind: "file" | "document"; id: string }) => Promise<void>;
};

function FolderIconGrid({
  view,
  items,
}: {
  view: "icons" | "list";
  items: GridItem[];
}) {
  if (view === "list") {
    return (
      <ul className="overflow-hidden rounded-xl bg-white/95 shadow">
        {items.map((item) => (
          <li key={item.key}>
            <button
              type="button"
              onDoubleClick={item.onOpen}
              onClick={item.onOpen}
              onDragOver={(e) => {
                e.preventDefault();
                item.setDragOverKey(item.dropKey);
              }}
              onDragLeave={() => item.setDragOverKey(null)}
              onDrop={(e) => {
                e.preventDefault();
                item.setDragOverKey(null);
                const raw = e.dataTransfer.getData("application/x-ke-media");
                if (!raw) return;
                try {
                  void item.onDropMedia(JSON.parse(raw));
                } catch {
                  /* ignore */
                }
              }}
              className={`flex w-full items-center gap-3 border-b border-slate-100 px-3 py-2.5 text-left ${
                item.dragOverKey === item.dropKey ? "bg-sky-100" : "hover:bg-slate-50"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-slate-900">
                  {item.label}
                </span>
                <span className="block truncate text-xs text-slate-500">{item.meta}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-5">
      {items.map((item) => (
        <li key={item.key}>
          <button
            type="button"
            onDoubleClick={item.onOpen}
            onClick={item.onOpen}
            onDragOver={(e) => {
              e.preventDefault();
              item.setDragOverKey(item.dropKey);
            }}
            onDragLeave={() => item.setDragOverKey(null)}
            onDrop={(e) => {
              e.preventDefault();
              item.setDragOverKey(null);
              const raw = e.dataTransfer.getData("application/x-ke-media");
              if (!raw) return;
              try {
                void item.onDropMedia(JSON.parse(raw));
              } catch {
                /* ignore */
              }
            }}
            className={`flex w-full flex-col items-center gap-1 rounded-xl p-2 text-center ${
              item.dragOverKey === item.dropKey
                ? "bg-sky-400/50 ring-2 ring-white/70"
                : "hover:bg-white/15"
            }`}
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-b from-sky-200 to-sky-400 text-3xl shadow-lg">
              {item.icon}
            </span>
            <span className="line-clamp-2 w-full text-[11px] font-semibold text-white drop-shadow">
              {item.label}
            </span>
            <span className="line-clamp-1 w-full text-[9px] text-white/75">{item.meta}</span>
          </button>
        </li>
      ))}
    </ul>
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
