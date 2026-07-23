"use client";

import { useState } from "react";
import { saveImage, type StoredImage } from "@/lib/storage";

export default function LocalImageEditor({ item, onSaved }: { item: StoredImage; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(item.name);
  const [note, setNote] = useState(item.note || "");
  const [tags, setTags] = useState(item.tags.join(", "));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await saveImage({
        id: item.id,
        kind: item.kind,
        name: name.trim() || item.name,
        dataUrl: item.dataUrl,
        note: note.trim() || undefined,
        tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      });
      setOpen(false);
      onSaved();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save this picture.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" className="text-[11px] text-brand-600 hover:underline" onClick={() => setOpen(true)}>Edit</button>
      {open && <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-label="Edit picture details">
        <form onSubmit={submit} className="w-full max-w-lg space-y-4 rounded-3xl bg-white p-6 text-left shadow-2xl">
          <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-bold">Edit picture</h2><button type="button" className="btn-ghost" onClick={() => setOpen(false)}>✕</button></div>
          <label className="block text-sm font-medium">Name<input className="input mt-1" value={name} onChange={(event) => setName(event.target.value)} required /></label>
          <label className="block text-sm font-medium">Description<textarea className="textarea mt-1 min-h-32 resize-y" value={note} onChange={(event) => setNote(event.target.value)} /></label>
          <label className="block text-sm font-medium">Tags<input className="input mt-1" value={tags} onChange={(event) => setTags(event.target.value)} placeholder="physics, diagram" /></label>
          {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
          <div className="flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button><button type="submit" className="btn-primary" disabled={busy}>{busy ? "Saving…" : "Save changes"}</button></div>
        </form>
      </div>}
    </>
  );
}
