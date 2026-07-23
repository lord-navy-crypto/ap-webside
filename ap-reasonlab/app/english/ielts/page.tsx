import EnglishPageHeader from "@/components/EnglishPageHeader";
import EnglishPractice from "@/components/EnglishPractice";
import EnglishResourcePanel from "@/components/EnglishResourcePanel";
import { ieltsQuestions } from "@/data/english-content";

export default function IeltsPage() {
  return <div className="space-y-8">
    <EnglishPageHeader eyebrow="English · Exam path" title="IELTS Academic" description="Plan and practise Listening, Academic Reading, Academic Writing, and Speaking without mixing every skill into one page." />
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[{ title: "Listening", text: "Four parts · about 30 minutes · answers follow recording order" }, { title: "Reading", text: "60 minutes · academic sources · matching, completion, views, and short answers" }, { title: "Writing", text: "60 minutes · Task 1 visual information · Task 2 position or argument" }, { title: "Speaking", text: "11–14 minutes · three-part interactive interview" }].map((item) => <article key={item.title} className="card"><h2 className="font-semibold text-brand-800">{item.title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p></article>)}
    </section>
    <section className="grid gap-4 md:grid-cols-2"><article className="card"><h2 className="font-semibold">Writing notebook</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600"><li>Task 1: overview before detail selection</li><li>Task 2: position, reasons, specific support, and qualification</li><li>Track repeated grammar errors separately from idea problems</li></ul></article><article className="card"><h2 className="font-semibold">Speaking notebook</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600"><li>Answer → reason → concrete example</li><li>Practise paraphrasing when a word is unavailable</li><li>Review clarity and development, not memorized scripts</li></ul></article></section>
    <section className="space-y-3"><div><h2 className="section-title">Original mini practice</h2><p className="mt-1 text-sm text-slate-600">Site-created items based on general task skills, not copied IELTS test material.</p></div><EnglishPractice questions={ieltsQuestions} /></section>
    <section className="card"><h2 className="font-semibold">Official IELTS resources</h2><div className="mt-3 flex flex-wrap gap-3"><a className="btn-secondary" href="https://ielts.org/take-a-test/test-types/ielts-academic-test" target="_blank" rel="noreferrer">Academic format ↗</a><a className="btn-secondary" href="https://ielts.org/take-a-test/preparation-resources/sample-test-questions/academic-test" target="_blank" rel="noreferrer">Official samples ↗</a></div></section>
    <EnglishResourcePanel space="ielts" title="IELTS workbooks & notes" />
  </div>;
}

