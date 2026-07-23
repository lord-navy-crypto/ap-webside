import EnglishPageHeader from "@/components/EnglishPageHeader";
import EnglishPractice from "@/components/EnglishPractice";
import EnglishResourcePanel from "@/components/EnglishResourcePanel";
import { satQuestions } from "@/data/english-content";

export default function SatPage() {
  return <div className="space-y-8">
    <EnglishPageHeader eyebrow="English · Exam path" title="Digital SAT" description="This English-area page focuses on SAT Reading and Writing: short passages, precise evidence, rhetoric, transitions, and Standard English conventions." />
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[{ title: "Information and Ideas", text: "Central ideas, details, evidence, and inferences" }, { title: "Craft and Structure", text: "Words in context, text purpose, and connections" }, { title: "Expression of Ideas", text: "Rhetorical synthesis and transitions" }, { title: "Standard English", text: "Sentence structure, usage, and punctuation" }].map((item) => <article key={item.title} className="card"><h2 className="font-semibold text-brand-800">{item.title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p></article>)}
    </section>
    <section className="card"><h2 className="section-title">Format snapshot</h2><p className="mt-2 text-sm leading-6 text-slate-600">The full SAT has Reading and Writing plus Math. Reading and Writing has two 32-minute modules; each question follows a short passage or passage pair. Module 2 adapts based on Module 1 performance.</p></section>
    <section className="space-y-3"><div><h2 className="section-title">Original mini practice</h2><p className="mt-1 text-sm text-slate-600">Original questions that practise official skill domains without copying College Board items.</p></div><EnglishPractice questions={satQuestions} /></section>
    <section className="card"><h2 className="font-semibold">Official SAT practice</h2><div className="mt-3 flex flex-wrap gap-3"><a className="btn-secondary" href="https://satsuite.collegeboard.org/practice/student-question-bank" target="_blank" rel="noreferrer">Student Question Bank ↗</a><a className="btn-secondary" href="https://satsuite.collegeboard.org/practice/practice-tests" target="_blank" rel="noreferrer">Bluebook & practice tests ↗</a></div></section>
    <EnglishResourcePanel space="sat" title="SAT workbooks & notes" />
  </div>;
}

