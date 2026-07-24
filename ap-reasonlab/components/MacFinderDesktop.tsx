"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import ChangePanel from "@/components/ChangePanel";
import ResourceEditor, { type EditableTarget } from "@/components/ResourceEditor";
import RichContent from "@/components/RichContent";
import { useEditorMode } from "@/components/EditorModeProvider";
import { AP_CATALOG } from "@/data/ap-catalog";
import type {
  ManagedContent,
  ManagedDocument,
  ManagedFile,
  ManagedRecycleEntry,
} from "@/lib/managed-types";
import {
  SITE_SECTION_FOLDERS,
  apSubjectPageFolders,
  collectDynamicPageFolders,
  type SitePageFolder,
  type SiteSectionFolder,
} from "@/lib/site-media-map";
import {
  ROOT_SPACE,
  matchesSpace,
  normalizeSpace,
  spaceAliases,
} from "@/lib/storage-space";

type ContentKind =
  | "file"
  | "document"
  | "folder"
  | "concept"
  | "formula"
  | "questionnaire"
  | "recycle";

type ContentRow = {
  kind: ContentKind;
  id: string;
  label: string;
  meta: string;
  icon: string;
  previewText?: string;
  imageUrl?: string;
  href?: string;
  raw: Record<string, unknown>;
  editTarget?: EditableTarget;
  deleteTarget?: string;
};

type NavLevel =
  | { kind: "desktop" }
  | { kind: "section"; section: SiteSectionFolder }
  | { kind: "page"; section: SiteSectionFolder; page: SitePageFolder }
  | { kind: "trash" };

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

function subjectMatches(itemSubject: string | undefined, pageSpace: string): boolean {
  if (!itemSubject) return false;
  const aliases = spaceAliases(pageSpace);
  if (aliases.has(itemSubject)) return true;
  return itemSubject === pageSpace;
}

function pageDefaultSubject(page: SitePageFolder): string {
  if (page.area === "ap-subject") return page.space;
  if (page.space !== ROOT_SPACE && !page.space.startsWith("folder:")) return page.space;
  return AP_CATALOG[0]?.name || "AP Physics 1";
}

function pageSupportsLearningContent(page: SitePageFolder): boolean {
  return (
    page.area === "ap-subject" ||
    page.area === "concepts" ||
    page.area === "formulas" ||
    page.area === "practice"
  );
}

function collectPageRows(data: Partial<ManagedContent>, page: SitePageFolder): ContentRow[] {
  const scoped = normalizeSpace(page.space);
  const rows: ContentRow[] = [];

  for (const folder of data.folders || []) {
    if (folder.area === page.area && normalizeSpace(folder.space) === scoped) {
      rows.push({
        kind: "folder",
        id: folder.id,
        label: folder.title,
        meta: "File folder",
        icon: "📁",
        previewText: folder.note || "Nested storage folder for this webpage.",
        raw: folder as unknown as Record<string, unknown>,
        editTarget: "folder",
        deleteTarget: "folder",
      });
    }
  }

  for (const file of data.files || []) {
    if (!matchesSpace(file, page.area, scoped)) continue;
    rows.push({
      kind: "file",
      id: file.id,
      label: file.name,
      meta: file.mime || "file",
      icon: isImage(file) ? "🖼" : "📎",
      imageUrl: isImage(file) ? file.dataUrl : undefined,
      previewText: file.note || undefined,
      raw: file as unknown as Record<string, unknown>,
      editTarget: "file",
      deleteTarget: "file",
    });
  }

  for (const doc of data.documents || []) {
    if (!matchesSpace(doc, page.area, scoped)) continue;
    rows.push({
      kind: "document",
      id: doc.id,
      label: doc.title,
      meta: "Document",
      icon: "📄",
      previewText: doc.content,
      raw: doc as unknown as Record<string, unknown>,
      editTarget: "document",
      deleteTarget: "document",
    });
  }

  if (pageSupportsLearningContent(page)) {
    const showAllAtRoot =
      scoped === ROOT_SPACE &&
      (page.area === "concepts" || page.area === "formulas" || page.area === "practice");

    for (const concept of data.concepts || []) {
      const match =
        scoped === ROOT_SPACE
          ? showAllAtRoot || !concept.subject || concept.subject === ROOT_SPACE
          : subjectMatches(concept.subject, scoped) || concept.subject === scoped;
      if (!match) continue;
      rows.push({
        kind: "concept",
        id: concept.id,
        label: concept.title,
        meta: `Concept · ${concept.subject}`,
        icon: "💡",
        previewText: concept.summary,
        href: `/concepts/${concept.id}`,
        raw: concept as unknown as Record<string, unknown>,
        editTarget: concept.id.startsWith("m-topic") ? "topic" : "concept",
        deleteTarget: concept.id.startsWith("m-topic") ? "topic" : "concept",
      });
    }

    for (const formula of data.formulas || []) {
      const match =
        scoped === ROOT_SPACE
          ? showAllAtRoot && page.area === "formulas"
          : subjectMatches(formula.subject, scoped) || formula.subject === scoped;
      if (!match) continue;
      rows.push({
        kind: "formula",
        id: formula.id,
        label: formula.name,
        meta: `Formula · ${formula.subject}`,
        icon: "ƒ",
        previewText: formula.content || formula.expression || formula.whenToUse,
        href: `/formulas?subject=${encodeURIComponent(formula.subject)}`,
        raw: formula as unknown as Record<string, unknown>,
        editTarget: "formula",
        deleteTarget: "formula",
      });
    }

    for (const quiz of data.questionnaires || []) {
      const match =
        scoped === ROOT_SPACE
          ? showAllAtRoot && page.area === "practice"
          : subjectMatches(quiz.subject, scoped) || quiz.subject === scoped;
      if (!match) continue;
      rows.push({
        kind: "questionnaire",
        id: quiz.id,
        label: quiz.title,
        meta: `Practice · ${quiz.subject}`,
        icon: "📝",
        previewText: quiz.description,
        href: `/questionnaires/${quiz.id}`,
        raw: quiz as unknown as Record<string, unknown>,
        editTarget: "questionnaire",
        deleteTarget: "questionnaire",
      });
    }
  }

  return rows.sort((a, b) => a.label.localeCompare(b.label));
}

function countInPage(data: Partial<ManagedContent>, page: SitePageFolder): number {
  return collectPageRows(data, page).length;
}

function countInSection(data: Partial<ManagedContent>, section: SiteSectionFolder): number {
  return section.pages.reduce((sum, page) => sum + countInPage(data, page), 0);
}

/**
 * Knowledge Explorer · Macintosh HD
 * Full-site Finder: section → webpage → concepts / formulas / practice / files / images,
 * with preview, edit, delete, and Recycle Bin.
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
  const [selected, setSelected] = useState<ContentRow | null>(null);
  const [message, setMessage] = useState("");
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  const dynamicPages = useMemo(
    () =>
      collectDynamicPageFolders(data.files || [], data.documents || [], data.folders || []),
    [data.documents, data.files, data.folders]
  );

  const catalogSubjects = useMemo(() => apSubjectPageFolders(), []);

  const sections = useMemo(() => {
    const subjectPages = [
      ...catalogSubjects,
      ...dynamicPages.filter(
        (p) =>
          p.area === "ap-subject" &&
          !catalogSubjects.some((c) => c.space === p.space || spaceAliases(c.space).has(p.space))
      ),
    ];
    const otherDynamic = dynamicPages.filter((p) => p.area !== "ap-subject");

    const withApSubjects: SiteSectionFolder[] = SITE_SECTION_FOLDERS.map((section) => {
      if (section.id !== "ap") return section;
      return {
        ...section,
        pages: [
          ...section.pages,
          ...subjectPages.map((page) => ({
            ...page,
            label: page.label.startsWith("AP") ? page.label : `AP · ${page.label}`,
          })),
        ],
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
  }, [catalogSubjects, dynamicPages]);

  const pageRows = useMemo((): ContentRow[] => {
    if (nav.kind !== "page") return [];
    return collectPageRows(data, nav.page);
  }, [data, nav]);

  const recycleRows = useMemo((): ContentRow[] => {
    const fromBin: ContentRow[] = (data.recycleBin || []).map((entry: ManagedRecycleEntry) => ({
      kind: "recycle",
      id: entry.id,
      label: entry.label,
      meta: `${entry.target} · ${new Date(entry.deletedAt).toLocaleString()}`,
      icon: "🗑",
      previewText: `Deleted ${entry.target}. Restore from the sidebar.`,
      raw: entry as unknown as Record<string, unknown>,
    }));
    const softItems = (data.contentItems || [])
      .filter((item) => item.deletedAt)
      .filter((item) => !(data.recycleBin || []).some((b) => {
        const payload = b.payload as { id?: string };
        return b.target === "content_item" && payload?.id === item.id;
      }))
      .map((item) => ({
        kind: "recycle" as const,
        id: `content:${item.id}`,
        label: item.title,
        meta: `content_item · ${new Date(item.deletedAt || 0).toLocaleString()}`,
        icon: "🗑",
        previewText: item.content,
        raw: { ...item, recycleMode: "content_item", id: item.id },
      }));
    return [...fromBin, ...softItems];
  }, [data.contentItems, data.recycleBin]);

  const breadcrumbs = useMemo(() => {
    const crumbs: Array<{ label: string; go: () => void }> = [
      {
        label: "Macintosh HD",
        go: () => {
          setNav({ kind: "desktop" });
          setSelected(null);
        },
      },
    ];
    if (nav.kind === "trash") {
      crumbs.push({ label: "Recycle Bin", go: () => setSelected(null) });
      return crumbs;
    }
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
    async (row: ContentRow, area: string, space: string) => {
      if (row.kind !== "file" && row.kind !== "document") {
        setMessage("Only files and documents can be moved between webpage folders.");
        return;
      }
      if (!unlocked && !changeCode.trim()) {
        setMessage("Unlock with the content code to move files.");
        return;
      }
      const ok = await onMutate("update", {
        target: row.kind,
        id: row.id,
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
      setMessage("Open a webpage folder first, then drop files into that page.");
      return;
    }
    const fileList = event.dataTransfer.files;
    if (!fileList?.length) {
      const raw = event.dataTransfer.getData("application/x-ke-media");
      if (!raw) return;
      try {
        const payload = JSON.parse(raw) as { kind: ContentKind; id: string };
        const row = pageRows.find((item) => item.kind === payload.kind && item.id === payload.id);
        if (!row) return;
        await relocate(row, nav.page.area, nav.page.space);
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

  function onItemDragStart(event: React.DragEvent, row: ContentRow) {
    if (row.kind !== "file" && row.kind !== "document") return;
    event.dataTransfer.setData(
      "application/x-ke-media",
      JSON.stringify({ kind: row.kind, id: row.id })
    );
    event.dataTransfer.effectAllowed = "move";
  }

  async function deleteRow(row: ContentRow) {
    if (row.kind === "recycle") return;
    if (!row.deleteTarget) return;
    if (!confirm(`Move “${row.label}” to Recycle Bin?`)) return;
    const ok = await onMutate("delete", { target: row.deleteTarget, id: row.id });
    if (ok) {
      setMessage(`Moved “${row.label}” to Recycle Bin.`);
      if (selected?.id === row.id) setSelected(null);
    }
  }

  async function restoreRow(row: ContentRow) {
    if (row.kind !== "recycle") return;
    const mode = String(row.raw.recycleMode || "");
    const ok =
      mode === "content_item"
        ? await onMutate("restore_content_item", { id: String(row.raw.id) })
        : await onMutate("restore_recycle", { id: row.id });
    if (ok) {
      setMessage(`Restored “${row.label}”.`);
      setSelected(null);
    }
  }

  async function purgeRow(row: ContentRow) {
    if (row.kind !== "recycle") return;
    if (!confirm(`Permanently delete “${row.label}”? This cannot be undone.`)) return;
    const mode = String(row.raw.recycleMode || "");
    const ok =
      mode === "content_item"
        ? await onMutate("purge_content_item", { id: String(row.raw.id) })
        : await onMutate("purge_recycle", { id: row.id });
    if (ok) {
      setMessage(`Permanently removed “${row.label}”.`);
      setSelected(null);
    }
  }

  const titleBar =
    nav.kind === "desktop"
      ? "Knowledge Explorer · Macintosh HD"
      : nav.kind === "trash"
        ? "Recycle Bin · Macintosh HD"
        : nav.kind === "section"
          ? `${nav.section.label} · webpage folders`
          : `${nav.page.label} · full page content`;

  const visibleRows = nav.kind === "trash" ? recycleRows : pageRows;
  const recycleCount = recycleRows.length;

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

      <div className="grid min-h-[36rem] gap-0 lg:grid-cols-[1fr_22rem]">
        <div
          className="relative max-h-[70vh] overflow-y-auto bg-[radial-gradient(circle_at_18%_12%,#dce9f7,transparent_42%),linear-gradient(165deg,#5f87a8_0%,#2f4a63_100%)] p-4"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => void onDesktopFileDrop(e)}
        >
          <p className="mb-4 text-center text-[11px] font-medium text-white/90 drop-shadow">
            {nav.kind === "desktop" &&
              "Site sections + Recycle Bin. Open AP to see every subject webpage folder."}
            {nav.kind === "section" &&
              "Each folder is a real webpage. Open it to view and edit concepts, formulas, practice, pictures, and files."}
            {nav.kind === "page" &&
              "Full page storage: custom concepts, formulas, practice, documents, images, and files — edit or delete in the sidebar."}
            {nav.kind === "trash" &&
              "Deleted items land here. Restore them back into the site, or purge forever."}
          </p>

          {nav.kind === "desktop" && (
            <FolderIconGrid
              view={view}
              items={[
                ...sections.map((section) => ({
                  key: section.id,
                  icon: section.icon,
                  label: section.label,
                  meta: `${section.pages.length} pages · ${countInSection(data, section)} items`,
                  onOpen: () => {
                    setNav({ kind: "section", section });
                    setSelected(null);
                  },
                  dropKey: `section:${section.id}`,
                  dragOverKey,
                  setDragOverKey,
                  onDropMedia: async (payload: { kind: "file" | "document"; id: string }) => {
                    const target = section.pages[0];
                    if (!target) return;
                    const sourceRow = [...(data.files || []), ...(data.documents || [])]
                      .map((item) => {
                        const isFile = "mime" in item;
                        return {
                          kind: (isFile ? "file" : "document") as ContentKind,
                          id: item.id,
                          label: isFile ? (item as ManagedFile).name : (item as ManagedDocument).title,
                          meta: "",
                          icon: "",
                          raw: item as unknown as Record<string, unknown>,
                        };
                      })
                      .find((row) => row.kind === payload.kind && row.id === payload.id);
                    if (!sourceRow) return;
                    await relocate(sourceRow, target.area, target.space);
                    setNav({ kind: "page", section, page: target });
                  },
                })),
                {
                  key: "trash",
                  icon: "🗑",
                  label: "Recycle Bin",
                  meta: `${recycleCount} recoverable`,
                  onOpen: () => {
                    setNav({ kind: "trash" });
                    setSelected(null);
                  },
                  dropKey: "trash",
                  dragOverKey,
                  setDragOverKey,
                  onDropMedia: async () => undefined,
                },
              ]}
            />
          )}

          {nav.kind === "section" && (
            <FolderIconGrid
              view={view}
              items={nav.section.pages.map((page) => ({
                key: `${page.area}:${page.space}`,
                icon: page.area === "ap-subject" ? "📘" : "📁",
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
                    {
                      kind: payload.kind,
                      id: source.id,
                      label: "",
                      meta: "",
                      icon: "",
                      raw: source as unknown as Record<string, unknown>,
                    },
                    page.area,
                    page.space
                  );
                },
              }))}
            />
          )}

          {(nav.kind === "page" || nav.kind === "trash") &&
            (visibleRows.length === 0 ? (
              <p className="mt-16 text-center text-sm text-white/85">
                {nav.kind === "trash"
                  ? "Recycle Bin is empty."
                  : "Nothing in this webpage folder yet. Use the sidebar to add concepts, formulas, practice, images, or files."}
              </p>
            ) : view === "icons" ? (
              <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
                {visibleRows.map((row) => {
                  const active = selected?.kind === row.kind && selected.id === row.id;
                  return (
                    <li key={`${row.kind}-${row.id}`}>
                      <button
                        type="button"
                        draggable={row.kind === "file" || row.kind === "document"}
                        onDragStart={(e) => onItemDragStart(e, row)}
                        onClick={() => setSelected(row)}
                        className={`flex w-full flex-col items-center gap-1 rounded-xl p-2 text-center ${
                          active ? "bg-sky-500/40 ring-1 ring-white/50" : "hover:bg-white/15"
                        }`}
                      >
                        {row.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={row.imageUrl}
                            alt=""
                            className="h-14 w-14 rounded-lg object-cover shadow"
                          />
                        ) : (
                          <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-white/90 text-2xl shadow">
                            {row.icon}
                          </span>
                        )}
                        <span className="line-clamp-2 w-full text-[11px] font-medium text-white drop-shadow">
                          {row.label}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <ul className="overflow-hidden rounded-xl bg-white/95 shadow">
                {visibleRows.map((row) => {
                  const active = selected?.kind === row.kind && selected.id === row.id;
                  return (
                    <li key={`${row.kind}-${row.id}`}>
                      <button
                        type="button"
                        draggable={row.kind === "file" || row.kind === "document"}
                        onDragStart={(e) => onItemDragStart(e, row)}
                        onClick={() => setSelected(row)}
                        className={`flex w-full items-center gap-3 border-b border-slate-100 px-3 py-2 text-left text-sm ${
                          active ? "bg-sky-100" : "hover:bg-slate-50"
                        }`}
                      >
                        <span className="text-lg">{row.icon}</span>
                        <span className="min-w-0 flex-1 truncate font-medium">{row.label}</span>
                        <span className="truncate text-xs text-slate-500">{row.meta}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ))}
        </div>

        <aside className="max-h-[70vh] overflow-y-auto border-t border-slate-300 bg-[#f6f6f6] p-3 lg:border-l lg:border-t-0">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Get Info</p>

          {nav.kind === "page" ? (
            <div className="mt-2 space-y-2 text-xs text-slate-600">
              <p>
                <strong className="text-slate-900">{nav.page.label}</strong>
              </p>
              <p>
                Storage: {nav.page.area} / {nav.page.space}
              </p>
              <p>{pageRows.length} items in this webpage</p>
              <Link href={nav.page.href} className="inline-block text-sky-700 underline">
                Open webpage →
              </Link>
            </div>
          ) : nav.kind === "section" ? (
            <p className="mt-3 text-sm text-slate-600">
              Section <strong>{nav.section.label}</strong> — {nav.section.pages.length} webpage
              folders. AP includes every built-in subject.
            </p>
          ) : nav.kind === "trash" ? (
            <p className="mt-3 text-sm text-slate-600">
              Recover deleted concepts, formulas, practice, files, and documents.
            </p>
          ) : (
            <p className="mt-3 text-sm text-slate-600">
              Whole-site editing port. Same storage as every in-page media panel — plus concepts,
              formulas, and practice text.
            </p>
          )}

          {selected ? (
            <div className="mt-4 space-y-3 border-t border-slate-200 pt-3">
              <div className="flex justify-center">
                {selected.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selected.imageUrl}
                    alt=""
                    className="max-h-40 rounded-lg object-contain shadow"
                  />
                ) : (
                  <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white text-3xl shadow">
                    {selected.icon}
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-slate-900">{selected.label}</p>
              <p className="text-[11px] text-slate-500">{selected.meta}</p>
              {selected.previewText ? (
                <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2 text-xs">
                  <RichContent className="text-xs">{selected.previewText}</RichContent>
                </div>
              ) : null}
              {selected.href ? (
                <Link href={selected.href} className="inline-flex text-xs font-medium text-sky-700 underline">
                  Open on site →
                </Link>
              ) : null}
              {selected.kind === "file" && !selected.imageUrl ? (
                selected.raw.dataUrl ? (
                  <a
                    href={String(selected.raw.dataUrl)}
                    download={selected.label}
                    className="inline-flex text-xs font-medium text-sky-700 underline"
                  >
                    Download
                  </a>
                ) : (
                  <button
                    type="button"
                    className="inline-flex text-xs font-medium text-sky-700 underline"
                    onClick={async () => {
                      try {
                        const res = await fetch(`/api/edit?fileId=${encodeURIComponent(String(selected.id))}`, {
                          cache: "no-store",
                        });
                        const payload = await res.json();
                        const dataUrl = payload?.file?.dataUrl;
                        if (!res.ok || !dataUrl) throw new Error(payload?.error || "Download unavailable");
                        const link = document.createElement("a");
                        link.href = String(dataUrl);
                        link.download = selected.label;
                        link.click();
                      } catch (error) {
                        setMessage(error instanceof Error ? error.message : "Download failed");
                      }
                    }}
                  >
                    Download
                  </button>
                )
              ) : null}

              {selected.kind === "recycle" ? (
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    className="btn-primary w-full text-xs"
                    onClick={() => void restoreRow(selected)}
                  >
                    Restore
                  </button>
                  <button
                    type="button"
                    className="btn-ghost w-full text-xs text-red-600"
                    onClick={() => void purgeRow(selected)}
                  >
                    Delete forever
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {selected.editTarget ? (
                    <ResourceEditor
                      target={selected.editTarget}
                      item={{
                        id: selected.id,
                        title: selected.label,
                        name: selected.label,
                        summary: String(selected.raw.summary || ""),
                        content: String(selected.raw.content || selected.previewText || ""),
                        expression: String(selected.raw.expression || ""),
                        description: String(selected.raw.description || ""),
                        note: String(selected.raw.note || ""),
                        category: String(selected.raw.category || ""),
                        mime: String(selected.raw.mime || ""),
                        dataUrl: selected.raw.dataUrl ? String(selected.raw.dataUrl) : undefined,
                      }}
                      onSaved={(content) => {
                        if (content) onContent(content as ManagedContent);
                      }}
                    />
                  ) : null}
                  <button
                    type="button"
                    className="btn-ghost w-full text-xs text-red-600"
                    onClick={() => void deleteRow(selected)}
                  >
                    Move to Recycle Bin
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">Select an item to preview, edit, or delete.</p>
          )}

          {nav.kind === "page" ? (
            <div className="mt-6 space-y-2 border-t border-slate-200 pt-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Add into this webpage
              </p>
              <ChangePanel
                mode="file"
                label="+ Upload file"
                folderArea={nav.page.area}
                spaceKey={nav.page.space}
                onSaved={(content) => {
                  if (content) onContent(content as ManagedContent);
                }}
              />
              <ChangePanel
                mode="file"
                label="+ Upload image"
                fileAccept="image/*"
                folderArea={nav.page.area}
                spaceKey={nav.page.space}
                onSaved={(content) => {
                  if (content) onContent(content as ManagedContent);
                }}
              />
              <ChangePanel
                mode="document"
                folderArea={nav.page.area}
                spaceKey={nav.page.space}
                onSaved={(content) => {
                  if (content) onContent(content as ManagedContent);
                }}
              />
              <ChangePanel
                mode="folder"
                label="+ Add file folder"
                folderArea={nav.page.area}
                spaceKey={nav.page.space}
                onSaved={(content) => {
                  if (content) onContent(content as ManagedContent);
                }}
              />
              {pageSupportsLearningContent(nav.page) ? (
                <>
                  <ChangePanel
                    mode="concept"
                    label="+ Add concept"
                    defaultSubject={pageDefaultSubject(nav.page)}
                    folderArea={nav.page.area === "ap-subject" ? "concepts" : nav.page.area}
                    spaceKey={nav.page.space}
                    onSaved={(content) => {
                      if (content) onContent(content as ManagedContent);
                    }}
                  />
                  <ChangePanel
                    mode="topic"
                    label="+ Add topic"
                    defaultSubject={pageDefaultSubject(nav.page)}
                    folderArea={nav.page.area === "ap-subject" ? "concepts" : nav.page.area}
                    spaceKey={nav.page.space}
                    onSaved={(content) => {
                      if (content) onContent(content as ManagedContent);
                    }}
                  />
                  <ChangePanel
                    mode="formula"
                    label="+ Add formula"
                    defaultSubject={pageDefaultSubject(nav.page)}
                    folderArea={nav.page.area === "ap-subject" ? "formulas" : nav.page.area}
                    spaceKey={nav.page.space}
                    onSaved={(content) => {
                      if (content) onContent(content as ManagedContent);
                    }}
                  />
                  <ChangePanel
                    mode="questionnaire"
                    label="+ Add practice set"
                    defaultSubject={pageDefaultSubject(nav.page)}
                    folderArea={nav.page.area === "ap-subject" ? "practice" : nav.page.area}
                    spaceKey={nav.page.space}
                    onSaved={(content) => {
                      if (content) onContent(content as ManagedContent);
                    }}
                  />
                </>
              ) : null}
            </div>
          ) : null}

          {nav.kind === "desktop" ? (
            <div className="mt-6 border-t border-slate-200 pt-3">
              <button
                type="button"
                className="btn-secondary w-full text-xs"
                onClick={() => {
                  setNav({ kind: "trash" });
                  setSelected(null);
                }}
              >
                Open Recycle Bin ({recycleCount})
              </button>
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
