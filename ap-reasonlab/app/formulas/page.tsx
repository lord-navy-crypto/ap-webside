import Link from "next/link";
import { formulas, getFormulaSubjects } from "@/data/formulas";

export default async function FormulasPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>;
}) {
  const params = await searchParams;
  const subjects = getFormulaSubjects();
  const activeSubject = params.subject ?? subjects[0];
  const filtered = formulas.filter((f) => f.subject === activeSubject);

  const byUnit = filtered.reduce<Record<string, typeof filtered>>((acc, f) => {
    if (!acc[f.unit]) acc[f.unit] = [];
    acc[f.unit].push(f);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Formula Reference</h1>
        <p className="mt-2 text-slate-600">
          AP-aligned formulas from College Board course frameworks. Use with
          generated practice — verify against your class notes.
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
        Physics 1 formulas match topics on the official AP Physics 1 equation
        sheet. Calculus AB has no official exam sheet — these are required
        curriculum formulas.
      </p>

      <div className="space-y-8">
        {Object.entries(byUnit).map(([unit, items]) => (
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
                    <span className="font-medium">When to use:</span>{" "}
                    {f.whenToUse}
                  </p>
                  <p className="text-xs text-slate-400">{f.sourceNote}</p>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

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
