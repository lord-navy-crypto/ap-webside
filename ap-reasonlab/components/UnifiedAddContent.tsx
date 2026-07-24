"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { ManagedUnit } from "@/lib/managed-types";
import RichContent from "@/components/RichContent";
import { useEditorMode } from "@/components/EditorModeProvider";
import { handleRichPaste } from "@/lib/rich-paste";

type ContentType = "concept" | "formula" | "practice" | "document" | "file" | "image" | "folder";

type Props = {
  subjectId?: string;
  subjectName?: string;
  units?: ManagedUnit[];
  onSaved?: () => void;
  label?: string;
};

const contentTypes: Array<{ value: ContentType; label: string }> = [
  { value: "concept", label: "Concept" },
  { value: "formula", label: "Formula" },
  { value: "practice", label: "Practice" },
  { value: "document", label: "Document" },
  { value: "file", label: "File" },
  { value: "image", label: "Image" },
  { value: "folder", label: "File folder" },
];

export default function UnifiedAddContent({
  subjectId = "",
  subjectName = "",
  onSaved,
  label = "+ Add content",
}: Props) {
  const { active: editMode, unlocked } = useEditorMode();
  const storageKey = useMemo(() => `results-content-draft:${subjectId || "general"}`, [subjectId]);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<ContentType>("concept");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [changeCode, setChangeCode] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return;
    try {
      const draft = JSON.parse(stored) as Record<string, string>;
      setType((draft.type as ContentType) || "concept");
      setTitle(draft.title || "");
      setContent(draft.content || "");
    } catch {
      localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!open) return;
    localStorage.setItem(
      storageKey,
      JSON.stringify({ type, title, content })
    );
  }, [content, open, storageKey, title, type]);

  async function fileAsDataUrl(selected: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(selected);
    });
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const requestedStatus: "draft" | "published" = submitter?.value === "draft" ? "draft" : "published";
    setBusy(true);
    setMessage("");
    try {
      const action =
        type === "file" || type === "image"
          ? "add_files"
          : type === "folder"
            ? "add_folder"
            : "add_content_item";
      let item: Record<string, unknown> = {
        subjectId,
        type: type === "image" ? "file" : type,
        title,
        content,
        tags: [],
        difficulty: "standard",
        status: requestedStatus,
      };
      let items: Record<string, unknown>[] | undefined;
      if (type === "file" || type === "image") {
        if (files.length === 0) throw new Error(type === "image" ? "Choose at least one image" : "Choose at least one file");
        if (type === "image" && files.some((f) => !f.type.startsWith("image/"))) {
          throw new Error("Image upload accepts image files only.");
        }
        items = await Promise.all(files.map(async (file) => ({
          name: file.name,
          mime: file.type,
          dataUrl: await fileAsDataUrl(file),
          note: title,
          area: "ap-subject",
          space: subjectName || subjectId,
        })));
      } else if (type === "folder") {
        item = { title, note: content, area: "ap-subject", space: subjectName || subjectId };
      }
      const response = await fetch("/api/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          item,
          items,
          changeCode: changeCode.trim() || undefined,
          githubToken: githubToken.trim() || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Save failed");
      localStorage.removeItem(storageKey);
      setTitle("");
      setContent("");
      setFiles([]);
      setMessage(requestedStatus === "draft" ? "Draft saved." : "Published successfully.");
      onSaved?.();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  if (!editMode && !unlocked) return null;

  return (
    <>
      <button type="button" className="btn-primary" onClick={() => setOpen(true)}>{label}</button>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-slate-950/55 p-4 pt-[8vh]" role="dialog" aria-modal="true" aria-labelledby="add-content-title">
          <form onSubmit={submit} className="w-full max-w-2xl space-y-4 rounded-3xl bg-white p-5 shadow-2xl md:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">{subjectName || "Content manager"}</p>
                <h2 id="add-content-title" className="mt-1 text-2xl font-bold">Add content</h2>
              </div>
              <button type="button" className="btn-ghost" onClick={() => setOpen(false)} aria-label="Close">✕</button>
            </div>

            <fieldset>
              <legend className="mb-2 text-sm font-semibold">Content type</legend>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                {contentTypes.map((option) => (
                  <button key={option.value} type="button" onClick={() => setType(option.value)} className={type === option.value ? "filter-pill-active" : "filter-pill"}>
                    {option.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="block text-sm font-medium">Subject<input className="input mt-1" value={subjectName || subjectId} disabled /></label>

            {type === "file" || type === "image" ? (
              <label className="block text-sm font-medium">
                {type === "image" ? "Choose up to 10 images" : "Choose up to 10 files"}
                <input
                  className="mt-2 block w-full text-sm"
                  type="file"
                  multiple
                  accept={type === "image" ? "image/*" : undefined}
                  onChange={(event) => setFiles(Array.from(event.target.files || []).slice(0, 10))}
                  required
                />
                <span className="mt-1 block text-xs text-slate-500">
                  {files.length} selected · each must stay under ~1MB
                </span>
              </label>
            ) : null}
            <input
              className="input"
              placeholder={type === "file" || type === "image" ? "Note (optional)" : `${type} title`}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required={type !== "file" && type !== "image"}
            />
            {type !== "file" && type !== "image" && (
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-slate-800">
                  {type === "folder" ? "Note (optional)" : "Full content"}
                </span>
                {type !== "folder" ? (
                  <span className="block text-xs leading-relaxed text-slate-500">
                    Paste the complete write-up. Markdown is supported. Use{" "}
                    <code className="rounded bg-slate-100 px-1">$...$</code> for inline math and{" "}
                    <code className="rounded bg-slate-100 px-1">$$...$$</code> for display LaTeX.
                  </span>
                ) : null}
                <textarea
                  className="textarea min-h-[22rem] w-full resize-y text-sm leading-relaxed"
                  placeholder={type === "folder" ? "Optional folder note…" : "Paste Markdown + LaTeX here…"}
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  onPaste={(event) => handleRichPaste(event, content, setContent)}
                  required={type !== "folder"}
                />
              </label>
            )}

            {type !== "file" && type !== "image" && type !== "folder" && content && (
              <div className="rounded-2xl border border-slate-200">
                <button type="button" className="flex w-full items-center justify-between p-4 text-sm font-semibold" onClick={() => setPreview((value) => !value)}>Preview before publishing <span>{preview ? "−" : "+"}</span></button>
                {preview && <div className="max-h-[min(60vh,28rem)] overflow-auto border-t border-slate-200 p-4"><h3 className="text-lg font-semibold">{title || "Untitled"}</h3><RichContent className="mt-2">{content}</RichContent></div>}
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              {unlocked ? (
                <p className="text-sm text-emerald-800">
                  Editor unlocked — publish uses your login session.{" "}
                  <Link href="/login" className="font-medium underline">
                    /login
                  </Link>
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    type="password"
                    className="input"
                    placeholder="Content change code (or unlock at /login)"
                    value={changeCode}
                    onChange={(event) => setChangeCode(event.target.value)}
                    required
                  />
                  <input
                    type="password"
                    className="input"
                    placeholder="GitHub token (optional)"
                    value={githubToken}
                    onChange={(event) => setGithubToken(event.target.value)}
                  />
                </div>
              )}
              {unlocked && (
                <input
                  type="password"
                  className="input mt-3"
                  placeholder="GitHub token (optional)"
                  value={githubToken}
                  onChange={(event) => setGithubToken(event.target.value)}
                />
              )}
            </div>

            {message && <p role="status" className={/failed|Wrong|Choose/.test(message) ? "text-sm text-red-600" : "text-sm text-emerald-700"}>{message}</p>}
            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
              {type !== "file" && type !== "image" && type !== "folder" && <button type="submit" value="draft" className="btn-secondary" disabled={busy}>Save draft</button>}
              <button type="submit" value="published" className="btn-primary" disabled={busy}>{busy ? "Saving…" : "Publish"}</button>
            </div>
            <p className="text-xs text-slate-500">Your unfinished form is saved automatically in this browser.</p>
          </form>
        </div>
      )}
    </>
  );
}
