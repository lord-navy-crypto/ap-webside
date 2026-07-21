import Link from "next/link";
import { concepts } from "@/data/content";

export default function ConceptsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Concept Library</h1>
        <p className="mt-2 text-slate-600">
          Core AP knowledge points. AI explanations will be added on each concept page later.
        </p>
      </div>

      <div className="grid gap-4">
        {concepts.map((concept) => (
          <Link
            key={concept.id}
            href={`/concepts/${concept.id}`}
            className="card block hover:border-brand-300 transition"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge">{concept.subject}</span>
            </div>
            <h2 className="mt-3 text-xl font-semibold">{concept.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{concept.summary}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
