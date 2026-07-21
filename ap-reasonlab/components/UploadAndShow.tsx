"use client";

import { useCallback, useEffect, useState } from "react";
import ChangePanel from "@/components/ChangePanel";
import type { ManagedContent, ManagedFile, ManagedDocument } from "@/lib/managed-store";

type Props = {
  /** Extra add buttons besides file upload */
  alsoShow?: Array<"concept" | "formula" | "document" | "member">;
  defaultSubject?: string;
  title?: string;
};

/**
 * Upload (+) on the left, live file/document list on the right.
 * Refreshes immediately after a successful save (from API response / refetch).
 */
export default function UploadAndShow({
  alsoShow = [],
  defaultSubject,
  title = "Files on this page",
}: Props) {
  const [files, setFiles] = useState<ManagedFile[]>([]);
  const [documents, setDocuments] = useState<ManagedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const applyContent = useCallback((data: Partial<ManagedContent> | null) => {
    if (!data) return;
    setFiles(Array.isArray(data.files) ? data.files : []);
    setDocuments(Array.isArray(data.documents) ? data.documents : []);
  }, []);

  const refresh = useCallback(async () => {
    setError("");
    try {
      // Prefer /api/edit (reads GitHub when token cookie/env exists)
      const res = await fetch("/api/edit", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load files");
      applyContent(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load files");
    } finally {
      setLoading(false);
    }
  }, [applyContent]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Add / upload
        </h2>
        <div className="flex flex-col gap-3">
          <ChangePanel
            mode="file"
            label="+ Upload file"
            onSaved={(content) => {
              if (content) applyContent(content as ManagedContent);
              else void refresh();
            }}
          />
          {alsoShow.includes("document") && (
            <ChangePanel
              mode="document"
              label="+ Add document"
              onSaved={(content) => {
                if (content) applyContent(content as ManagedContent);
                else void refresh();
              }}
            />
          )}
          {alsoShow.includes("concept") && (
            <ChangePanel
              mode="concept"
              label="+ Add concept"
              defaultSubject={defaultSubject}
              onSaved={(content) => {
                if (content) applyContent(content as ManagedContent);
                else void refresh();
              }}
            />
          )}
          {alsoShow.includes("formula") && (
            <ChangePanel
              mode="formula"
              label="+ Add formula"
              defaultSubject={defaultSubject}
              onSaved={(content) => {
                if (content) applyContent(content as ManagedContent);
                else void refresh();
              }}
            />
          )}
          {alsoShow.includes("member") && (
            <ChangePanel
              mode="member"
              label="+ Add member"
              onSaved={() => void refresh()}
            />
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            {title}
          </h2>
          <button type="button" onClick={refresh} className="text-xs text-brand-600 hover:underline">
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="card text-sm text-slate-500">Loading files...</div>
        ) : error ? (
          <div className="card text-sm text-red-600">{error}</div>
        ) : (
          <div className="card max-h-[28rem] space-y-4 overflow-y-auto">
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-800">
                Uploaded files ({files.length})
              </h3>
              {files.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No files yet. Upload on the left — it will appear here right after a successful save.
                </p>
              ) : (
                <ul className="space-y-3">
                  {files.map((f) => (
                    <li key={f.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
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
                          className="mt-2 max-h-40 w-full rounded-lg object-contain"
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
                    <li key={d.id} className="rounded-xl border border-slate-100 bg-white p-3">
                      <p className="text-sm font-medium">{d.title}</p>
                      <p className="text-xs text-slate-500">{d.category}</p>
                      <p className="mt-1 line-clamp-4 whitespace-pre-wrap text-sm text-slate-600">
                        {d.content}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
