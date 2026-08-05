"use client";

import { useEffect, useMemo, useState } from "react";
import ResourceEditor from "@/components/ResourceEditor";
import type { ManagedContent, ManagedDocument, ManagedFile } from "@/lib/managed-types";
import { fetchManagedFileDataUrl, isImageFile } from "@/lib/media-files";
import { matchesMediaSearch } from "@/lib/media-month-buckets";

type FileRow = {
  kind: "file";
  item: ManagedFile;
  timestamp: number;
  title: string;
  subtitle?: string;
  searchFields: string[];
};

type DocumentRow = {
  kind: "document";
  item: ManagedDocument;
  timestamp: number;
  title: string;
  subtitle?: string;
  searchFields: string[];
};

export type MediaRow = FileRow | DocumentRow;

type Props = {
  sectionTitle: string;
  sectionHint?: string;
  emptyMessage: string;
  rows: MediaRow[];
  variant: "image" | "file" | "document";
  onDownload: (row: MediaRow) => void | Promise<void>;
  editMode?: boolean;
  /** Show Delete (−) even when not in edit mode (still needs change code on the parent handler). */
  showDelete?: boolean;
  deletingId?: string | null;
  onDelete?: (row: MediaRow) => void;
  onContentSaved?: (content: ManagedContent) => void;
  /** Currently previewed item id (shared across the three columns). */
  selectedId?: string | null;
  onSelect?: (row: MediaRow) => void;
  baseUpdatedAt?: number;
};

function FileGlyph({ variant }: { variant: "image" | "file" | "document" }) {
  if (variant === "image") {
    return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-sm">
        🖼
      </span>
    );
  }
  if (variant === "document") {
    return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-sm">
        📄
      </span>
    );
  }
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sm">
      📎
    </span>
  );
}

function ImageThumb({ file }: { file: ManagedFile }) {
  const [src, setSrc] = useState(
    file.dataUrl?.startsWith("data:image") ? file.dataUrl : ""
  );

  useEffect(() => {
    if (file.dataUrl?.startsWith("data:image")) {
      setSrc(file.dataUrl);
      return;
    }
    if (!isImageFile(file)) return;
    let cancelled = false;
    void fetchManagedFileDataUrl(file.id)
      .then((url) => {
        if (!cancelled) setSrc(url);
      })
      .catch(() => {
        /* keep glyph */
      });
    return () => {
      cancelled = true;
    };
  }, [file.id, file.dataUrl, file.mime, file.name]);

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        className="h-10 w-10 shrink-0 rounded-md object-cover"
        loading="lazy"
      />
    );
  }
  return <FileGlyph variant="image" />;
}

/**
 * Simple vertical file column — one type per column (images / files / documents).
 * Newest first, search filter, no month-folder abstraction.
 */
export default function MediaFinderBrowser({
  sectionTitle,
  sectionHint,
  emptyMessage,
  rows,
  variant,
  onDownload,
  editMode = false,
  showDelete = false,
  deletingId = null,
  onDelete,
  onContentSaved,
  selectedId = null,
  onSelect,
  baseUpdatedAt,
}: Props) {
  const [search, setSearch] = useState("");
  const canDelete = Boolean(onDelete) && (editMode || showDelete);

  const sortedRows = useMemo(
    () => [...rows].sort((a, b) => b.timestamp - a.timestamp),
    [rows]
  );

  const visibleRows = useMemo(() => {
    if (!search.trim()) return sortedRows;
    return sortedRows.filter((row) => matchesMediaSearch(search, row.searchFields));
  }, [sortedRows, search]);

  function renderRowActions(row: MediaRow) {
    return (
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
        <button
          type="button"
          onClick={() => onSelect?.(row)}
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[10px] font-semibold text-slate-700 hover:bg-slate-50"
        >
          Preview
        </button>
        <button
          type="button"
          onClick={() => void onDownload(row)}
          className="rounded-md bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white hover:bg-slate-800"
        >
          Download
        </button>
        {editMode && row.kind === "file" ? (
          <ResourceEditor
            target="file"
            item={row.item}
            label="Edit"
            baseUpdatedAt={baseUpdatedAt}
            onSaved={(content) => {
              if (content) onContentSaved?.(content as ManagedContent);
            }}
          />
        ) : null}
        {editMode && row.kind === "document" ? (
          <ResourceEditor
            target="document"
            item={row.item}
            baseUpdatedAt={baseUpdatedAt}
            onSaved={(content) => {
              if (content) onContentSaved?.(content as ManagedContent);
            }}
          />
        ) : null}
        {canDelete && (row.kind === "file" || row.kind === "document") ? (
          <button
            type="button"
            title="Delete"
            disabled={deletingId === row.item.id}
            onClick={() => onDelete?.(row)}
            className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-700 hover:bg-red-100"
          >
            Delete
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <section className="flex h-[min(26rem,50vh)] min-h-[18rem] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="shrink-0 space-y-2 border-b border-slate-100 bg-slate-50 px-3 py-2.5">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {sectionTitle}
          </h3>
          {sectionHint ? <p className="text-[11px] text-slate-400">{sectionHint}</p> : null}
          <p className="text-[11px] text-slate-500">
            {visibleRows.length} item{visibleRows.length === 1 ? "" : "s"}
            {search.trim() ? " · filtered" : " · scroll inside"}
          </p>
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${variant === "image" ? "images" : variant === "document" ? "documents" : "files"}…`}
          className="input w-full text-xs"
          aria-label={`Search ${sectionTitle}`}
        />
      </div>

      {/* Fixed-height list: scroll stays inside this column, panel does not grow with files */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {rows.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-slate-500">{emptyMessage}</p>
        ) : visibleRows.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-slate-500">No matches.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {visibleRows.map((row) => {
              const active = selectedId === row.item.id;
              return (
                <li
                  key={row.item.id}
                  className={`flex flex-col gap-2 px-2.5 py-2.5 sm:flex-row sm:items-center ${
                    active
                      ? "bg-brand-50 ring-1 ring-inset ring-brand-200"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelect?.(row)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    {variant === "image" && row.kind === "file" ? (
                      <ImageThumb file={row.item} />
                    ) : (
                      <FileGlyph variant={variant} />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900" title={row.title}>
                        {row.title}
                      </p>
                      {row.subtitle ? (
                        <p className="truncate text-[11px] text-slate-500">{row.subtitle}</p>
                      ) : null}
                    </div>
                  </button>
                  {renderRowActions(row)}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
