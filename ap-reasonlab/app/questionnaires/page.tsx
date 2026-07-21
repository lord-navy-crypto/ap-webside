import Link from "next/link";
import EthicsBanner from "@/components/EthicsBanner";
import {
  getSubjectsFromQuestionnaires,
  questionnaires,
} from "@/data/questionnaires";

export default async function QuestionnairesPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>;
}) {
  const sp = await searchParams;
  const subject = sp.subject;
  const subjects = getSubjectsFromQuestionnaires();

  const filtered = subject
    ? questionnaires.filter((q) => q.subject === subject)
    : questionnaires;

  return (
    <div className="space-y-8">
      <section className="hero-gradient rounded-2xl px-6 py-8 text-white shadow-lg">
        <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
          AI-Generated Only
        </span>
        <h1 className="mt-3 text-3xl font-bold">Generated Question Sets</h1>
        <p className="mt-2 max-w-2xl text-blue-100">
          All sets here are <strong className="text-white">original AI-generated</strong> practice —
          produced from topics and sample problems you feed to Claude or ChatGPT,
          then embedded into this site. No pasted exam keys.
        </p>
        <Link href="/guide" className="btn-secondary mt-4 inline-flex border-white/30 bg-white/10 text-white hover:bg-white/20">
          How to generate & upload →
        </Link>
      </section>

      <EthicsBanner />

      <div className="flex flex-wrap gap-2">
        <Link
          href="/questionnaires"
          className={!subject ? "filter-pill-active" : "filter-pill"}
        >
          All subjects
        </Link>
        {subjects.map((s) => (
          <Link
            key={s}
            href={`/questionnaires?subject=${encodeURIComponent(s)}`}
            className={subject === s ? "filter-pill-active" : "filter-pill"}
          >
            {s}
          </Link>
        ))}
      </div>

      <p className="text-sm text-slate-500">
        {filtered.length} generated set(s). Future: three difficulty tiers (coming soon).
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((q) => (
          <Link key={q.id} href={`/questionnaires/${q.id}`} className="card-hover block">
            <div className="flex flex-wrap gap-2">
              <span className="badge">{q.subject}</span>
              <span className="badge-generated">GENERATED</span>
              <span className="badge">~{q.estimatedMinutes} min</span>
            </div>
            <h2 className="mt-3 text-xl font-semibold text-slate-900">{q.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{q.description}</p>
            <p className="mt-3 text-xs text-slate-400">
              {q.items.length} items · {q.generationNote}
            </p>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="card text-sm text-slate-600">
          No sets for this subject. Add one in <code>data/questionnaires.ts</code> or see{" "}
          <Link href="/guide" className="text-brand-600 hover:underline">
            AI Guide
          </Link>
          .
        </div>
      )}
    </div>
  );
}
