"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formulas, getFormulaSubjects } from "@/data/formulas";
import FolderGrid from "@/components/FolderGrid";
import ChangePanel from "@/components/ChangePanel";

function FormulasContent() {
  const searchParams = useSearchParams();
  const subjects = getFormulaSubjects();
  const activeSubject = searchParams.get("subject");
  const [query, setQuery] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const subjectFolders = subjects.map((s) => ({
    id: s,
    title: s,
    subtitle: "Open to browse formulas by unit",
    count: formulas.filter((f) => f.subject === s).length,
    href: `/formulas?subject=${encodeURIComponent(s)}`,
  }));

  const filtered = useMemo(
    () => (activeSubject ? formulas.filter((f) => f.subject === activeSubject) : []),
    [activeSubject]
  );

  const byUnit = useMemo(() => {
    return filtered.reduce<Record<string, typeof filtered>>((acc, f) => {
      if (!acc[f.unit]) acc[f.unit] = [];
      acc[f.unit].push(f);
      return acc;
    }, {});
  }, [filtered]);

  const visibleUnits = useMemo(() => {
    if (!query.trim()) return Object.entries(byUnit);
    const q = query.toLowerCase();
    return Object.entries(byUnit).filter(
      ([unit, items]) =>
        unit.toLowerCase().includes(q) ||
        items.some(
          (f) =>
            f.name.toLowerCase().includes(q) ||
            f.expression.toLowerCase().includes(q)
        )
    );
  }, [byUnit, query]);

  if (!activeSubject) {
    return (
      <div className="space-y-6">
        <div>
          <Link href="/ap" className="text-sm text-brand-600 hover:underline">
            ← AP Area
          </Link>
          <h1 className="mt-2 text-3xl font-bold">Formulas</h1>
          <p className="mt-2 text-slate-600">
            Open a subject folder first. Use + to add a formula or upload a file (change code required).
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <ChangePanel mode="formula" />
          <ChangePanel mode="file" label="+ Upload file" />
        </div>
        <FolderGrid folders={subjectFolders} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/formulas" className="text-sm text-brand-600 hover:underline">
          ← All subject folders
        </Link>
        <h1 className="mt-2 text-3xl font-bold">{activeSubject}</h1>
        <p className="mt-2 text-slate-600">
          Formulas for this subject, grouped by unit.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <ChangePanel mode="formula" defaultSubject={activeSubject} />
        <ChangePanel mode="file" label="+ Upload file" />
      </div>

      <input
        type="text"
        className="input"
        placeholder="Search formulas in this subject..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {mounted && (
        <div className="space-y-8">
          {visibleUnits.length > 0 ? (
            visibleUnits.map(([unit, items]) => (
              <section key={unit} className="space-y-3">
                <h2 className="flex items-center gap-2 text-xl font-semibold text-brand-800">
                  <span aria-hidden>📁</span> {unit}
                </h2>
                <div className="grid gap-4">
                  {items.map((f) => (
                    <article key={f.id} className="card space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold">{f.name}</h3>
                        {f.relatedConceptId && (
                          <Link
                            href={`/concepts/${f.relatedConceptId}`}
                            className="text-xs text-brand-600 hover:underline"
                          >
                            Related concept →
                          </Link>
                        )}
                      </div>
                      <p className="rounded-lg bg-slate-50 px-4 py-3 font-mono text-lg text-slate-900">
                        {f.expression}
                      </p>
                      <p className="text-sm text-slate-600">
                        <span className="font-medium">Variables:</span> {f.variables}
                      </p>
                      <p className="text-sm text-slate-600">
                        <span className="font-medium">When to use:</span> {f.whenToUse}
                      </p>
                      <p className="text-xs text-slate-400">{f.sourceNote}</p>
                    </article>
                  ))}
                </div>
              </section>
            ))
          ) : (
            <p className="text-sm text-slate-500">No formulas match your search.</p>
          )}
        </div>
      )}

      <section className="card bg-brand-50/50">
        <h2 className="section-title">Practice this subject</h2>
        <p className="text-sm text-slate-600">
          Open the matching subject folder in Practice for drills and generated sets.
        </p>
        <Link
          href={`/practice?subject=${encodeURIComponent(activeSubject)}`}
          className="btn-primary mt-3 inline-block"
        >
          Open practice folder
        </Link>
      </section>
    </div>
  );
}

export default function FormulasPage() {
  return (
    <Suspense fallback={<div className="text-sm text-slate-500">Loading formula reference...</div>}>
      <FormulasContent />
    </Suspense>
  );
}
