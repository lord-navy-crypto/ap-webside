import Link from "next/link";
import { notFound } from "next/navigation";
import { getConceptById } from "@/data/content";
import { formulas } from "@/data/formulas";
import { questionnaires } from "@/data/questionnaires";
import type { Questionnaire } from "@/lib/types";
import { loadManagedContent } from "@/lib/managed-store";
import RichContent, { FormulaMath } from "@/components/RichContent";
import ConceptAskAi from "@/components/ConceptAskAi";

export default async function ConceptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let concept = getConceptById(id);
  if (!concept) {
    const managed = await loadManagedContent();
    concept = (managed.concepts || []).find((c) => c.id === id);
  }

  if (!concept) notFound();

  const relatedFormulas = formulas.filter((f) => f.relatedConceptId === id);
  const relatedSets = questionnaires.filter((q) =>
    q.items.some((item) => "conceptId" in item && item.conceptId === id)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href="/concepts" className="text-sm text-brand-600 hover:underline">
          ← Back to concepts
        </Link>
        <Link href="/hints" className="text-sm text-brand-600 hover:underline">
          Open AI Toolbox →
        </Link>
      </div>

      <section className="card space-y-4">
        <span className="badge">{concept.subject}</span>
        <h1 className="text-3xl font-bold">{concept.title}</h1>
        <RichContent className="text-slate-600">{concept.summary}</RichContent>
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold">Key points</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
          {concept.keyPoints.map((point) => (
            <li key={point}>
              <RichContent>{point}</RichContent>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold">Common mistakes</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
          {concept.commonMistakes.map((mistake) => (
            <li key={mistake}>
              <RichContent>{mistake}</RichContent>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold">Example</h2>
        <RichContent className="mt-3 text-sm text-slate-700">{concept.example}</RichContent>
      </section>

      {relatedFormulas.length > 0 && (
        <section className="card">
          <h2 className="text-lg font-semibold">Related formulas</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {relatedFormulas.map((f) => (
              <li key={f.id} className="rounded-xl bg-slate-50 p-3 text-sm">
                <Link href="/formulas" className="font-medium text-brand-700 hover:underline">
                  {f.name}
                </Link>
                <FormulaMath expression={f.expression} className="mt-1 bg-transparent px-0 py-1 text-sm" />
              </li>
            ))}
          </ul>
        </section>
      )}

      {relatedSets.length > 0 && (
        <section className="card">
          <h2 className="text-lg font-semibold">Practice sets</h2>
          <ul className="mt-3 space-y-2">
            {relatedSets.map((q: Questionnaire) => (
              <li key={q.id}>
                <Link
                  href={`/questionnaires/${q.id}`}
                  className="text-sm font-medium text-brand-600 hover:underline"
                >
                  {q.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ConceptAskAi
        defaultSubject={concept.subject}
        conceptTitle={concept.title}
        conceptSummary={concept.summary}
        lockToConcept
      />
    </div>
  );
}
