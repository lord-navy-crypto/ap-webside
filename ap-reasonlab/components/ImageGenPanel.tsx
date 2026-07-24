"use client";

import { useEffect, useState } from "react";
import {
  deleteImage,
  getImages,
  saveImage,
  type StoredImage,
} from "@/lib/storage";
import LocalImageEditor from "@/components/LocalImageEditor";

/**
 * Pollinations image generation panel — used inside AI Toolbox.
 * Saved images stay private in this browser (Picture library).
 */
export default function ImageGenPanel({ embedded = false }: { embedded?: boolean }) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentUrl, setCurrentUrl] = useState("");
  const [images, setImages] = useState<StoredImage[]>([]);
  const [mounted, setMounted] = useState(false);
  const [preview, setPreview] = useState<StoredImage | null>(null);

  useEffect(() => {
    setMounted(true);
    void refresh();
  }, []);

  async function refresh() {
    try {
      const list = await getImages("generated");
      setImages(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load images");
    }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    setError("");
    setCurrentUrl("");
    try {
      const seed = Math.floor(Math.random() * 1_000_000);
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(
        prompt.trim()
      )}?width=768&height=768&seed=${seed}&nologo=true`;
      await new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Image generation failed. Try again."));
        img.src = url;
      });
      setCurrentUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!currentUrl) return;
    try {
      const res = await fetch(currentUrl);
      const blob = await res.blob();
      const dataUrl = await blobToDataURL(blob);
      const saved = await saveImage({
        kind: "generated",
        name: prompt.trim().slice(0, 60) || "Generated image",
        dataUrl,
        note: prompt.trim(),
        tags: ["ai-generated", "toolbox"],
      });
      await refresh();
      setCurrentUrl("");
      setPrompt("");
      setPreview(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save image");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this generated image?")) return;
    await deleteImage(id);
    if (preview?.id === id) setPreview(null);
    await refresh();
  }

  return (
    <div className="space-y-4">
      {!embedded && (
        <div>
          <h2 className="text-xl font-semibold">Image Generation</h2>
          <p className="mt-1 text-sm text-slate-600">
            Study diagrams from a text prompt (Pollinations.ai). Saved images stay in this browser.
          </p>
        </div>
      )}

      <form onSubmit={handleGenerate} className="card space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium">Prompt</label>
          <textarea
            className="textarea"
            placeholder="e.g. Simple labeled diagram of a block on an inclined plane with friction"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            required
          />
          <p className="mt-1 text-xs text-slate-500">
            Tip: AI images are drafts. Always verify labels and physics yourself.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Generating…" : "Generate image"}
          </button>
          {currentUrl && !loading && (
            <button type="button" onClick={handleSave} className="btn-secondary">
              Save to my pictures
            </button>
          )}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>

      {currentUrl && (
        <section className="card">
          <h3 className="mb-3 text-lg font-semibold">Preview</h3>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={currentUrl} alt={prompt} className="mx-auto max-h-[50vh] rounded-xl" />
        </section>
      )}

      {mounted && (
        <section>
          <h3 className="mb-3 text-lg font-semibold">
            Saved generated images ({images.length})
          </h3>
          {images.length === 0 ? (
            <div className="card text-sm text-slate-500">No saved generated images yet.</div>
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
                    <div className="flex gap-3">
                      <LocalImageEditor item={img} onSaved={() => void refresh()} />
                      <button
                        type="button"
                        onClick={() => handleDelete(img.id)}
                        className="text-[11px] text-red-500 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
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
          <div
            className="max-h-[90vh] max-w-3xl overflow-auto rounded-2xl bg-white p-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview.dataUrl} alt={preview.name} className="mx-auto max-h-[70vh]" />
            <p className="mt-3 text-sm text-slate-700">{preview.note || preview.name}</p>
            <button type="button" className="btn-ghost mt-3" onClick={() => setPreview(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not encode image"));
    reader.readAsDataURL(blob);
  });
}
