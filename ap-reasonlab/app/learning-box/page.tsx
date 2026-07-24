"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  deleteImage,
  deleteLearningItem,
  getImages,
  getLearningItems,
  getRandomLearningItem,
  saveImage,
  saveLearningItem,
  type LearningBoxItem,
  type StoredImage,
} from "@/lib/storage";
import { starterLearningMaterials } from "@/data/starter-learning";
import RichContent from "@/components/RichContent";
import LocalImageEditor from "@/components/LocalImageEditor";

type Tab = "library" | "pictures" | "random";

const SEEDED_KEY = "results-learning-seeded-v1";

function LearningBoxContent() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>("library");
  const [items, setItems] = useState<LearningBoxItem[]>([]);
  const [pictures, setPictures] = useState<StoredImage[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("General");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const [preview, setPreview] = useState<StoredImage | null>(null);

  const [randomPick, setRandomPick] = useState<LearningBoxItem | null>(null);
  const [spinning, setSpinning] = useState(false);

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t === "pictures" || t === "random" || t === "library") setTab(t);
  }, [searchParams]);

  useEffect(() => {
    setMounted(true);
    (async () => {
      try {
        if (typeof localStorage !== "undefined" && !localStorage.getItem(SEEDED_KEY)) {
          for (const m of starterLearningMaterials) {
            await saveLearningItem(m);
          }
          localStorage.setItem(SEEDED_KEY, "1");
        }
      } catch {
        // ignore seed errors
      }
      await refresh();
    })();
  }, []);

  async function refresh() {
    try {
      const list = await getLearningItems();
      setItems(list);
      const imgs = await getImages("uploaded");
      setPictures(imgs);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  }

  function resetForm() {
    setTitle("");
    setContent("");
    setCategory("General");
    setEditingId(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setError("");
    try {
      await saveLearningItem({
        id: editingId ?? undefined,
        title: title.trim(),
        content: content.trim(),
        category: category.trim() || "General",
      });
      resetForm();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setError("");
    try {
      for (const file of Array.from(files)) {
        const text = await file.text();
        await saveLearningItem({
          title: file.name.replace(/\.[^.]+$/, ""),
          content: text.slice(0, 100_000),
          category: category.trim() || "Uploaded",
        });
      }
      await refresh();
      e.target.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "File upload failed");
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setError("");
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        if (file.size > 4_500_000) throw new Error("Keep images under ~4 MB.");
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ""));
          reader.onerror = () => reject(new Error("Could not read image"));
          reader.readAsDataURL(file);
        });
        const name = file.name.replace(/\.[^.]+$/, "") || "Picture";
        await saveImage({
          kind: "uploaded",
          name,
          dataUrl,
          note: "Private Learning Box",
          tags: ["learning-box"],
        });
        await saveLearningItem({
          title: name,
          content: dataUrl,
          category: "Private image",
        });
      }
      await refresh();
      e.target.value = "";
      setTab("pictures");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed");
    }
  }

  function startEdit(item: LearningBoxItem) {
    setEditingId(item.id);
    setTitle(item.title);
    setContent(item.content);
    setCategory(item.category);
    setTab("library");
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this learning item?")) return;
    await deleteLearningItem(id);
    if (editingId === id) resetForm();
    await refresh();
  }

  async function handleDeletePicture(id: string) {
    if (!confirm("Delete this private picture?")) return;
    await deleteImage(id);
    if (preview?.id === id) setPreview(null);
    await refresh();
  }

  async function spin() {
    setSpinning(true);
    setRandomPick(null);
    setError("");
    await new Promise((r) => setTimeout(r, 600));
    try {
      const pick = await getRandomLearningItem(randomPick?.id);
      setRandomPick(pick);
      if (!pick) setError("Your Private Learning Box is empty. Add some items first.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Draw failed");
    } finally {
      setSpinning(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Private Learning Box</h1>
        <p className="mt-2 text-slate-600">
          Your private folder stored only in this browser — notes, documents, and pictures (the old
          Picture box lives here now). No change code required. Use Random Draw for spaced review.
        </p>
        <Link href="/academic" className="mt-2 inline-block text-sm text-brand-600 hover:underline">
          ← Academic Platform
        </Link>
      </div>

      <div className="card p-2">
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              ["library", "Documents"],
              ["pictures", "Pictures"],
              ["random", "Random Draw"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={
                tab === id
                  ? "rounded-xl bg-brand-600 px-3 py-2.5 text-sm font-semibold text-white shadow"
                  : "rounded-xl bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {mounted && tab === "library" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <form onSubmit={handleSubmit} className="card space-y-4">
            <h2 className="text-lg font-semibold">
              {editingId ? "Edit item" : "Add learning material"}
            </h2>
            <div>
              <label className="mb-1 block text-sm font-medium">Title</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Memory hooks for biology"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Category</label>
              <input
                type="text"
                className="input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Content</label>
              <textarea
                className="textarea min-h-40"
                placeholder="Paste notes, Markdown, or a summary…"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Or upload document files</label>
              <input
                type="file"
                accept=".txt,.md,.markdown,.csv,.json,text/*"
                multiple
                onChange={handleFileUpload}
                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:text-white hover:file:bg-brand-700"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Or upload private pictures</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-violet-600 file:px-4 file:py-2 file:text-white hover:file:bg-violet-700"
              />
              <p className="mt-1 text-xs text-slate-500">
                Pictures open in the Pictures tab. Generate diagrams in{" "}
                <Link href="/hints?tool=imagegen" className="underline">
                  AI Toolbox · Image Gen
                </Link>
                .
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="submit" className="btn-primary">
                {editingId ? "Update" : "Save to box"}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} className="btn-ghost">
                  Cancel edit
                </button>
              )}
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </form>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Stored materials ({items.length})</h2>
            {items.length === 0 ? (
              <div className="card text-sm text-slate-500">
                Nothing stored yet. Add your first learning material on the left.
              </div>
            ) : (
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item.id} className="card space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-semibold text-slate-900">{item.title}</h3>
                      <span className="badge">{item.category}</span>
                    </div>
                    <div className="max-h-72 overflow-y-auto overscroll-contain rounded-lg bg-slate-50 p-3">
                      {item.content.startsWith("data:image") ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.content}
                          alt={item.title}
                          className="mx-auto max-h-64 rounded-lg object-contain"
                        />
                      ) : (
                        <RichContent className="text-sm text-slate-700">{item.content}</RichContent>
                      )}
                    </div>
                    <div className="flex gap-3 text-xs">
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        className="text-brand-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="text-red-500 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {mounted && tab === "pictures" && (
        <section className="space-y-4">
          <div className="card space-y-3">
            <h2 className="text-lg font-semibold">Private pictures</h2>
            <p className="text-sm text-slate-600">
              Upload photos of handwritten notes, textbook pages, and diagrams. Stored only in this
              browser (merged from the old Picture box).
            </p>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-violet-600 file:px-4 file:py-2 file:text-white hover:file:bg-violet-700"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          {pictures.length === 0 ? (
            <div className="card text-sm text-slate-500">No private pictures yet.</div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pictures.map((img) => (
                <li key={img.id} className="card space-y-2">
                  <button type="button" onClick={() => setPreview(img)} className="block w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.dataUrl}
                      alt={img.name}
                      className="mx-auto max-h-40 rounded-lg object-contain"
                    />
                  </button>
                  <p className="truncate text-sm font-medium">{img.name}</p>
                  {img.note && <p className="text-xs text-slate-500">{img.note}</p>}
                  <div className="flex gap-3 text-xs">
                    <button
                      type="button"
                      onClick={() => setPreview(img)}
                      className="text-brand-600 hover:underline"
                    >
                      View / edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeletePicture(img.id)}
                      className="text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {preview ? (
            <div
              className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4"
              onClick={() => setPreview(null)}
              role="presentation"
            >
              <div
                className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-4 shadow-xl"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="font-semibold">{preview.name}</h3>
                  <button type="button" className="btn-ghost text-sm" onClick={() => setPreview(null)}>
                    Close
                  </button>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview.dataUrl}
                  alt={preview.name}
                  className="mx-auto max-h-[50vh] rounded-lg object-contain"
                />
                <div className="mt-3">
                  <LocalImageEditor
                    item={preview}
                    onSaved={() => {
                      void refresh();
                    }}
                  />
                </div>
              </div>
            </div>
          ) : null}
        </section>
      )}

      {mounted && tab === "random" && (
        <div className="card mx-auto max-w-xl space-y-4 text-center">
          <h2 className="text-lg font-semibold">Random Draw</h2>
          <p className="text-sm text-slate-600">
            Draw a random item from your Private Learning Box for quick review.
          </p>
          <button type="button" className="btn-primary" onClick={() => void spin()} disabled={spinning}>
            {spinning ? "Drawing…" : "Draw one"}
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {randomPick && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left">
              <p className="badge">{randomPick.category}</p>
              <h3 className="mt-2 text-lg font-semibold">{randomPick.title}</h3>
              <div className="mt-2 max-h-80 overflow-y-auto">
                {randomPick.content.startsWith("data:image") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={randomPick.content}
                    alt={randomPick.title}
                    className="mx-auto max-h-64 rounded-lg object-contain"
                  />
                ) : (
                  <RichContent className="text-sm">{randomPick.content}</RichContent>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {!mounted && <div className="card text-sm text-slate-500">Loading private storage…</div>}
    </div>
  );
}

export default function LearningBoxPage() {
  return (
    <Suspense fallback={<div className="card text-sm text-slate-500">Loading…</div>}>
      <LearningBoxContent />
    </Suspense>
  );
}
