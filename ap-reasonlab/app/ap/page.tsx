"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AP_CATALOG, type SubjectDefinition, type SubjectGroup } from "@/data/ap-catalog";
import type { ManagedContent } from "@/lib/managed-store";

const groups: Array<"All" | SubjectGroup> = ["All", "STEM", "Social Science", "Humanities"];

export default function ApHubPage() {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<(typeof groups)[number]>("All");
  const [managedSubjects, setManagedSubjects] = useState<SubjectDefinition[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("results-recent-subjects");
    if (stored) setRecent(JSON.parse(stored));
    const favoriteStore = localStorage.getItem("results-favorite-subjects");
    if (favoriteStore) setFavorites(JSON.parse(favoriteStore));
    fetch("/api/edit", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: Partial<ManagedContent>) => {
        setManagedSubjects(
          (data.subjects || []).filter((subject) => subject.enabled).map((subject) => ({
            ...subject,
            shortName: subject.shortName || subject.name.replace(/^AP /, ""),
            description: subject.description || "Managed AP subject workspace.",
            icon: subject.icon || "◇",
            color: subject.color || "blue",
            group: "Humanities" as SubjectGroup,
          }))
        );
      })
      .catch(() => undefined);
  }, []);

  const subjects = useMemo(() => {
    const all = [...AP_CATALOG, ...managedSubjects.filter((managed) => !AP_CATALOG.some((builtIn) => builtIn.slug === managed.slug))];
    const needle = query.trim().toLowerCase();
    return all
      .filter((subject) => group === "All" || subject.group === group)
      .filter((subject) => !needle || `${subject.name} ${subject.description}`.toLowerCase().includes(needle))
      .sort((a, b) => a.order - b.order);
  }, [group, managedSubjects, query]);

  const catalog = useMemo(
    () => [...AP_CATALOG, ...managedSubjects.filter((managed) => !AP_CATALOG.some((builtIn) => builtIn.slug === managed.slug))],
    [managedSubjects]
  );
  const recentSubjects = recent
    .map((slug) => catalog.find((subject) => subject.slug === slug))
    .filter(Boolean) as SubjectDefinition[];
  const favoriteSubjects = favorites
    .map((slug) => catalog.find((subject) => subject.slug === slug))
    .filter(Boolean) as SubjectDefinition[];

  function toggleFavorite(slug: string) {
    const next = favorites.includes(slug) ? favorites.filter((item) => item !== slug) : [slug, ...favorites];
    setFavorites(next);
    localStorage.setItem("results-favorite-subjects", JSON.stringify(next));
  }

  return (
    <div className="space-y-8">
      <section className="hero-gradient rounded-3xl px-6 py-9 text-white shadow-lg md:px-9">
        <div>
          <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">AP SUBJECT LIBRARY</span>
          <h1 className="mt-3 text-3xl font-bold md:text-4xl">Choose your AP subject first</h1>
          <p className="mt-2 max-w-2xl text-blue-100">Then open units, concepts, formulas, practice, documents, or the AI Hint Coach inside that subject.</p>
        </div>
      </section>

      {favoriteSubjects.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Favorites</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {favoriteSubjects.map((subject) => (
              <Link key={subject.slug} href={`/ap/${subject.slug}`} className="badge">
                ★ {subject.icon} {subject.shortName}
              </Link>
            ))}
          </div>
        </section>
      )}

      {recentSubjects.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Recently opened</h2>
          <div className="mt-3 flex flex-wrap gap-2">{recentSubjects.slice(0, 4).map((subject) => <Link key={subject.slug} href={`/ap/${subject.slug}`} className="badge">{subject.icon} {subject.shortName}</Link>)}</div>
        </section>
      )}

      <section className="card space-y-4">
        <input className="input" type="search" placeholder="Search AP subjects…" value={query} onChange={(event) => setQuery(event.target.value)} />
        <div className="flex flex-wrap gap-2">{groups.map((option) => <button key={option} type="button" onClick={() => setGroup(option)} className={group === option ? "filter-pill-active" : "filter-pill"}>{option}</button>)}</div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between"><h2 className="section-title">AP subjects</h2><span className="text-sm text-slate-500">{subjects.length} subjects</span></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => (
            <article key={subject.slug} className="card-hover group relative min-h-48">
              <button type="button" onClick={() => toggleFavorite(subject.slug)} className="absolute right-4 top-4 rounded-full p-2 text-lg text-amber-500 hover:bg-amber-50" aria-label={favorites.includes(subject.slug) ? `Remove ${subject.name} from favorites` : `Add ${subject.name} to favorites`}>{favorites.includes(subject.slug) ? "★" : "☆"}</button>
              <Link href={`/ap/${subject.slug}`} className="block pr-10">
                <div className="flex items-start gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-xl font-bold text-brand-700">{subject.icon}</span><span className="badge">{subject.group}</span></div>
                <h2 className="mt-5 text-xl font-bold group-hover:text-brand-700">{subject.shortName}</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{subject.description}</p>
                <span className="mt-4 inline-block text-sm font-semibold text-brand-600">Open subject →</span>
              </Link>
            </article>
          ))}
        </div>
        {subjects.length === 0 && <div className="card text-sm text-slate-500">No subjects match this search.</div>}
      </section>
    </div>
  );
}
