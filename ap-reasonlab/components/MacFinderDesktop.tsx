"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import ChangePanel from "@/components/ChangePanel";
import LocalAiRecommendation from "@/components/LocalAiRecommendation";
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
import { fetchManagedFileDataUrl, isImageFile } from "@/lib/media-files";
import {
  SITE_SECTION_FOLDERS,
  apSubjectPageFolders,
  collectDynamicPageFolders,
  type SitePageFolder,
  type SiteSectionFolder,
} from "@/lib/site-media-map";
import {
  ROOT_SPACE,
  folderSpaceId,
  matchesFolderItem,
  matchesSpace,
  normalizeSpace,
  spaceAliases,
} from "@/lib/storage-space";
import { assertUploadableDataUrl, assertUploadableFile } from "@/lib/upload-limits";

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
  /** True when this file is an image (dataUrl may still need hydration). */
  isImageRow?: boolean;
  href?: string;
  raw: Record<string, unknown>;
  editTarget?: EditableTarget;
  deleteTarget?: string;
  /** 1-based order among files in this folder (Apple-style series). */
  seriesIndex?: number;
  uploadedAt?: number;
};

type FolderTrailEntry = { id: string; title: string };

type NavLevel =
  | { kind: "desktop" }
  | { kind: "section"; section: SiteSectionFolder }
  | {
      kind: "page";
      section: SiteSectionFolder;
      page: SitePageFolder;
      /** Nested file folders opened under this webpage (Finder drill-down). */
      folderTrail?: FolderTrailEntry[];
    }
  | { kind: "trash" };

type Props = {
  data: Partial<ManagedContent>;
  changeCode: string;
  githubToken: string;
  onMutate: (action: string, extra: Record<string, unknown>) => Promise<boolean>;
  onContent: (content: Partial<ManagedContent>) => void;
};

function FinderImageThumb({
  fileId,
  imageUrl,
  icon,
  sizeClass,
}: {
  fileId: string;
  imageUrl?: string;
  icon: string;
  sizeClass: string;
}) {
  const [src, setSrc] = useState(imageUrl || "");

  useEffect(() => {
    if (imageUrl) {
      setSrc(imageUrl);
      return;
    }
    let cancelled = false;
    void fetchManagedFileDataUrl(fileId)
      .then((url) => {
        if (!cancelled) setSrc(url);
      })
      .catch(() => {
        /* keep glyph */
      });
    return () => {
      cancelled = true;
    };
  }, [fileId, imageUrl]);

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" className={`${sizeClass} rounded-lg object-cover shadow`} />
    );
  }
  return (
    <span
      className={`flex ${sizeClass} items-center justify-center rounded-lg bg-white/90 shadow ${
        sizeClass.includes("h-6") ? "text-sm" : "text-2xl"
      }`}
    >
      {icon}
    </span>
  );
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

function kindRank(kind: ContentKind): number {
  switch (kind) {
    case "folder":
      return 0;
    case "document":
      return 1;
    case "file":
      return 2;
    case "concept":
      return 3;
    case "formula":
      return 4;
    case "questionnaire":
      return 5;
    default:
      return 9;
  }
}

function compareLabels(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function activePageSpace(nav: Extract<NavLevel, { kind: "page" }>): string {
  const trail = nav.folderTrail || [];
  if (trail.length > 0) return folderSpaceId(trail[trail.length - 1].id);
  return normalizeSpace(nav.page.space);
}

function collectPageRows(
  data: Partial<ManagedContent>,
  page: SitePageFolder,
  spaceOverride?: string
): ContentRow[] {
  const scoped = normalizeSpace(spaceOverride ?? page.space);
  const nestedFolder = scoped.startsWith("folder:");
  const rows: ContentRow[] = [];

  for (const folder of data.folders || []) {
    if (folder.area === page.area && normalizeSpace(folder.space) === scoped) {
      rows.push({
        kind: "folder",
        id: folder.id,
        label: folder.title,
        meta: "File folder",
        icon: "📁",
        previewText: folder.note || "Double-click to open this file folder.",
        raw: folder as unknown as Record<string, unknown>,
        editTarget: "folder",
        deleteTarget: "folder",
        uploadedAt: folder.createdAt,
      });
    }
  }

  const fileRows: ContentRow[] = [];
  for (const file of data.files || []) {
    const inHere = nestedFolder
      ? matchesSpace(file, page.area, scoped)
      : matchesFolderItem(file, page.area, scoped);
    if (!inHere) continue;
    const image = isImageFile(file);
    fileRows.push({
      kind: "file",
      id: file.id,
      label: file.name,
      meta: file.mime || "file",
      icon: image ? "🖼" : "📎",
      imageUrl: image ? file.dataUrl : undefined,
      isImageRow: image,
      previewText: file.note || file.area || undefined,
      raw: file as unknown as Record<string, unknown>,
      editTarget: "file",
      deleteTarget: "file",
      uploadedAt: file.uploadedAt,
    });
  }
  fileRows.sort((a, b) => {
    const byName = compareLabels(a.label, b.label);
    if (byName !== 0) return byName;
    return (a.uploadedAt || 0) - (b.uploadedAt || 0);
  });
  fileRows.forEach((row, index) => {
    row.seriesIndex = index + 1;
    row.meta = `File ${index + 1} · ${row.meta}`;
  });
  rows.push(...fileRows);

  for (const doc of data.documents || []) {
    const inHere = nestedFolder
      ? matchesSpace(doc, page.area, scoped)
      : matchesFolderItem(doc, page.area, scoped);
    if (!inHere) continue;
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
      uploadedAt: doc.updatedAt,
    });
  }

  // Learning content only on webpage root — not inside nested file folders.
  if (!nestedFolder && pageSupportsLearningContent(page)) {
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

  return rows.sort((a, b) => {
    const byKind = kindRank(a.kind) - kindRank(b.kind);
    if (byKind !== 0) return byKind;
    if (a.kind === "file" && b.kind === "file") {
      return (a.seriesIndex || 0) - (b.seriesIndex || 0);
    }
    return compareLabels(a.label, b.label);
  });
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
  const [selectedImageSrc, setSelectedImageSrc] = useState("");
  const [message, setMessage] = useState("");
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  useEffect(() => {
    if (!selected?.isImageRow) {
      setSelectedImageSrc("");
      return;
    }
    if (selected.imageUrl) {
      setSelectedImageSrc(selected.imageUrl);
      return;
    }
    let cancelled = false;
    setSelectedImageSrc("");
    void fetchManagedFileDataUrl(selected.id)
      .then((url) => {
        if (!cancelled) setSelectedImageSrc(url);
      })
      .catch(() => {
        if (!cancelled) setSelectedImageSrc("");
      });
    return () => {
      cancelled = true;
    };
  }, [selected]);

  const dynamicPages = useMemo(
    () =>
      collectDynamicPageFolders(data.files || [], data.documents || [], data.folders || [], {
        deletedIds: data.deletedIds || [],
      }),
    [data.deletedIds, data.documents, data.files, data.folders]
  );

  const catalogSubjects = useMemo(() => apSubjectPageFolders(), []);

  const sections = useMemo(() => {
    const isApScoped = (p: SitePageFolder) =>
      p.area === "ap-subject" ||
      p.area === "practice" ||
      p.area === "concepts" ||
      p.area === "formulas" ||
      p.area === "past-papers";

    const subjectPages = [
      ...catalogSubjects,
      ...dynamicPages.filter(
        (p) =>
          p.area === "ap-subject" &&
          !catalogSubjects.some((c) => c.space === p.space || spaceAliases(c.space).has(p.space))
      ),
      ...dynamicPages.filter((p) => isApScoped(p) && p.area !== "ap-subject"),
    ];
    const otherDynamic = dynamicPages.filter((p) => !isApScoped(p));

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
    return collectPageRows(data, nav.page, activePageSpace(nav));
  }, [data, nav]);

  const storageSpace = nav.kind === "page" ? activePageSpace(nav) : ROOT_SPACE;
  const fileSeriesCount = useMemo(
    () => pageRows.filter((row) => row.kind === "file").length,
    [pageRows]
  );
  const folderCount = useMemo(
    () => pageRows.filter((row) => row.kind === "folder").length,
    [pageRows]
  );

  // Prefer Apple-like list when a folder has many items.
  const effectiveView = pageRows.length > 36 ? "list" : view;

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
        go: () => {
          setNav({ kind: "page", section: nav.section, page: nav.page, folderTrail: [] });
          setSelected(null);
        },
      });
      const trail = nav.folderTrail || [];
      trail.forEach((folder, index) => {
        crumbs.push({
          label: folder.title,
          go: () => {
            setNav({
              kind: "page",
              section: nav.section,
              page: nav.page,
              folderTrail: trail.slice(0, index + 1),
            });
            setSelected(null);
          },
        });
      });
    }
    return crumbs;
  }, [nav]);

  function openFolderRow(row: ContentRow) {
    if (nav.kind !== "page" || row.kind !== "folder") return;
    setNav({
      kind: "page",
      section: nav.section,
      page: nav.page,
      folderTrail: [...(nav.folderTrail || []), { id: row.id, title: row.label }],
    });
    setSelected(null);
    setMessage(`Opened folder “${row.label}”.`);
  }

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
        await relocate(row, nav.page.area, storageSpace);
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
      try {
        assertUploadableFile(file);
        const dataUrl = await readAsDataUrl(file);
        assertUploadableDataUrl(dataUrl, file.name);
        items.push({
          name: file.name,
          mime: file.type || "application/octet-stream",
          dataUrl,
          area: nav.page.area,
          space: storageSpace,
        });
      } catch (err) {
        setMessage(err instanceof Error ? err.message : `${file.name} rejected.`);
      }
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

  async function emptyRecycleBin() {
    if (recycleRows.length === 0) {
      setMessage("垃圾桶已经是空的。");
      return;
    }
    if (
      !confirm(
        `清空垃圾桶？\n\n将永久删除全部 ${recycleRows.length} 项，无法恢复。`
      )
    ) {
      return;
    }
    const ok = await onMutate("empty_recycle", {});
    if (ok) {
      setMessage("垃圾桶已清空。");
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
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-400 bg-gradient-to-b from-[#e8e8e8] to-[#d0d0d0] px-3 py-2">
        <div className="flex gap-1.5" aria-hidden>
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        </div>
        <p className="min-w-0 flex-1 truncate text-center text-xs font-semibold text-slate-700">
          {titleBar}
        </p>
        {nav.kind === "trash" ? (
          <button
            type="button"
            disabled={recycleCount === 0}
            onClick={() => void emptyRecycleBin()}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-[11px] font-bold text-white shadow hover:bg-red-700 disabled:opacity-40"
          >
            一键清空{recycleCount ? ` (${recycleCount})` : ""}
          </button>
        ) : null}
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setView("icons")}
            className={`rounded px-2 py-0.5 text-[10px] font-medium ${
              effectiveView === "icons" ? "bg-white shadow" : "text-slate-600 hover:bg-white/60"
            }`}
          >
            Icons
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={`rounded px-2 py-0.5 text-[10px] font-medium ${
              effectiveView === "list" ? "bg-white shadow" : "text-slate-600 hover:bg-white/60"
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
              (nav.folderTrail?.length
                ? `File folder · ${folderCount} folders · ${fileSeriesCount} files in order (File 1, File 2…). Double-click a folder to open it.`
                : `Webpage storage · ${folderCount} file folders · ${fileSeriesCount} files. Use folders so large libraries stay browsable — double-click a folder to open.`)}
            {nav.kind === "trash" &&
              "Deleted items land here. Restore them back into the site, or purge forever."}
          </p>

          {nav.kind === "desktop" && (
            <div className="mb-4 max-w-xl mx-auto">
              <LocalAiRecommendation variant="hero" compact />
            </div>
          )}

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
                    setNav({ kind: "page", section, page: target, folderTrail: [] });
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
                  setNav({ kind: "page", section: nav.section, page, folderTrail: [] });
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

          {nav.kind === "trash" && (
            <div className="mb-3 rounded-xl border-2 border-red-400 bg-red-50/95 p-3 shadow">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold text-red-950">
                  垃圾桶里有 {recycleCount} 项 · Empty Recycle Bin
                </p>
                <button
                  type="button"
                  disabled={recycleCount === 0}
                  onClick={() => void emptyRecycleBin()}
                  className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-red-700 disabled:opacity-40"
                >
                  一键清空垃圾桶{recycleCount ? ` (${recycleCount})` : ""}
                </button>
              </div>
            </div>
          )}

          {(nav.kind === "page" || nav.kind === "trash") &&
            (visibleRows.length === 0 ? (
              <p className="mt-16 text-center text-sm text-white/85">
                {nav.kind === "trash"
                  ? "Recycle Bin is empty."
                  : nav.kind === "page" && (nav.folderTrail?.length || 0) > 0
                    ? "This file folder is empty. Drop files here or use + Upload in the sidebar."
                    : "Nothing in this webpage folder yet. Add a file folder, then put files inside — like Finder."}
              </p>
            ) : effectiveView === "icons" ? (
              <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {visibleRows.map((row) => {
                  const active = selected?.kind === row.kind && selected.id === row.id;
                  return (
                    <li key={`${row.kind}-${row.id}`}>
                      <button
                        type="button"
                        draggable={row.kind === "file" || row.kind === "document"}
                        onDragStart={(e) => onItemDragStart(e, row)}
                        onDragOver={(e) => {
                          if (row.kind !== "folder") return;
                          e.preventDefault();
                          setDragOverKey(`folder:${row.id}`);
                        }}
                        onDragLeave={() => setDragOverKey(null)}
                        onDrop={(e) => {
                          if (nav.kind !== "page" || row.kind !== "folder") return;
                          e.preventDefault();
                          e.stopPropagation();
                          setDragOverKey(null);
                          const raw = e.dataTransfer.getData("application/x-ke-media");
                          if (!raw) return;
                          try {
                            const payload = JSON.parse(raw) as { kind: ContentKind; id: string };
                            const source = pageRows.find(
                              (item) => item.kind === payload.kind && item.id === payload.id
                            );
                            if (!source) return;
                            void relocate(source, nav.page.area, folderSpaceId(row.id));
                          } catch {
                            /* ignore */
                          }
                        }}
                        onClick={() => setSelected(row)}
                        onDoubleClick={() => {
                          if (row.kind === "folder") openFolderRow(row);
                        }}
                        className={`flex w-full flex-col items-center gap-1 rounded-xl p-2 text-center ${
                          dragOverKey === `folder:${row.id}`
                            ? "bg-amber-400/40 ring-2 ring-white/70"
                            : active
                              ? "bg-sky-500/40 ring-1 ring-white/50"
                              : "hover:bg-white/15"
                        }`}
                      >
                        {row.kind === "folder" ? (
                          <span className="relative flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-b from-amber-200 to-amber-400 text-3xl shadow-lg">
                            📁
                          </span>
                        ) : row.isImageRow ? (
                          <FinderImageThumb
                            fileId={row.id}
                            imageUrl={row.imageUrl}
                            icon={row.icon}
                            sizeClass="h-14 w-14"
                          />
                        ) : (
                          <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-white/90 text-2xl shadow">
                            {row.icon}
                          </span>
                        )}
                        {row.kind === "file" && row.seriesIndex ? (
                          <span className="rounded bg-black/35 px-1.5 text-[9px] font-bold text-white">
                            File {row.seriesIndex}
                          </span>
                        ) : null}
                        <span className="line-clamp-2 w-full text-[11px] font-medium text-white drop-shadow">
                          {row.label}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="overflow-hidden rounded-xl bg-white/95 shadow">
                <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_7rem_6rem] gap-2 border-b border-slate-200 bg-slate-100 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  <span>#</span>
                  <span>Name</span>
                  <span>Kind</span>
                  <span className="text-right">Date</span>
                </div>
                <ul>
                  {visibleRows.map((row) => {
                    const active = selected?.kind === row.kind && selected.id === row.id;
                    const dateLabel = row.uploadedAt
                      ? new Date(row.uploadedAt).toLocaleDateString()
                      : "—";
                    return (
                      <li key={`${row.kind}-${row.id}`}>
                        <button
                          type="button"
                          draggable={row.kind === "file" || row.kind === "document"}
                          onDragStart={(e) => onItemDragStart(e, row)}
                          onDragOver={(e) => {
                            if (row.kind !== "folder") return;
                            e.preventDefault();
                            setDragOverKey(`folder:${row.id}`);
                          }}
                          onDragLeave={() => setDragOverKey(null)}
                          onDrop={(e) => {
                            if (nav.kind !== "page" || row.kind !== "folder") return;
                            e.preventDefault();
                            e.stopPropagation();
                            setDragOverKey(null);
                            const raw = e.dataTransfer.getData("application/x-ke-media");
                            if (!raw) return;
                            try {
                              const payload = JSON.parse(raw) as { kind: ContentKind; id: string };
                              const source = pageRows.find(
                                (item) => item.kind === payload.kind && item.id === payload.id
                              );
                              if (!source) return;
                              void relocate(source, nav.page.area, folderSpaceId(row.id));
                            } catch {
                              /* ignore */
                            }
                          }}
                          onClick={() => setSelected(row)}
                          onDoubleClick={() => {
                            if (row.kind === "folder") openFolderRow(row);
                          }}
                          className={`grid w-full grid-cols-[2.5rem_minmax(0,1fr)_7rem_6rem] items-center gap-2 border-b border-slate-100 px-3 py-2 text-left text-sm ${
                            dragOverKey === `folder:${row.id}`
                              ? "bg-amber-50"
                              : active
                                ? "bg-sky-100"
                                : "hover:bg-slate-50"
                          }`}
                        >
                          <span className="text-xs font-semibold text-slate-400">
                            {row.kind === "file" && row.seriesIndex
                              ? row.seriesIndex
                              : row.kind === "folder"
                                ? "📁"
                                : "·"}
                          </span>
                          <span className="flex min-w-0 items-center gap-2">
                            {row.isImageRow ? (
                              <FinderImageThumb
                                fileId={row.id}
                                imageUrl={row.imageUrl}
                                icon={row.icon}
                                sizeClass="h-6 w-6"
                              />
                            ) : (
                              <span className="text-base">{row.icon}</span>
                            )}
                            <span className="truncate font-medium text-slate-900">{row.label}</span>
                          </span>
                          <span className="truncate text-xs text-slate-500">
                            {row.kind === "file" && row.seriesIndex
                              ? `File ${row.seriesIndex}`
                              : row.kind === "folder"
                                ? "Folder"
                                : row.meta}
                          </span>
                          <span className="truncate text-right text-xs text-slate-400">{dateLabel}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
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
                Storage: {nav.page.area} / {storageSpace}
              </p>
              <p>
                {folderCount} folders · {fileSeriesCount} files
                {pageRows.length > fileSeriesCount + folderCount
                  ? ` · ${pageRows.length} items total`
                  : ""}
              </p>
              {(nav.folderTrail?.length || 0) > 0 ? (
                <p className="text-[11px] text-amber-800">
                  Inside file folder — files here are ordered File 1, File 2, File 3…
                </p>
              ) : (
                <p className="text-[11px] text-slate-500">
                  Tip: create file folders, then drag files into them. Double-click a folder to open.
                </p>
              )}
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
            <div className="mt-3 space-y-3 text-sm text-slate-600">
              <p>Recover deleted concepts, formulas, practice, files, and documents — or empty all.</p>
              <button
                type="button"
                disabled={recycleCount === 0}
                onClick={() => void emptyRecycleBin()}
                className="w-full rounded-xl bg-red-600 px-3 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                一键清空垃圾桶{recycleCount ? ` (${recycleCount})` : ""}
              </button>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-600">
              Whole-site editing port. Same storage as every in-page media panel — plus concepts,
              formulas, and practice text.
            </p>
          )}

          {selected ? (
            <div className="mt-4 space-y-3 border-t border-slate-200 pt-3">
              <div className="flex justify-center">
                {selected.isImageRow && selectedImageSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedImageSrc}
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
              {selected.kind === "folder" && nav.kind === "page" ? (
                <button
                  type="button"
                  className="btn-primary w-full text-xs"
                  onClick={() => openFolderRow(selected)}
                >
                  Open file folder
                </button>
              ) : null}
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
              {selected.kind === "file" ? (
                selected.raw.dataUrl || selectedImageSrc ? (
                  <a
                    href={String(selected.raw.dataUrl || selectedImageSrc)}
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
                        const dataUrl = await fetchManagedFileDataUrl(String(selected.id));
                        const link = document.createElement("a");
                        link.href = dataUrl;
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
                      baseUpdatedAt={typeof data.updatedAt === "number" ? data.updatedAt : undefined}
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
                {storageSpace !== nav.page.space ? " · current folder" : ""}
              </p>
              <ChangePanel
                mode="file"
                label="+ Upload files"
                folderArea={nav.page.area}
                spaceKey={storageSpace}
                baseUpdatedAt={typeof data.updatedAt === "number" ? data.updatedAt : undefined}
                onSaved={(content) => {
                  if (content) onContent(content as ManagedContent);
                }}
              />
              <ChangePanel
                mode="file"
                label="+ Upload images"
                fileAccept="image/*"
                folderArea={nav.page.area}
                spaceKey={storageSpace}
                baseUpdatedAt={typeof data.updatedAt === "number" ? data.updatedAt : undefined}
                onSaved={(content) => {
                  if (content) onContent(content as ManagedContent);
                }}
              />
              <ChangePanel
                mode="document"
                label="+ Add documents"
                folderArea={nav.page.area}
                spaceKey={storageSpace}
                baseUpdatedAt={typeof data.updatedAt === "number" ? data.updatedAt : undefined}
                onSaved={(content) => {
                  if (content) onContent(content as ManagedContent);
                }}
              />
              <ChangePanel
                mode="folder"
                label="+ Add file folders"
                folderArea={nav.page.area}
                spaceKey={storageSpace}
                baseUpdatedAt={typeof data.updatedAt === "number" ? data.updatedAt : undefined}
                onSaved={(content) => {
                  if (content) onContent(content as ManagedContent);
                }}
              />
              {pageSupportsLearningContent(nav.page) ? (
                <>
                  <ChangePanel
                    mode="concept"
                    label="+ Add concepts"
                    defaultSubject={pageDefaultSubject(nav.page)}
                    folderArea={nav.page.area === "ap-subject" ? "concepts" : nav.page.area}
                    spaceKey={nav.page.space}
                    baseUpdatedAt={typeof data.updatedAt === "number" ? data.updatedAt : undefined}
                    onSaved={(content) => {
                      if (content) onContent(content as ManagedContent);
                    }}
                  />
                  <ChangePanel
                    mode="topic"
                    label="+ Add topics"
                    defaultSubject={pageDefaultSubject(nav.page)}
                    folderArea={nav.page.area === "ap-subject" ? "concepts" : nav.page.area}
                    spaceKey={nav.page.space}
                    baseUpdatedAt={typeof data.updatedAt === "number" ? data.updatedAt : undefined}
                    onSaved={(content) => {
                      if (content) onContent(content as ManagedContent);
                    }}
                  />
                  <ChangePanel
                    mode="formula"
                    label="+ Add formulas"
                    defaultSubject={pageDefaultSubject(nav.page)}
                    folderArea={nav.page.area === "ap-subject" ? "formulas" : nav.page.area}
                    spaceKey={nav.page.space}
                    baseUpdatedAt={typeof data.updatedAt === "number" ? data.updatedAt : undefined}
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
                    baseUpdatedAt={typeof data.updatedAt === "number" ? data.updatedAt : undefined}
                    onSaved={(content) => {
                      if (content) onContent(content as ManagedContent);
                    }}
                  />
                </>
              ) : null}
            </div>
          ) : null}

          {nav.kind === "desktop" ? (
            <div className="mt-6 space-y-2 border-t border-slate-200 pt-3">
              <button
                type="button"
                className="btn-secondary w-full text-xs"
                onClick={() => {
                  setNav({ kind: "trash" });
                  setSelected(null);
                }}
              >
                打开垃圾桶 Recycle Bin ({recycleCount})
              </button>
              <button
                type="button"
                disabled={recycleCount === 0}
                className="w-full rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-40"
                onClick={() => void emptyRecycleBin()}
              >
                一键清空垃圾桶{recycleCount ? ` (${recycleCount})` : ""}
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
