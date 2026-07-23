import EnglishPageHeader from "@/components/EnglishPageHeader";
import EnglishResourcePanel from "@/components/EnglishResourcePanel";
import { academicVocabulary } from "@/data/english-content";

export default function VocabularyPage() {
  return <div className="space-y-8">
    <EnglishPageHeader eyebrow="English · Core skill" title="Academic Vocabulary" description="Study words as usable language: meaning, word family, collocation, and context—not isolated Chinese-English pairs." />
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {academicVocabulary.map((item) => <article key={item.word} className="card"><div className="flex items-start justify-between gap-3"><h2 className="text-xl font-bold text-brand-800">{item.word}</h2><span className="badge">academic</span></div><p className="mt-2 text-xs font-medium text-slate-500">{item.family}</p><p className="mt-3 text-sm text-slate-700">{item.meaning}</p><p className="mt-3 rounded-lg bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-900">{item.collocation}</p><p className="mt-3 text-sm italic leading-6 text-slate-600">“{item.example}”</p></article>)}
    </section>
    <section className="card"><h2 className="section-title">How to add a word</h2><ol className="mt-3 grid gap-3 text-sm text-slate-700 md:grid-cols-4"><li className="rounded-xl bg-slate-50 p-3"><strong>1. Meaning</strong><br/>One precise English explanation.</li><li className="rounded-xl bg-slate-50 p-3"><strong>2. Family</strong><br/>Noun, verb, adjective, adverb.</li><li className="rounded-xl bg-slate-50 p-3"><strong>3. Collocation</strong><br/>Words it naturally appears with.</li><li className="rounded-xl bg-slate-50 p-3"><strong>4. Your sentence</strong><br/>A specific original example.</li></ol></section>
    <EnglishResourcePanel space="vocabulary" title="Vocabulary lists & decks" />
  </div>;
}

