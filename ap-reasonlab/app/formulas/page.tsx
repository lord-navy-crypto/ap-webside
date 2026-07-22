"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formulas, getFormulaSubjects } from "@/data/formulas";
import { AP_SUBJECTS } from "@/data/ap-expanded";
import FolderGrid from "@/components/FolderGrid";
import UploadAndShow from "@/components/UploadAndShow";
import { ROOT_SPACE, spaceFromSearchParams } from "@/lib/storage-space";
import RichContent, { FormulaMath } from "@/components/RichContent";
import type { Formula } from "@/lib/types";

function FormulasContent() {
  const searchParams = useSearchParams();
  const [managedSubjects, setManagedSubjects] = useState<string[]>([]);
  const [managedFormulas, setManagedFormulas] = useState<Formula[]>([]);
  const subjects = useMemo(() => {
    const set = new Set<string>([
      ...AP_SUBJECTS,
      ...getFormulaSubjects(),
      ...managedSubjects,
      ...managedFormulas.map((f) => f.subject),
    ]);
    return [...set].sort();
  }, [managedSubjects, managedFormulas]);
  const activeSubject = searchParams.get("subject");
  const folderParam = searchParams.get("folder");
  const spaceKey = spaceFromSearchParams({ subject: activeSubject, folder: folderParam });
  const [query, setQuery] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/edit", { cache: "no-store" });
        const data = await res.json();
        if (cancelled) return;
        setManagedSubjects(Array.isArray(data.subjects) ? data.subjects.map(String) : []);
        setManagedFormulas(Array.isArray(data.formulas) ? data.formulas : []);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [spaceKey]);

  const subjectFolders = subjects.map((s) => ({
    id: s,
    title: s,
    subtitle: "Open to browse formulas by unit · + to add",
    count:
      formulas.filter((f) => f.subject === s).length +
      managedFormulas.filter((f) => f.subject === s).length,
    href: `/formulas?subject=${encodeURIComponent(s)}`,
  }));

  const filtered = useMemo(() => {
    if (!activeSubject) return [];
    const builtIn = formulas.filter((f) => f.subject === activeSubject);
    const seen = new Set(builtIn.map((f) => f.id));
    const extra = managedFormulas.filter(
      (f) => f.subject === activeSubject && !seen.has(f.id)
    );
    return [...builtIn, ...extra];
  }, [activeSubject, managedFormulas]);

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
            Open a subject folder to add formulas. Use <strong>+ Add subject folder</strong> to
            create a new subject in this grid.
          </p>
        </div>
        <UploadAndShow
          alsoShow={["subject", "folder"]}
          folderArea="formulas"
          spaceKey={ROOT_SPACE}
          spaceBasePath="/formulas"
          title="Root formulas storage"
          onSubjectsChange={setManagedSubjects}
        />
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
          Formulas for this subject, grouped by unit. Use <strong>+ Add formula</strong> to add more.
        </p>
      </div>

      <UploadAndShow
        alsoShow={["formula", "folder"]}
        folderArea="formulas"
        defaultSubject={activeSubject || undefined}
        spaceKey={spaceKey}
        spaceBasePath="/formulas"
        title={`${activeSubject} storage`}
        onSubjectsChange={setManagedSubjects}
      />

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
                        {f.id.startsWith("m-formula") && (
                          <span className="badge-generated">ADDED</span>
                        )}
                        {f.relatedConceptId && (
                          <Link
                            href={`/concepts/${f.relatedConceptId}`}
                            className="text-xs text-brand-600 hover:underline"
                          >
                            Related concept →
                          </Link>
                        )}
                      </div>
                      <FormulaMath expression={f.expression} />
                      <div className="text-sm text-slate-600">
                        <span className="font-medium">Variables:</span>{" "}
                        <RichContent className="inline [&>p]:inline">{f.variables}</RichContent>
                      </div>
                      <div className="text-sm text-slate-600">
                        <span className="font-medium">When to use:</span>{" "}
                        <RichContent className="inline [&>p]:inline">{f.whenToUse}</RichContent>
                      </div>
                      <p className="text-xs text-slate-400">{f.sourceNote}</p>
                    </article>
                  ))}
                </div>
              </section>
            ))
          ) : (
            <p className="text-sm text-slate-500">
              No formulas yet. Use + Add formula above.
            </p>
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
