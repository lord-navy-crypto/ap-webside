"use client";

import { useEffect, useState } from "react";
import RichContent from "@/components/RichContent";
import { useEditorMode } from "@/components/EditorModeProvider";
import { handleRichPaste } from "@/lib/rich-paste";

export type EditableTarget =
  | "concept"
  | "topic"
  | "formula"
  | "document"
  | "file"
  | "folder"
  | "questionnaire"
  | "content_item"
  | "subject"
  | "member";

type EditableItem = {
  id: string;
  title?: string;
  name?: string;
  summary?: string;
  content?: string;
  expression?: string;
  variables?: string;
  whenToUse?: string;
  description?: string;
  note?: string;
  category?: string;
  mime?: string;
  dataUrl?: string;
};

type Props = {
  target: EditableTarget;
  item: EditableItem;
  onSaved: (content: unknown) => void;
  label?: string;
};

function initialBody(target: EditableTarget, item: EditableItem) {
  if (target === "formula") {
    if (item.content) return item.content;
    return [
      item.expression ? `$$\n${item.expression}\n$$` : "",
      item.variables ? `**Variables:** ${item.variables}` : "",
      item.whenToUse ? `**When to use:** ${item.whenToUse}` : "",
    ].filter(Boolean).join("\n\n");
  }
  if (target === "concept" || target === "topic") return item.summary || "";
  if (target === "questionnaire" || target === "subject") return item.description || "";
  if (target === "folder" || target === "file" || target === "member") return item.note || "";
  return item.content || "";
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ResourceEditor({ target, item, onSaved, label = "Edit" }: Props) {
  const { unlocked, refresh } = useEditorMode();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(item.title || item.name || "");
  const [body, setBody] = useState(initialBody(target, item));
  const [category, setCategory] = useState(item.category || "Uploaded");
  const [replacement, setReplacement] = useState<File | null>(null);
  const [preview, setPreview] = useState(false);
  const [changeCode, setChangeCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle(item.title || item.name || "");
    setBody(initialBody(target, item));
    setCategory(item.category || "Uploaded");
    setReplacement(null);
    setPreview(false);
    setError("");
  }, [item, open, target]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (!unlocked && !changeCode.trim()) throw new Error("Enter the content change code first.");
      const update: Record<string, unknown> = { title, name: title };
      if (target === "document" || target === "content_item") update.content = body;
      if (target === "concept" || target === "topic") update.summary = body;
      if (target === "formula") update.content = body;
      if (target === "questionnaire" || target === "subject") update.description = body;
      if (target === "folder" || target === "file" || target === "member") update.note = body;
      if (target === "document") update.category = category;
      if (target === "file" && replacement) {
        const dataUrl = await readFileAsDataURL(replacement);
        if (dataUrl.length > 1_500_000) throw new Error("Replacement file is too large (keep under ~1MB).");
        update.name = replacement.name;
        update.mime = replacement.type || "application/octet-stream";
        update.dataUrl = dataUrl;
      }
      const response = await fetch("/api/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          target,
          id: item.id,
          item: update,
          changeCode: changeCode.trim() || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Update failed");
      onSaved(data.content);
      void refresh();
      setOpen(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  const richBody = ["concept", "topic", "formula", "document", "content_item", "questionnaire"].includes(target);

  return (
    <>
      <button type="button" className="btn-ghost px-2 py-1 text-xs" onClick={() => setOpen(true)}>
        ✎ {label}
      </button>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 py-[5vh]" role="dialog" aria-modal="true" aria-labelledby={`edit-${item.id}`}>
          <form onSubmit={submit} className="max-h-[90vh] w-full max-w-3xl space-y-4 overflow-y-auto overscroll-contain rounded-3xl bg-white p-5 shadow-2xl md:p-7">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-3 bg-white pb-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Edit existing {target.replace("_", " ")}</p>
                <h2 id={`edit-${item.id}`} className="mt-1 text-xl font-bold">{item.title || item.name}</h2>
              </div>
              <button type="button" className="btn-ghost" onClick={() => setOpen(false)} aria-label="Close">✕</button>
            </div>

            <label className="block text-sm font-medium">
              Title / name
              <input className="input mt-1" value={title} onChange={(event) => setTitle(event.target.value)} required />
            </label>

            {target === "document" && (
              <label className="block text-sm font-medium">
                Category
                <input className="input mt-1" value={category} onChange={(event) => setCategory(event.target.value)} />
              </label>
            )}

            {target !== "subject" ? (
              <label className="block text-sm font-medium">
                {target === "file" ? "File description" : target === "folder" || target === "member" ? "Description" : "Content"}
                <textarea
                  className="textarea mt-1 min-h-[16rem] resize-y font-[inherit]"
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  onPaste={(event) => handleRichPaste(event, body, setBody)}
                  placeholder="Paste one complete Markdown document here. Use $...$ or $$...$$ for LaTeX math."
                />
              </label>
            ) : (
              <label className="block text-sm font-medium">
                Description
                <textarea className="textarea mt-1 min-h-32 resize-y" value={body} onChange={(event) => setBody(event.target.value)} />
              </label>
            )}

            {target === "file" && (
              <label className="block rounded-2xl border border-dashed border-slate-300 p-4 text-sm font-medium">
                Replace file (optional)
                <input className="mt-2 block w-full text-sm" type="file" onChange={(event) => setReplacement(event.target.files?.[0] || null)} />
                <span className="mt-1 block text-xs font-normal text-slate-500">Leave empty to keep the current download. Choosing a replacement updates the file name and type.</span>
              </label>
            )}

            {richBody && body && (
              <section className="overflow-hidden rounded-2xl border border-slate-200">
                <button type="button" className="flex w-full items-center justify-between bg-slate-50 px-4 py-3 text-left text-sm font-semibold" onClick={() => setPreview((value) => !value)}>
                  Markdown + LaTeX preview <span>{preview ? "−" : "+"}</span>
                </button>
                {preview && <div className="max-h-[45vh] overflow-auto p-4"><RichContent>{body}</RichContent></div>}
              </section>
            )}

            {!unlocked && <input type="password" className="input" placeholder="Content change code" value={changeCode} onChange={(event) => setChangeCode(event.target.value)} required />}
            {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <div className="sticky bottom-0 flex justify-end gap-2 border-t border-slate-100 bg-white pt-3">
              <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={busy}>{busy ? "Saving…" : "Save changes"}</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
