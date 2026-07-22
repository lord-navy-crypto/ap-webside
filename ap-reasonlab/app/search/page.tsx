"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import { concepts } from "@/data/content";
import { formulas } from "@/data/formulas";
import { questionnaires } from "@/data/questionnaires";
import type { ManagedContent } from "@/lib/managed-store";

type SearchResult = { id: string; title: string; subject: string; type: string; detail: string; href: string };

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [managed, setManaged] = useState<Partial<ManagedContent>>({});

  useEffect(() => { fetch("/api/edit", { cache: "no-store" }).then((response) => response.json()).then(setManaged).catch(() => undefined); }, []);

  const results = useMemo<SearchResult[]>(() => {
    const staticResults: SearchResult[] = [
      ...concepts.map((item) => ({ id: item.id, title: item.title, subject: item.subject, type: "concept", detail: item.summary, href: `/concepts/${item.id}` })),
      ...formulas.map((item) => ({ id: item.id, title: item.name, subject: item.subject, type: "formula", detail: `${item.expression} · ${item.unit}`, href: `/formulas?subject=${encodeURIComponent(item.subject)}` })),
      ...questionnaires.map((item) => ({ id: item.id, title: item.title, subject: item.subject, type: "practice", detail: item.description, href: `/questionnaires/${item.id}` })),
    ];
    const managedResults: SearchResult[] = (managed.contentItems || []).filter((item) => !item.deletedAt && item.status === "published").map((item) => {
      const name = managed.subjects?.find((subject) => subject.id === item.subjectId)?.name || item.subjectId;
      return { id: item.id, title: item.title, subject: name, type: item.type, detail: item.content, href: `/ap/${managed.subjects?.find((subject) => subject.id === item.subjectId)?.slug || item.subjectId}` };
    });
    const needle = query.trim().toLowerCase();
    return [...staticResults, ...managedResults].filter((item) => (type === "all" || item.type === type) && needle.length >= 2 && `${item.title} ${item.subject} ${item.detail}`.toLowerCase().includes(needle)).slice(0, 100);
  }, [managed.contentItems, managed.subjects, query, type]);

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Search" }]} />
      <div><h1 className="text-3xl font-bold">Search all AP content</h1><p className="mt-2 text-slate-600">Find concepts, formulas, practice sets, and published manager content across every subject.</p></div>
      <section className="card grid gap-3 md:grid-cols-[1fr_12rem]"><input autoFocus type="search" className="input" placeholder="Search at least two characters…" value={query} onChange={(event) => setQuery(event.target.value)} /><select className="input" value={type} onChange={(event) => setType(event.target.value)}><option value="all">All types</option><option value="concept">Concepts</option><option value="formula">Formulas</option><option value="practice">Practice</option><option value="document">Documents</option></select></section>
      <section className="space-y-3">{results.map((item) => <Link key={`${item.type}-${item.id}`} href={item.href} className="card-hover block"><div className="flex flex-wrap gap-2"><span className="badge">{item.type}</span><span className="text-xs text-slate-500">{item.subject}</span></div><h2 className="mt-2 font-semibold">{item.title}</h2><p className="mt-1 line-clamp-2 text-sm text-slate-600">{item.detail}</p></Link>)}{query.trim().length >= 2 && results.length === 0 && <div className="card text-sm text-slate-500">No matching content.</div>}</section>
    </div>
  );
}
