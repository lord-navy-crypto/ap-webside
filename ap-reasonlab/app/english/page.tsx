import Link from "next/link";
import EnglishResourcePanel from "@/components/EnglishResourcePanel";
import { englishAreas } from "@/data/english-content";

export default function EnglishHubPage() {
  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-blue-900 to-brand-700 px-6 py-10 text-white shadow-xl md:px-10">
        <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider">English Learning</span>
        <h1 className="mt-4 text-4xl font-bold">English Learning Hub</h1>
        <p className="mt-3 max-w-3xl text-lg leading-8 text-blue-100">
          One organized home for TOEFL, IELTS, SAT, vocabulary, grammar, writing, and an English-only AI tutor. Choose a path first, then study or add materials inside that folder.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/english/ai" className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-brand-800">Open English AI</Link>
          <Link href="/english/vocabulary" className="rounded-xl border border-white/30 px-5 py-2.5 text-sm font-semibold">Study vocabulary</Link>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="section-title">Choose a learning path</h2>
          <p className="mt-1 text-sm text-slate-600">Exam areas stay separate from reusable language skills, so the hub does not become one long mixed page.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {englishAreas.map((area) => (
            <Link key={area.href} href={area.href} className="card-hover group flex gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-sm font-bold text-indigo-700">{area.icon}</span>
              <span><span className="block text-lg font-semibold group-hover:text-brand-700">{area.title}</span><span className="mt-1 block text-sm leading-6 text-slate-600">{area.description}</span></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[{ title: "1. Build", text: "Vocabulary, sentence control, reading, listening, and idea development." }, { title: "2. Apply", text: "Use those skills in TOEFL, IELTS, or SAT-style original practice." }, { title: "3. Review", text: "Save mistakes, upload class workbooks, and ask English AI for focused feedback." }].map((item) => <article key={item.title} className="card"><h2 className="font-semibold">{item.title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p></article>)}
      </section>

      <EnglishResourcePanel space="hub" title="English shared resources" />
    </div>
  );
}

