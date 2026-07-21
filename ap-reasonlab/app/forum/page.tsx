"use client";

import { useEffect, useState } from "react";
import { saveLearningItem } from "@/lib/storage";
import UploadAndShow from "@/components/UploadAndShow";

type Post = {
  id: string;
  title: string;
  body: string;
  author: string;
  createdAt: number;
};

const STORAGE_KEY = "results-forum-posts";

export default function ForumPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [author, setAuthor] = useState("Anonymous");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setPosts(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  function persist(next: Post[]) {
    setPosts(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    const post: Post = {
      id: `${Date.now()}`,
      title: title.trim(),
      body: body.trim(),
      author: author.trim() || "Anonymous",
      createdAt: Date.now(),
    };
    persist([post, ...posts]);
    setTitle("");
    setBody("");
  }

  async function saveToLearningBox(post: Post) {
    await saveLearningItem({
      title: `[Forum] ${post.title}`,
      content: `${post.body}\n\n— ${post.author}`,
      category: "Forum",
    });
    alert("Saved to Learning Box (this browser).");
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this post?")) return;
    persist(posts.filter((p) => p.id !== id));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Forum</h1>
        <p className="mt-2 text-slate-600">
          Post tips locally in this browser. Use + to publish a shared document/file with a change code.
        </p>
      </div>

      <UploadAndShow alsoShow={["document"]} title="Uploaded files & notes" />

      <form onSubmit={handleSubmit} className="card space-y-3">
        <h2 className="text-lg font-semibold">New post</h2>
        <input
          className="input"
          placeholder="Your name (optional)"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
        />
        <input
          className="input"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          className="textarea min-h-[120px]"
          placeholder="Write something..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
        />
        <button type="submit" className="btn-primary">
          Post
        </button>
      </form>

      {mounted && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Posts ({posts.length})</h2>
          {posts.length === 0 ? (
            <div className="card text-sm text-slate-500">No posts yet. Be the first.</div>
          ) : (
            posts.map((p) => (
              <article key={p.id} className="card space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold">{p.title}</h3>
                  <span className="text-xs text-slate-400">
                    {p.author} · {new Date(p.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-sm text-slate-700">{p.body}</p>
                <div className="flex gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => saveToLearningBox(p)}
                    className="text-brand-600 hover:underline"
                  >
                    Save to Learning Box
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(p.id)}
                    className="text-red-500 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))
          )}
        </section>
      )}
    </div>
  );
}
