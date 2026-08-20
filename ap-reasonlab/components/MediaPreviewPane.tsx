"use client";

import { useEffect, useState } from "react";
import RichContent from "@/components/RichContent";
import type { MediaRow } from "@/components/MediaFinderBrowser";
import type { ManagedFile } from "@/lib/managed-types";
import { fetchManagedFileById, isImageFile } from "@/lib/media-files";

type Props = {
  selection: MediaRow | null;
  onClose: () => void;
  onDownload: (row: MediaRow) => void | Promise<void>;
};

function formatBytesFromDataUrl(dataUrl?: string): string {
  if (!dataUrl) return "";
  const comma = dataUrl.indexOf(",");
  const b64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  const bytes = Math.floor((b64.length * 3) / 4);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Large preview pane under the Images | Files | Documents columns.
 */
export default function MediaPreviewPane({ selection, onClose, onDownload }: Props) {
  const [filePayload, setFilePayload] = useState<ManagedFile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setFilePayload(null);
    setError("");

    if (!selection || selection.kind !== "file") {
      setLoading(false);
      return;
    }

    const existing = selection.item.dataUrl;
    if (existing) {
      setFilePayload(selection.item);
      setLoading(false);
      return;
    }

    setLoading(true);
    void (async () => {
      try {
        const file = await fetchManagedFileById(selection.item.id);
        if (cancelled) return;
        setFilePayload(file);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Preview failed");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selection]);

  if (!selection) {
    return (
      <section
        id="media-preview"
        className="scroll-mt-24 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center"
      >
        <p className="text-sm font-semibold text-slate-700">Preview</p>
        <p className="mt-2 text-sm text-slate-500">
          Click a file in Images, Files, or Documents above to open a large preview here.
        </p>
      </section>
    );
  }

  const title =
    selection.kind === "file" ? selection.item.name : selection.item.title;
  const subtitle = selection.subtitle;
  const mime = selection.kind === "file" ? selection.item.mime : "text/markdown";
  const dataUrl = selection.kind === "file" ? filePayload?.dataUrl || selection.item.dataUrl : undefined;
  const isImage =
    selection.kind === "file" &&
    isImageFile({
      name: selection.item.name,
      mime,
      dataUrl,
    });
  const isPdf =
    selection.kind === "file" &&
    (mime === "application/pdf" || Boolean(dataUrl?.startsWith("data:application/pdf")));

  return (
    <section
      id="media-preview"
      className="scroll-mt-24 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Preview
          </p>
          <h3 className="truncate font-display text-xl font-semibold text-slate-900" title={title}>
            {title}
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {selection.kind === "document" ? "Document" : isImage ? "Image" : "File"}
            {mime ? ` · ${mime}` : ""}
            {formatBytesFromDataUrl(dataUrl) ? ` · ${formatBytesFromDataUrl(dataUrl)}` : ""}
            {subtitle ? ` · ${subtitle}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            className="btn-primary text-sm"
            onClick={() => void onDownload(selection)}
          >
            Download
          </button>
          <button type="button" className="btn-secondary text-sm" onClick={onClose}>
            Close preview
          </button>
        </div>
      </div>

      <div className="min-h-[18rem] max-h-[min(70vh,40rem)] overflow-auto bg-[var(--ke-paper,#f7f4ee)] p-4">
        {loading ? (
          <p className="py-16 text-center text-sm text-slate-500">Loading preview…</p>
        ) : null}
        {error ? <p className="py-8 text-center text-sm text-red-600">{error}</p> : null}

        {!loading && !error && selection.kind === "document" ? (
          <article className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white px-5 py-6 shadow-sm">
            <RichContent className="text-base leading-relaxed">{selection.item.content}</RichContent>
          </article>
        ) : null}

        {!loading && !error && selection.kind === "file" && isImage && dataUrl ? (
          <div className="flex min-h-[16rem] items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={dataUrl}
              alt={title}
              className="max-h-[min(62vh,36rem)] w-auto max-w-full rounded-lg border border-slate-200 bg-white object-contain shadow-sm"
            />
          </div>
        ) : null}

        {!loading && !error && selection.kind === "file" && isPdf && dataUrl ? (
          <iframe
            title={title}
            src={dataUrl}
            className="h-[min(62vh,36rem)] w-full rounded-lg border border-slate-200 bg-white"
          />
        ) : null}

        {!loading &&
        !error &&
        selection.kind === "file" &&
        !isImage &&
        !isPdf ? (
          <div className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100 text-3xl">
              📎
            </span>
            <div>
              <p className="font-semibold text-slate-900">{title}</p>
              <p className="mt-1 text-sm text-slate-500">
                No inline preview for this file type. Download to open it on your device.
              </p>
              {selection.item.note ? (
                <p className="mt-2 text-xs text-slate-500">{selection.item.note}</p>
              ) : null}
            </div>
            <button
              type="button"
              className="btn-primary"
              onClick={() => void onDownload(selection)}
            >
              Download file
            </button>
          </div>
        ) : null}

        {!loading && !error && selection.kind === "file" && (isImage || isPdf) && !dataUrl ? (
          <p className="py-16 text-center text-sm text-slate-500">
            Preview data is not available. Try Download instead.
          </p>
        ) : null}
      </div>
    </section>
  );
}
