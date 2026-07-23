import EnglishPageHeader from "@/components/EnglishPageHeader";
import EnglishPractice from "@/components/EnglishPractice";
import EnglishResourcePanel from "@/components/EnglishResourcePanel";
import { toeflQuestions } from "@/data/english-content";

export default function ToeflPage() {
  return <div className="space-y-8">
    <EnglishPageHeader eyebrow="English · Exam path" title="TOEFL iBT" description="Academic English preparation aligned to ETS's current 2026 task structure. Build transferable skills first, then practise focused task types." />
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[{ title: "Reading", text: "Complete the Words · Read in Daily Life · Academic Passage" }, { title: "Listening", text: "Responses · conversations · announcements · academic talks" }, { title: "Writing", text: "Build a Sentence · email · academic discussion" }, { title: "Speaking", text: "Focused tasks for clear communication in academic and campus settings" }].map((item) => <article key={item.title} className="card"><h2 className="font-semibold text-brand-800">{item.title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p></article>)}
    </section>
    <section className="card"><h2 className="section-title">Recommended study folders</h2><div className="mt-4 grid gap-3 sm:grid-cols-2"><p className="rounded-xl bg-slate-50 p-4 text-sm"><strong>Input skills:</strong> academic reading, lecture notes, paraphrase recognition, speaker purpose.</p><p className="rounded-xl bg-slate-50 p-4 text-sm"><strong>Output skills:</strong> sentence building, concise email, discussion response, structured speaking.</p></div></section>
    <section className="space-y-3"><div><h2 className="section-title">Original mini practice</h2><p className="mt-1 text-sm text-slate-600">These are site-created examples, not copied ETS questions.</p></div><EnglishPractice questions={toeflQuestions} /></section>
    <section className="card"><h2 className="font-semibold">Official TOEFL resources</h2><p className="mt-2 text-sm text-slate-600">Use ETS for the latest format and official preparation. Results is not affiliated with ETS.</p><div className="mt-3 flex flex-wrap gap-3"><a className="btn-secondary" href="https://www.ets.org/toefl/test-takers/ibt/about/content.html" target="_blank" rel="noreferrer">ETS test content ↗</a><a className="btn-secondary" href="https://www.ets.org/toefl/test-takers/ibt/prepare.html" target="_blank" rel="noreferrer">ETS preparation ↗</a></div></section>
    <EnglishResourcePanel space="toefl" title="TOEFL workbooks & notes" />
  </div>;
}

