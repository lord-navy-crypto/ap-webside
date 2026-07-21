"use client";

import { useEffect, useState } from "react";
import {
  deleteImage,
  getImages,
  saveImage,
  type StoredImage,
} from "@/lib/storage";

export default function PicturePage() {
  const [images, setImages] = useState<StoredImage[]>([]);
  const [note, setNote] = useState("");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const [preview, setPreview] = useState<StoredImage | null>(null);

  useEffect(() => {
    setMounted(true);
    refresh();
  }, []);

  async function refresh() {
    try {
      const list = await getImages("uploaded");
      setImages(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load images");
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setLoading(true);
    setError("");
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        const dataUrl = await readFileAsDataURL(file);
        await saveImage({
          kind: "uploaded",
          name: file.name,
          dataUrl,
          note: note.trim() || undefined,
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        });
      }
      setNote("");
      setTags("");
      await refresh();
      e.target.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this image?")) return;
    await deleteImage(id);
    if (preview?.id === id) setPreview(null);
    await refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Picture</h1>
        <p className="mt-2 text-slate-600">
          Upload photos of handwritten notes, textbook pages, diagrams, or any study pictures.
          Stored privately in your browser (IndexedDB) — nothing is uploaded to a server.
        </p>
      </div>

      <section className="card space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium">Upload images</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            disabled={loading}
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:text-white hover:file:bg-brand-700"
          />
          <p className="mt-1 text-xs text-slate-500">
            You can select multiple files. Large images may take a moment to store.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Note (optional)</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Chapter 5 notes"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Tags (comma-separated)</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. physics, kinematics"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </section>

      {mounted && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">
            Your pictures ({images.length})
          </h2>
          {images.length === 0 ? (
            <div className="card text-sm text-slate-500">
              No pictures yet. Upload an image above to get started.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {images.map((img) => (
                <figure
                  key={img.id}
                  className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.dataUrl}
                    alt={img.name}
                    className="aspect-square w-full cursor-pointer object-cover"
                    onClick={() => setPreview(img)}
                  />
                  <figcaption className="space-y-1 p-2 text-xs text-slate-600">
                    <p className="truncate font-medium text-slate-800">{img.name}</p>
                    {img.note && <p className="truncate">{img.note}</p>}
                    {img.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {img.tags.map((t) => (
                          <span key={t} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px]">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(img.id)}
                      className="text-[11px] text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </section>
      )}

      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreview(null)}
        >
          <div className="max-h-full max-w-3xl overflow-auto rounded-2xl bg-white p-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between gap-4">
              <h3 className="font-semibold">{preview.name}</h3>
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="text-sm text-slate-500 hover:underline"
              >
                Close
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview.dataUrl} alt={preview.name} className="max-h-[70vh] w-auto" />
            {preview.note && <p className="mt-3 text-sm text-slate-600">{preview.note}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
