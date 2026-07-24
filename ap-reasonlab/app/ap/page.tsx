"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import UnifiedMediaFrame from "@/components/UnifiedMediaFrame";
import { AP_CATALOG, type SubjectDefinition, type SubjectGroup } from "@/data/ap-catalog";
import { AP_SUBJECTS } from "@/data/ap-expanded";
import type { ManagedContent } from "@/lib/managed-types";

const groups: Array<"All" | SubjectGroup> = ["All", "STEM", "Social Science", "Humanities"];

/** Never allow an empty built-in list — rebuild from names if the catalog export fails. */
function builtInCatalog(): SubjectDefinition[] {
  if (Array.isArray(AP_CATALOG) && AP_CATALOG.length > 0) return AP_CATALOG;
  return AP_SUBJECTS.map((name, index) => ({
    id: name.toLowerCase().replace(/^ap\s+/, "").replace(/[^a-z0-9]+/g, "-"),
    slug: name.toLowerCase().replace(/^ap\s+/, "").replace(/[^a-z0-9]+/g, "-"),
    name,
    shortName: name.replace(/^AP /, ""),
    description: `Concepts, formulas, practice, documents, and study tools for ${name}.`,
    icon: "◇",
    color: "blue",
    group: "STEM" as SubjectGroup,
    order: index,
    enabled: true,
  }));
}

function mergeCatalog(managed: SubjectDefinition[]): SubjectDefinition[] {
  const base = builtInCatalog();
  const extras = managed.filter(
    (managedSubject) => !base.some((builtIn) => builtIn.slug === managedSubject.slug)
  );
  return [...base, ...extras];
}

export default function ApHubPage() {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<(typeof groups)[number]>("All");
  const [managedSubjects, setManagedSubjects] = useState<SubjectDefinition[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("results-recent-subjects");
      if (stored) setRecent(JSON.parse(stored) as string[]);
      const favoriteStore = localStorage.getItem("results-favorite-subjects");
      if (favoriteStore) setFavorites(JSON.parse(favoriteStore) as string[]);
    } catch {
      /* ignore corrupt local favorites/recent */
    }

    fetch("/api/edit", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: Partial<ManagedContent>) => {
        const rows = Array.isArray(data.subjects) ? data.subjects : [];
        setManagedSubjects(
          rows
            .filter((subject) => subject && subject.enabled !== false)
            .map((subject, index) => {
              const name = String(subject.name || subject.shortName || subject.slug || "Subject");
              return {
                id: subject.id || subject.slug || `managed-${index}`,
                slug: subject.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                name,
                shortName: subject.shortName || name.replace(/^AP /, ""),
                description: subject.description || "Managed AP subject workspace.",
                icon: subject.icon || "◇",
                color: subject.color || "blue",
                group: "Humanities" as SubjectGroup,
                order: Number.isFinite(Number(subject.order)) ? Number(subject.order) : 1000 + index,
                enabled: subject.enabled !== false,
              };
            })
        );
      })
      .catch(() => undefined);
  }, []);

  const catalog = useMemo(() => mergeCatalog(managedSubjects), [managedSubjects]);

  const subjects = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return catalog
      .filter((subject) => group === "All" || subject.group === group)
      .filter(
        (subject) =>
          !needle ||
          `${subject.name} ${subject.shortName} ${subject.description}`.toLowerCase().includes(needle)
      )
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [catalog, group, query]);

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

  function clearFilters() {
    setQuery("");
    setGroup("All");
  }

  return (
    <div className="space-y-8">
      <section className="hero-gradient rounded-3xl px-6 py-9 text-white shadow-lg md:px-9">
        <div>
          <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">AP SUBJECT LIBRARY</span>
          <h1 className="mt-3 text-3xl font-bold md:text-4xl">Choose your AP subject first</h1>
          <p className="mt-2 max-w-2xl text-blue-100">Then open units, concepts, formulas, practice, documents, or the AI Toolbox inside that subject.</p>
        </div>
      </section>

      <section className="card space-y-3 border-brand-100 bg-brand-50/40">
        <h2 className="text-lg font-bold text-slate-900">AP Statistics FRQ pack</h2>
        <p className="text-sm text-slate-600">
          Generated FRQ sets plus the regenerated practice pack (PDF/MD with reference answers) live
          under Concepts, Practice, and subject storage.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/practice?subject=AP%20Statistics" className="btn-primary">
            Statistics practice
          </Link>
          <Link href="/concepts?subject=AP%20Statistics" className="btn-secondary">
            Statistics topics & docs
          </Link>
          <Link href="/ap/statistics" className="btn-ghost">
            Open Statistics subject
          </Link>
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
        <input
          className="input"
          type="search"
          placeholder="Search AP subjects…"
          value={query}
          autoComplete="off"
          spellCheck={false}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          {groups.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setGroup(option)}
              className={group === option ? "filter-pill-active" : "filter-pill"}
            >
              {option}
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="section-title">AP subjects</h2>
          <span className="text-sm text-slate-500">{subjects.length} subjects</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => (
            <article key={subject.slug} className="card-hover group relative min-h-48">
              <button
                type="button"
                onClick={() => toggleFavorite(subject.slug)}
                className="absolute right-4 top-4 rounded-full p-2 text-lg text-amber-500 hover:bg-amber-50"
                aria-label={
                  favorites.includes(subject.slug)
                    ? `Remove ${subject.name} from favorites`
                    : `Add ${subject.name} to favorites`
                }
              >
                {favorites.includes(subject.slug) ? "★" : "☆"}
              </button>
              <Link href={`/ap/${subject.slug}`} className="block pr-10">
                <div className="flex items-start gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-xl font-bold text-brand-700">
                    {subject.icon}
                  </span>
                  <span className="badge">{subject.group}</span>
                </div>
                <h2 className="mt-5 text-xl font-bold group-hover:text-brand-700">{subject.shortName}</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{subject.description}</p>
                <span className="mt-4 inline-block text-sm font-semibold text-brand-600">Open subject →</span>
              </Link>
            </article>
          ))}
        </div>
        {subjects.length === 0 && (
          <div className="card space-y-3 text-sm text-slate-600">
            <p>
              {query.trim() || group !== "All"
                ? "No subjects match this search."
                : "Built-in AP subjects failed to load."}
            </p>
            <button type="button" className="btn-secondary" onClick={clearFilters}>
              Clear search & filters
            </button>
          </div>
        )}
      </section>

      <UnifiedMediaFrame
        title="AP hub · pictures, documents & files"
        folderArea="ap"
        spaceKey="_root"
        alsoShow={["document", "folder"]}
        collapsedByDefault
      />
    </div>
  );
}
