"use client";

import { useCallback, useEffect, useState } from "react";
import { saveLearningItem } from "@/lib/storage";
import RichContent from "@/components/RichContent";
import UnifiedMediaFrame from "@/components/UnifiedMediaFrame";
import type { ManagedForumPost } from "@/lib/managed-types";

const NAME_KEY = "results-forum-display-name";

export default function ForumPage() {
  const [posts, setPosts] = useState<ManagedForumPost[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [nameDraft, setNameDraft] = useState("");
  const [nameOpen, setNameOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<"post" | string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/edit?area=forum&space=_root", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load Forum");
      setPosts(Array.isArray(data.forumPosts) ? data.forumPosts : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load Forum");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setDisplayName(localStorage.getItem(NAME_KEY) || "");
    void refresh();
  }, [refresh]);

  function requestIdentity(action: "post" | string) {
    setError("");
    if (!displayName) {
      setPendingAction(action);
      setNameDraft("");
      setNameOpen(true);
      return;
    }
    continueAction(action);
  }

  function continueAction(action: "post" | string) {
    if (action === "post") setComposerOpen(true);
    else {
      setReplyingTo(action);
      setReplyBody("");
    }
  }

  function saveName(event: React.FormEvent) {
    event.preventDefault();
    const next = nameDraft.trim();
    if (next.length < 2 || next.length > 40) {
      setError("Display name must be 2–40 characters.");
      return;
    }
    localStorage.setItem(NAME_KEY, next);
    setDisplayName(next);
    setNameOpen(false);
    if (pendingAction) continueAction(pendingAction);
    setPendingAction(null);
  }

  async function publish(action: "add_forum_post" | "add_forum_reply", item: object) {
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, item }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Publish failed");
      setPosts(Array.isArray(data.content?.forumPosts) ? data.content.forumPosts : []);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function submitPost(event: React.FormEvent) {
    event.preventDefault();
    if (!displayName) return requestIdentity("post");
    const ok = await publish("add_forum_post", { author: displayName, title, body });
    if (ok) {
      setTitle("");
      setBody("");
      setComposerOpen(false);
    }
  }

  async function submitReply(event: React.FormEvent, postId: string) {
    event.preventDefault();
    if (!displayName) return requestIdentity(postId);
    const ok = await publish("add_forum_reply", { postId, author: displayName, body: replyBody });
    if (ok) {
      setReplyBody("");
      setReplyingTo(null);
    }
  }

  async function moderate(target: "forum_post" | "forum_reply", id: string, postId?: string) {
    const changeCode = window.prompt("Enter a content or master change code to delete:");
    if (!changeCode) return;
    if (!window.confirm("Delete this shared Forum content?")) return;
    setError("");
    const response = await fetch("/api/edit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", target, id, postId, changeCode }),
    });
    const data = await response.json();
    if (!response.ok) return setError(data.error || "Delete failed");
    setPosts(Array.isArray(data.content?.forumPosts) ? data.content.forumPosts : []);
  }

  async function saveToLearningBox(post: ManagedForumPost) {
    await saveLearningItem({
      title: `[Forum] ${post.title}`,
      content: `${post.body}\n\n— ${post.author}`,
      category: "Forum",
    });
    window.alert("Saved to Private Learning Box (this browser).");
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Forum</h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            A shared discussion space for questions, ideas, and study conversations. Posts and replies are public; Sharing Materials remains the separate file library.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Your display name is public but is not a verified account. Do not include private information.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {displayName && (
            <button type="button" className="btn-ghost" onClick={() => { setNameDraft(displayName); setNameOpen(true); }}>
              Posting as {displayName} · change
            </button>
          )}
          <button type="button" className="btn-primary" onClick={() => requestIdentity("post")}>
            + Start discussion
          </button>
        </div>
      </section>

      {composerOpen && (
        <form onSubmit={submitPost} className="card space-y-3 border-brand-200">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">New discussion</h2>
            <button type="button" className="btn-ghost" onClick={() => setComposerOpen(false)}>Cancel</button>
          </div>
          <input className="input" maxLength={120} placeholder="Discussion title" value={title} onChange={(event) => setTitle(event.target.value)} required />
          <textarea className="textarea min-h-[140px]" maxLength={8000} placeholder="Write your question or idea… Markdown and $math$ are supported." value={body} onChange={(event) => setBody(event.target.value)} required />
          <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
            <span>Posting publicly as {displayName}</span><span>{body.length}/8000</span>
          </div>
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Publishing…" : "Publish discussion"}</button>
        </form>
      )}

      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Shared discussions ({posts.length})</h2>
          <button type="button" className="text-sm text-brand-600 hover:underline" onClick={() => void refresh()}>Refresh</button>
        </div>
        {loading ? <div className="card text-sm text-slate-500">Loading discussions…</div> : posts.length === 0 ? (
          <div className="card text-sm text-slate-500">No shared discussions yet. Start the first one.</div>
        ) : posts.map((post) => (
          <article key={post.id} className="card space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div><h3 className="text-lg font-semibold">{post.title}</h3><p className="text-xs text-slate-500">{post.author} · {new Date(post.createdAt).toLocaleString()}</p></div>
              <button type="button" className="text-xs text-slate-400 hover:text-red-600" onClick={() => void moderate("forum_post", post.id)}>Moderate</button>
            </div>
            <RichContent className="text-sm text-slate-700">{post.body}</RichContent>
            <div className="flex flex-wrap gap-3 text-xs">
              <button type="button" className="text-brand-600 hover:underline" onClick={() => requestIdentity(post.id)}>Reply</button>
              <button type="button" className="text-brand-600 hover:underline" onClick={() => void saveToLearningBox(post)}>Save to Private Learning Box</button>
            </div>
            {(post.replies || []).length > 0 && <div className="space-y-3 border-l-2 border-brand-100 pl-4">
              {(post.replies || []).map((reply) => <div key={reply.id} className="rounded-xl bg-slate-50 p-3">
                <div className="flex items-start justify-between gap-2"><p className="text-xs font-medium text-slate-600">{reply.author} · {new Date(reply.createdAt).toLocaleString()}</p><button type="button" className="text-xs text-slate-400 hover:text-red-600" onClick={() => void moderate("forum_reply", reply.id, post.id)}>Moderate</button></div>
                <RichContent className="mt-2 text-sm text-slate-700">{reply.body}</RichContent>
              </div>)}
            </div>}
            {replyingTo === post.id && <form onSubmit={(event) => submitReply(event, post.id)} className="space-y-2 rounded-xl border border-brand-100 bg-brand-50/40 p-3">
              <textarea className="textarea min-h-[90px]" maxLength={4000} placeholder={`Reply publicly as ${displayName}…`} value={replyBody} onChange={(event) => setReplyBody(event.target.value)} required />
              <div className="flex gap-2"><button type="submit" className="btn-primary" disabled={saving}>{saving ? "Publishing…" : "Publish reply"}</button><button type="button" className="btn-ghost" onClick={() => setReplyingTo(null)}>Cancel</button></div>
            </form>}
          </article>
        ))}
      </section>

      <UnifiedMediaFrame
        title="Forum · pictures, documents & files"
        folderArea="forum"
        spaceKey="_root"
        alsoShow={["document", "folder"]}
        collapsedByDefault
        enablePrivateImages
      />

      {nameOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="forum-name-title">
        <form onSubmit={saveName} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
          <h2 id="forum-name-title" className="text-xl font-semibold">Choose your Forum name</h2>
          <p className="mt-2 text-sm text-slate-600">A display name is required before posting or replying. It will be visible publicly and saved only in this browser.</p>
          <input autoFocus className="input mt-4" minLength={2} maxLength={40} placeholder="Public display name" value={nameDraft} onChange={(event) => setNameDraft(event.target.value)} required />
          <div className="mt-4 flex gap-2"><button type="submit" className="btn-primary">Continue</button><button type="button" className="btn-ghost" onClick={() => { setNameOpen(false); setPendingAction(null); }}>Cancel</button></div>
        </form>
      </div>}
    </div>
  );
}
