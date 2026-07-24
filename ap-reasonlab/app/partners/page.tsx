"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import UnifiedMediaFrame from "@/components/UnifiedMediaFrame";
import { useEditorMode } from "@/components/EditorModeProvider";
import { trueJetMembers } from "@/data/brand";
import ResourceEditor from "@/components/ResourceEditor";
import type { ManagedContent } from "@/lib/managed-types";

type Member = { id: string; name: string; note?: string; addedAt: number };

function githubFromNote(note?: string): string | null {
  if (!note) return null;
  const match = note.match(/github:\s*([A-Za-z0-9-]+)/i);
  if (!match) return null;
  return `https://github.com/${match[1]}`;
}

function displayGithubHandle(url: string): string {
  return url.replace(/^https?:\/\/github\.com\//i, "@");
}

export default function PartnersPage() {
  const { active: editMode, unlocked, refresh: refreshEditor } = useEditorMode();
  const [members, setMembers] = useState<Member[]>([]);
  const [name, setName] = useState("");
  const [githubUser, setGithubUser] = useState("");
  const [roleNote, setRoleNote] = useState("");
  const [changeCode, setChangeCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function refresh() {
    try {
      const data = await fetch("/api/edit", { cache: "no-store" }).then((r) => r.json());
      setMembers(data.members || []);
    } catch {
      setMembers([]);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const roster = useMemo(() => {
    const fromManaged = members.map((m) => {
      const gh = githubFromNote(m.note);
      return {
        id: m.id,
        name: m.name,
        role: m.note?.replace(/github:\s*[A-Za-z0-9-]+/i, "").trim() || "Partner",
        github: gh,
        note: m.note,
        source: "managed" as const,
      };
    });
    const staticOnes = trueJetMembers.map((m) => ({
      id: `static-${m.name}`,
      name: m.name,
      role: m.role,
      github: m.github.startsWith("http") ? m.github : null,
      avatar: m.avatar || "",
      source: "truejet" as const,
      note: m.role,
    }));
    // Prefer managed entry if same GitHub/name already listed statically
    const staticNames = new Set(staticOnes.map((s) => s.name.toLowerCase()));
    const extra = fromManaged
      .filter((m) => !staticNames.has(m.name.toLowerCase()))
      .map((m) => ({ ...m, avatar: "" }));
    return [...staticOnes, ...extra];
  }, [members]);

  async function addPartner(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      if (!unlocked && !changeCode.trim()) {
        throw new Error("Unlock at /login with the content code, or enter it below.");
      }
      const handle = githubUser.trim().replace(/^@/, "");
      const noteParts = [
        roleNote.trim() || "TrueJet partner",
        handle ? `github:${handle}` : "",
      ].filter(Boolean);
      const res = await fetch("/api/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_member",
          item: { name: name.trim(), note: noteParts.join(" · ") },
          changeCode: changeCode.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not add partner");
      setName("");
      setGithubUser("");
      setRoleNote("");
      setMessage("Partner added.");
      await refresh();
      void refreshEditor();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function deletePartner(id: string, name: string) {
    if (!window.confirm(`Remove “${name}” from the managed partner list?`)) return;
    const response = await fetch("/api/edit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", target: "member", id }),
    });
    const data = await response.json();
    if (!response.ok) return setMessage(data.error || "Delete failed");
    setMembers(data.content?.members || []);
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 px-6 py-8 text-white shadow-lg">
        <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
          TRUEJET · PARTNERS
        </span>
        <h1 className="mt-3 text-3xl font-bold">Partners & members</h1>
        <p className="mt-2 max-w-2xl text-brand-100">
          Everyone on TrueJet / Knowledge Explorer with their GitHub. Add new people with a name + GitHub
          username — not a single fixed choice.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="section-title">TrueJet roster</h2>
        <p className="text-sm text-slate-600">
          Core collaborators plus anyone you add below. GitHub links open in a new tab.
        </p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {roster.map((person) => (
            <li key={person.id} className="card flex items-start gap-3">
              {person.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={person.avatar} alt="" className="h-10 w-10 shrink-0 rounded-full" />
              ) : (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">
                  {person.name.slice(0, 1).toUpperCase()}
                </span>
              )}
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">{person.name}</p>
                <p className="text-sm text-slate-600">{person.role}</p>
                {person.github ? (
                  <a
                    href={person.github}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block text-sm font-medium text-brand-700 hover:underline"
                  >
                    {displayGithubHandle(person.github)}
                  </a>
                ) : (
                  <p className="mt-1 text-xs text-slate-400">No GitHub linked yet</p>
                )}
                {person.source === "truejet" && (
                  <span className="mt-2 inline-block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    TrueJet
                  </span>
                )}
                {editMode && person.source === "managed" && (
                  <div className="mt-2 flex gap-2">
                    <ResourceEditor target="member" item={{ id: person.id, name: person.name, note: person.note }} onSaved={(content) => setMembers((content as ManagedContent).members || [])} />
                    <button type="button" className="btn-ghost px-2 py-1 text-xs text-red-600" onClick={() => void deletePartner(person.id, person.name)}>Delete</button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {editMode && <section className="card space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Join / add a person</h2>
          <p className="mt-1 text-sm text-slate-600">
            Type any display name and GitHub username. You are not limited to one preset person.
          </p>
        </div>
        <form onSubmit={addPartner} className="grid gap-3 md:grid-cols-2">
          <label className="text-sm font-medium md:col-span-1">
            Display name
            <input
              className="input mt-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Chen"
              required
            />
          </label>
          <label className="text-sm font-medium md:col-span-1">
            GitHub username
            <input
              className="input mt-1"
              value={githubUser}
              onChange={(e) => setGithubUser(e.target.value)}
              placeholder="e.g. octocat (no @ required)"
            />
          </label>
          <label className="text-sm font-medium md:col-span-2">
            Role / note (optional)
            <input
              className="input mt-1"
              value={roleNote}
              onChange={(e) => setRoleNote(e.target.value)}
              placeholder="e.g. TrueJet partner · content editor"
            />
          </label>
          {!unlocked && (
            <label className="text-sm font-medium md:col-span-2">
              Content change code
              <input
                type="password"
                className="input mt-1"
                value={changeCode}
                onChange={(e) => setChangeCode(e.target.value)}
                placeholder="Or unlock once via the edit circle / /login"
              />
            </label>
          )}
          {unlocked && (
            <p className="text-sm text-emerald-800 md:col-span-2">
              Editor unlocked — you can add partners without re-entering the code.{" "}
              <Link href="/login" className="font-medium underline">
                Manage login
              </Link>
            </p>
          )}
          <div className="md:col-span-2">
            <button type="submit" className="btn-primary" disabled={busy || !name.trim()}>
              {busy ? "Adding…" : "Add partner"}
            </button>
            {message && (
              <p
                className={`mt-2 text-sm ${/unlock|Failed|Could|Wrong|Enter/.test(message) ? "text-red-600" : "text-emerald-700"}`}
              >
                {message}
              </p>
            )}
          </div>
        </form>
      </section>}

      <UnifiedMediaFrame
        alsoShow={["document", "folder", "member"]}
        folderArea="partners"
        spaceKey="_root"
        spaceBasePath="/partners"
        title="Partners · pictures, documents & files"
        collapsedByDefault
        enablePrivateImages={false}
      />
    </div>
  );
}
