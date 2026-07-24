"use client";

import { useEffect, useState } from "react";
import {
  deleteImage,
  getImages,
  saveImage,
  type StoredImage,
} from "@/lib/storage";
import LocalImageEditor from "@/components/LocalImageEditor";
import { useLocalAI } from "@/components/LocalAIProvider";

/**
 * Image generation — Local (SVG via local LLM) or Website / Your own API path (Pollinations).
 * Saved images stay private in this browser (Learning Box / local storage).
 */
export default function ImageGenPanel({ embedded = false }: { embedded?: boolean }) {
  const localAI = useLocalAI();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentUrl, setCurrentUrl] = useState("");
  const [modeNote, setModeNote] = useState("");
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

  function svgToDataUrl(svg: string): string {
    const cleaned = svg.trim().startsWith("<svg")
      ? svg.trim()
      : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 768 768">${svg.trim()}</svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(cleaned)}`;
  }

  async function generateLocalSvg(userPrompt: string): Promise<string> {
    if (!localAI.ready) {
      throw new Error(
        "Local is selected, but no model is enabled. Enable Local above, or switch to Website API / Your own API."
      );
    }
    const text = await localAI.complete([
      {
        role: "system",
        content:
          "You draw simple study diagrams as SVG only. Reply with ONE complete <svg>...</svg> element (viewBox 0 0 768 768), black strokes on white, clear labels. No markdown fences, no explanation.",
      },
      {
        role: "user",
        content: `Create a simple labeled study diagram for: ${userPrompt}`,
      },
    ]);
    const match = text.match(/<svg[\s\S]*?<\/svg>/i);
    if (!match) {
      throw new Error("Local AI did not return valid SVG. Try Website API or simplify the prompt.");
    }
    return svgToDataUrl(match[0]);
  }

  async function generateCloudPollinations(userPrompt: string): Promise<string> {
    const seed = Math.floor(Math.random() * 1_000_000);
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(
      userPrompt.trim()
    )}?width=768&height=768&seed=${seed}&nologo=true`;
    await new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Image generation failed. Try again."));
      img.src = url;
    });
    return url;
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    setError("");
    setCurrentUrl("");
    setModeNote("");
    try {
      if (localAI.usesLocal) {
        const dataUrl = await generateLocalSvg(prompt.trim());
        setCurrentUrl(dataUrl);
        setModeNote("Local · SVG diagram generated in this browser");
        return;
      }
      const url = await generateCloudPollinations(prompt.trim());
      setCurrentUrl(url);
      setModeNote(
        localAI.mode === "byok"
          ? "Your own API path · Pollinations.ai image host"
          : "Website API path · Pollinations.ai image host"
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!currentUrl) return;
    try {
      let dataUrl = currentUrl;
      if (!currentUrl.startsWith("data:")) {
        const res = await fetch(currentUrl);
        const blob = await res.blob();
        dataUrl = await blobToDataURL(blob);
      }
      const saved = await saveImage({
        kind: "generated",
        name: prompt.trim().slice(0, 60) || "Generated image",
        dataUrl,
        note: `${prompt.trim()}${modeNote ? ` · ${modeNote}` : ""}`,
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

  const modeHint =
    localAI.mode === "local"
      ? "Local will draw an SVG study diagram in this browser."
      : "Website API / Your own API path uses Pollinations.ai for raster images.";

  return (
    <div className="space-y-4">
      {!embedded && (
        <div>
          <h2 className="text-xl font-semibold">Image Generation</h2>
          <p className="mt-1 text-sm text-slate-600">
            Study diagrams from a text prompt. Uses the same Local / Website API / Your own API
            settings as other AI tools.
          </p>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
        <strong className="text-slate-800">Runtime:</strong> {modeHint}
      </div>

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
          {currentUrl && (
            <button type="button" className="btn-secondary" onClick={() => void handleSave()}>
              Save to private pictures
            </button>
          )}
        </div>
        {modeNote && <p className="text-xs text-emerald-700">{modeNote}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>

      {currentUrl && (
        <div className="card overflow-hidden p-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={currentUrl} alt="Generated" className="mx-auto max-h-[28rem] bg-white object-contain" />
        </div>
      )}

      {mounted && images.length > 0 && (
        <section className="space-y-3">
          <h3 className="font-semibold text-slate-900">Saved generated pictures ({images.length})</h3>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((image) => (
              <li key={image.id} className="card space-y-2 p-3">
                <button type="button" onClick={() => setPreview(image)} className="block w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.dataUrl} alt={image.name} className="h-36 w-full rounded-lg object-cover" />
                </button>
                <p className="truncate text-sm font-medium">{image.name}</p>
                <div className="flex gap-2">
                  <LocalImageEditor item={image} onSaved={() => void refresh()} />
                  <button
                    type="button"
                    className="btn-ghost text-xs text-red-600"
                    onClick={() => void handleDelete(image.id)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {preview && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-semibold">{preview.name}</h3>
              <button type="button" className="btn-ghost" onClick={() => setPreview(null)}>
                ✕
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview.dataUrl} alt={preview.name} className="mx-auto mt-3 max-h-[70vh]" />
            <p className="mt-3 text-sm text-slate-700">{preview.note || preview.name}</p>
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
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.readAsDataURL(blob);
  });
}
