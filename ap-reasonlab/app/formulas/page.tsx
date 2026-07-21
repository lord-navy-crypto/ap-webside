"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formulas, getFormulaSubjects } from "@/data/formulas";

function FormulasContent() {
  const searchParams = useSearchParams();
  const subjects = getFormulaSubjects();
  const activeSubject = searchParams.get("subject") ?? subjects[0];
  const filtered = formulas.filter((f) => f.subject === activeSubject);

  const [query, setQuery] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Formula Reference</h1>
        <p className="mt-2 text-slate-600">
          AP-aligned formulas from College Board course frameworks. Search by name or formula.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {subjects.map((s) => (
          <Link
            key={s}
            href={`/formulas?subject=${encodeURIComponent(s)}`}
            className={
              s === activeSubject
                ? "badge bg-brand-600 text-white"
                : "badge hover:bg-slate-100"
            }
          >
            {s}
          </Link>
        ))}
      </div>

      <p className="text-xs text-slate-500">
        Physics 1 formulas match topics on the official AP Physics 1 equation sheet. Calculus
        AB has no official exam sheet — these are required curriculum formulas.
      </p>

      <input
        type="text"
        className="input"
        placeholder={`Search ${activeSubject} formulas (e.g. torque, buoyancy, integral)...`}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {mounted && (
        <div className="space-y-8">
          {visibleUnits.length > 0 ? (
            visibleUnits.map(([unit, items]) => (
              <section key={unit} className="space-y-3">
                <h2 className="text-xl font-semibold text-brand-800">{unit}</h2>
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
        <h2 className="section-title">Formula practice sets</h2>
        <p className="text-sm text-slate-600">
          Apply these formulas in half-process generated sets — hints only.
        </p>
        <Link href="/questionnaires" className="btn-primary mt-3 inline-block">
          Browse generated sets
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
