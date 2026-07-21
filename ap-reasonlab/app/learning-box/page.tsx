"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  deleteLearningItem,
  getLearningItems,
  getRandomLearningItem,
  saveLearningItem,
  type LearningBoxItem,
} from "@/lib/storage";
import { starterLearningMaterials } from "@/data/starter-learning";

type Tab = "library" | "random";

const SEEDED_KEY = "results-learning-seeded-v1";

export default function LearningBoxPage() {
  const [tab, setTab] = useState<Tab>("library");
  const [items, setItems] = useState<LearningBoxItem[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("General");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  const [randomPick, setRandomPick] = useState<LearningBoxItem | null>(null);
  const [spinning, setSpinning] = useState(false);

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

  async function spin() {
    setSpinning(true);
    setRandomPick(null);
    setError("");
    // brief animation delay
    await new Promise((r) => setTimeout(r, 600));
    try {
      const pick = await getRandomLearningItem(randomPick?.id);
      setRandomPick(pick);
      if (!pick) setError("Your Learning Box is empty. Add some items first.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Draw failed");
    } finally {
      setSpinning(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Learning Box</h1>
        <p className="mt-2 text-slate-600">
          Store your own study notes, summaries, and self-developed learning materials.
          Upload text files (.txt, .md) or paste content. Use Random Draw for spaced review
          of knowledge that is not tied to the AP curriculum.
        </p>
        <Link href="/academic" className="mt-2 inline-block text-sm text-brand-600 hover:underline">
          ← Academic Platform
        </Link>
      </div>

      <div className="card p-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setTab("library")}
            className={tab === "library" ? "rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow" : "rounded-xl bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"}
          >
            Document & Storage
          </button>
          <button
            type="button"
            onClick={() => setTab("random")}
            className={tab === "random" ? "rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow" : "rounded-xl bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"}
          >
            Random Draw
          </button>
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
                placeholder="e.g. General, Trivia, Vocabulary"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Content</label>
              <textarea
                className="textarea min-h-[160px]"
                placeholder="Paste your notes, summary, or any self-developed material..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required={!editingId}
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
              <p className="mt-1 text-xs text-slate-500">
                Text files are stored in this browser. PDF binary upload can be added later.
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
            <h2 className="text-lg font-semibold">
              Stored materials ({items.length})
            </h2>
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
                    <p className="whitespace-pre-wrap text-sm text-slate-700 line-clamp-4">
                      {item.content}
                    </p>
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

      {mounted && tab === "random" && (
        <section className="space-y-4">
          <div className="card space-y-4 text-center">
            <h2 className="text-lg font-semibold">Random Knowledge Draw</h2>
            <p className="text-sm text-slate-600">
              Pulls a random item from your Learning Box — anything you stored that is not tied to
              the AP curriculum. Use it for spaced review or a quick study break.
            </p>
            <button
              type="button"
              onClick={spin}
              disabled={spinning}
              className="btn-primary mx-auto"
            >
              {spinning ? "Drawing..." : randomPick ? "Draw another" : "Draw a random item"}
            </button>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          {randomPick && (
            <article className="card space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xl font-bold text-slate-900">{randomPick.title}</h3>
                <span className="badge">{randomPick.category}</span>
              </div>
              <p className="whitespace-pre-wrap text-sm text-slate-700">{randomPick.content}</p>
            </article>
          )}
        </section>
      )}
    </div>
  );
}
