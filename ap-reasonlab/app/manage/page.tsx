"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AIDeveloperBlocks from "@/components/AIDeveloperBlocks";
import Breadcrumbs from "@/components/Breadcrumbs";
import EditHistory from "@/components/EditHistory";
import UnifiedAddContent from "@/components/UnifiedAddContent";
import { useEditorMode } from "@/components/EditorModeProvider";
import ResourceEditor from "@/components/ResourceEditor";
import { AP_CATALOG, type SubjectDefinition } from "@/data/ap-catalog";
import type { ManagedContent, ManagedContentItem, ManagedUnit } from "@/lib/managed-types";

type Tab = "content" | "subjects" | "units" | "trash" | "ai" | "history";

export default function ManagePage() {
  const { active: editMode, unlocked, editor, refresh: refreshEditor } = useEditorMode();
  const [data, setData] = useState<Partial<ManagedContent>>({});
  const [tab, setTab] = useState<Tab>("content");
  const [query, setQuery] = useState("");
  const [subjectId, setSubjectId] = useState(AP_CATALOG[0].id);
  const [status, setStatus] = useState("all");
  const [changeCode, setChangeCode] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [message, setMessage] = useState("");
  const [newSubject, setNewSubject] = useState({ name: "", description: "", icon: "◇" });
  const [newUnit, setNewUnit] = useState({ title: "", description: "" });

  const refresh = useCallback(() => {
    fetch("/api/edit", { cache: "no-store" })
      .then((response) => response.json())
      .then(setData)
      .catch(() => setMessage("Could not load managed content."));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const subjects = useMemo<SubjectDefinition[]>(() => {
    const managed = (data.subjects || []).map((subject) => ({
      ...subject,
      shortName: subject.shortName || subject.name,
      description: subject.description || "Managed subject",
      icon: subject.icon || "◇",
      color: subject.color || "blue",
      group: "Humanities" as const,
    }));
    return [...AP_CATALOG, ...managed.filter((item) => !AP_CATALOG.some((builtIn) => builtIn.slug === item.slug))];
  }, [data.subjects]);

  const selectedSubject = subjects.find((subject) => subject.id === subjectId) || subjects[0];
  const units = (data.units || []).filter((unit) => unit.subjectId === subjectId);
  const activeItems = (data.contentItems || []).filter((item) => !item.deletedAt);
  const trash = (data.contentItems || []).filter((item) => item.deletedAt);
  const filtered = activeItems.filter((item) => {
    const needle = query.trim().toLowerCase();
    return (subjectId === "all" || item.subjectId === subjectId) && (status === "all" || item.status === status) && (!needle || `${item.title} ${item.content} ${item.tags.join(" ")}`.toLowerCase().includes(needle));
  }).sort((a, b) => a.order - b.order || b.updatedAt - a.updatedAt);

  async function mutate(action: string, extra: Record<string, unknown>) {
    setMessage("");
    if (!unlocked && !changeCode.trim()) {
      setMessage("Unlock at /login with the content code first (or paste it here once).");
      return false;
    }
    const response = await fetch("/api/edit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        changeCode: changeCode.trim() || undefined,
        githubToken: githubToken || undefined,
        ...extra,
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error || "Save failed");
      return false;
    }
    setMessage("Saved. GitHub/Vercel may take a moment to refresh.");
    setData(result.content || {});
    void refreshEditor();
    return true;
  }

  async function addSubject(event: React.FormEvent) {
    event.preventDefault();
    if (await mutate("add_subject", { item: newSubject })) setNewSubject({ name: "", description: "", icon: "◇" });
  }

  async function addUnit(event: React.FormEvent) {
    event.preventDefault();
    if (await mutate("add_unit", { item: { ...newUnit, subjectId, order: units.length } })) setNewUnit({ title: "", description: "" });
  }

  const tabs: Array<{ id: Tab; label: string; count?: number }> = [
    { id: "content", label: "Content", count: activeItems.length },
    { id: "subjects", label: "Subjects", count: subjects.length },
    { id: "units", label: "Units", count: data.units?.length || 0 },
    { id: "trash", label: "Recycle Bin", count: trash.length },
    { id: "ai", label: "AI Developer" },
    { id: "history", label: "History & Undo" },
  ];

  if (!editMode) {
    return (
      <div className="space-y-6">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Manage" }]} />
        <section className="card mx-auto max-w-2xl text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-xl text-brand-700">✎</span>
          <h1 className="mt-4 text-2xl font-bold">Content manager is hidden</h1>
          <p className="mt-2 text-sm text-slate-600">
            Use the edit circle in the lower-right corner, pass the content-code check, then choose “Start editing this page”.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Manage" }]} />
      <section className="rounded-3xl bg-slate-950 p-6 text-white md:p-8">
        <div className="flex flex-wrap items-end justify-between gap-5"><div><span className="text-xs font-semibold uppercase tracking-wider text-blue-300">KNOWLEDGE EXPLORER CONTROL CENTER</span><h1 className="mt-2 text-3xl font-bold">Manage the site without changing code</h1><p className="mt-2 max-w-2xl text-slate-300">Create and edit content, use AI Developer, review modification history, and safely undo a change. Content change code is enough.</p></div><UnifiedAddContent subjectId={selectedSubject?.id} subjectName={selectedSubject?.name} units={units} onSaved={refresh} /></div>
      </section>

      <section className="card grid gap-3 md:grid-cols-2">
        {unlocked ? (
          <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900 md:col-span-2">
            Editor unlocked ({editor?.level}). Manage, AI Developer, and History use your content-code
            session.{" "}
            <Link href="/login?next=/manage" className="font-medium underline">
              Lock / re-login
            </Link>
          </div>
        ) : (
          <label className="text-sm font-medium">
            Content change code
            <input
              type="password"
              className="input mt-1"
              value={changeCode}
              onChange={(event) => setChangeCode(event.target.value)}
              placeholder="Or unlock once at /login"
            />
          </label>
        )}
        <label className={`text-sm font-medium ${unlocked ? "md:col-span-2" : ""}`}>
          GitHub token <span className="font-normal text-slate-400">(optional — leave empty)</span>
          <input
            type="password"
            className="input mt-1"
            value={githubToken}
            onChange={(event) => setGithubToken(event.target.value)}
            placeholder="Leave empty — uses Vercel GITHUB_TOKEN"
          />
          <span className="mt-1 block text-xs text-slate-500">
            Only paste a repo-write GitHub PAT (<code>ghp_</code> / <code>github_pat_</code>)
            if overriding. Prefer Vercel <code>GITHUB_TOKEN</code>. Never paste the content
            change code or the GitHub Models (<code>CONTENT_GITHUB_TOKEN</code>) AI key here.
          </span>
        </label>
        {message && <p role="status" className="text-sm text-brand-700 md:col-span-2">{message}</p>}
      </section>

      <div className="flex gap-2 overflow-x-auto pb-1">{tabs.map((item) => <button key={item.id} type="button" onClick={() => setTab(item.id)} className={tab === item.id ? "filter-pill-active whitespace-nowrap" : "filter-pill whitespace-nowrap"}>{item.label}{item.count !== undefined ? ` (${item.count})` : ""}</button>)}</div>

      {tab === "content" && (
        <section className="space-y-4">
          <div className="card grid gap-3 md:grid-cols-4"><input className="input md:col-span-2" type="search" placeholder="Search content…" value={query} onChange={(event) => setQuery(event.target.value)} /><select className="input" value={subjectId} onChange={(event) => setSubjectId(event.target.value)}><option value="all">All subjects</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select><select className="input" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="draft">Draft</option><option value="published">Published</option></select></div>
          <div className="space-y-3">{filtered.map((item) => <ContentRow key={item.id} item={item} subject={subjects.find((subject) => subject.id === item.subjectId)} onAction={mutate} onSaved={(content) => setData(content as ManagedContent)} />)}{filtered.length === 0 && <div className="card text-sm text-slate-500">No content matches these filters.</div>}</div>
        </section>
      )}

      {tab === "subjects" && (
        <section className="grid gap-5 lg:grid-cols-[1fr_1.3fr]">
          <form onSubmit={addSubject} className="card space-y-3"><h2 className="text-xl font-bold">Add AP subject</h2><input className="input" placeholder="AP subject name" value={newSubject.name} onChange={(event) => setNewSubject({ ...newSubject, name: event.target.value })} required /><input className="input" placeholder="Icon or short symbol" value={newSubject.icon} onChange={(event) => setNewSubject({ ...newSubject, icon: event.target.value })} /><textarea className="textarea" placeholder="Description" value={newSubject.description} onChange={(event) => setNewSubject({ ...newSubject, description: event.target.value })} /><button className="btn-primary">Add subject</button></form>
          <div className="card"><h2 className="text-xl font-bold">Subject order</h2><p className="mt-1 text-sm text-slate-500">Built-in subjects are configured once; newly added subjects appear automatically.</p><ul className="mt-4 divide-y divide-slate-100">{subjects.map((subject, index) => <li key={subject.id} className="flex items-center gap-3 py-3"><span className="w-7 text-sm text-slate-400">{index + 1}</span><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">{subject.icon}</span><Link href={`/ap/${subject.slug}`} className="font-medium hover:text-brand-700">{subject.name}</Link></li>)}</ul></div>
        </section>
      )}

      {tab === "units" && (
        <section className="grid gap-5 lg:grid-cols-[1fr_1.3fr]">
          <form onSubmit={addUnit} className="card space-y-3"><h2 className="text-xl font-bold">Add unit</h2><select className="input" value={subjectId === "all" ? subjects[0].id : subjectId} onChange={(event) => setSubjectId(event.target.value)}>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select><input className="input" placeholder="Unit title" value={newUnit.title} onChange={(event) => setNewUnit({ ...newUnit, title: event.target.value })} required /><textarea className="textarea" placeholder="Unit description" value={newUnit.description} onChange={(event) => setNewUnit({ ...newUnit, description: event.target.value })} /><button className="btn-primary">Add unit</button></form>
          <div className="card"><h2 className="text-xl font-bold">Configured units</h2><div className="mt-4 space-y-2">{units.map((unit, index) => <div key={unit.id} className="rounded-xl border border-slate-200 p-3"><span className="text-xs text-slate-400">Unit {index + 1}</span><h3 className="font-semibold">{unit.title}</h3>{unit.description && <p className="text-sm text-slate-600">{unit.description}</p>}</div>)}{units.length === 0 && <p className="text-sm text-slate-500">Choose a subject and add its first unit.</p>}</div></div>
        </section>
      )}

      {tab === "trash" && (
        <section className="space-y-3"><div><h2 className="section-title">Recycle Bin</h2><p className="mt-1 text-sm text-slate-500">Deleted manager content stays recoverable here.</p></div>{trash.map((item) => <div key={item.id} className="card flex flex-wrap items-center justify-between gap-3"><div><span className="badge">{item.type}</span><h3 className="mt-2 font-semibold">{item.title}</h3></div><button className="btn-secondary" onClick={() => mutate("restore_content_item", { id: item.id })}>Restore</button></div>)}{trash.length === 0 && <div className="card text-sm text-slate-500">Recycle Bin is empty.</div>}</section>
      )}

      {tab === "ai" && (
        <AIDeveloperBlocks
          embedded
          onWebsiteChanged={(content) => {
            setData(content);
            setMessage("AI Developer change applied. Open History & Undo to restore it.");
          }}
        />
      )}

      {tab === "history" && (
        <EditHistory
          onRestored={(content) => {
            setData(content);
            setMessage("A previous website-content version was restored.");
          }}
        />
      )}
    </div>
  );
}
function ContentRow({ item, subject, onAction, onSaved }: { item: ManagedContentItem; subject?: SubjectDefinition; onAction: (action: string, extra: Record<string, unknown>) => Promise<boolean>; onSaved: (content: unknown) => void }) {
  return <article className="card flex flex-wrap items-center justify-between gap-4"><div className="min-w-0 flex-1"><div className="flex flex-wrap gap-2"><span className="badge">{item.type}</span><span className={item.status === "published" ? "badge" : "badge-generated"}>{item.status}</span></div><h3 className="mt-2 truncate font-semibold">{item.title}</h3><p className="mt-1 text-xs text-slate-500">{subject?.name || item.subjectId} · order {item.order}</p></div><div className="flex flex-wrap gap-2"><ResourceEditor target="content_item" item={item} onSaved={onSaved} /><button className="btn-ghost" onClick={() => onAction("move_content_item", { id: item.id, order: item.order - 1 })}>↑</button><button className="btn-ghost" onClick={() => onAction("move_content_item", { id: item.id, order: item.order + 1 })}>↓</button><button className="btn-secondary" onClick={() => onAction("set_content_status", { id: item.id, status: item.status === "draft" ? "published" : "draft" })}>{item.status === "draft" ? "Publish" : "Unpublish"}</button><button className="btn-ghost text-red-600" onClick={() => onAction("delete", { target: "content_item", id: item.id })}>Delete</button></div></article>;
}
