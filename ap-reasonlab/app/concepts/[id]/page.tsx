import Link from "next/link";
import { notFound } from "next/navigation";
import { getConceptById } from "@/data/content";

export default async function ConceptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const concept = getConceptById(id);

  if (!concept) notFound();

  return (
    <div className="space-y-6">
      <Link href="/concepts" className="text-sm text-brand-600 hover:underline">
        ← Back to concepts
      </Link>

      <section className="card space-y-4">
        <span className="badge">{concept.subject}</span>
        <h1 className="text-3xl font-bold">{concept.title}</h1>
        <p className="text-slate-600">{concept.summary}</p>
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold">Key points</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
          {concept.keyPoints.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold">Common mistakes</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
          {concept.commonMistakes.map((mistake) => (
            <li key={mistake}>{mistake}</li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold">Example</h2>
        <p className="mt-3 text-sm text-slate-700">{concept.example}</p>
      </section>

      <section className="card border-dashed">
        <h2 className="text-lg font-semibold">Ask AI (coming next)</h2>
        <p className="mt-2 text-sm text-slate-600">
          This section will let you ask follow-up questions about this concept.
          The AI will explain ideas without giving exam-style final answers.
        </p>
      </section>
    </div>
  );
}
