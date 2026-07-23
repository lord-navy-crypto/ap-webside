import Link from "next/link";
import EnglishPageHeader from "@/components/EnglishPageHeader";
import EnglishResourcePanel from "@/components/EnglishResourcePanel";

export default function WritingPage() {
  return <div className="space-y-8">
    <EnglishPageHeader eyebrow="English · Core skill" title="Writing Workshop" description="Plan, draft, diagnose, and revise. Keep idea quality, organization, evidence, sentence control, and vocabulary as separate layers so feedback is actionable." />
    <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[{ title: "1. Purpose", text: "What must the reader understand or believe?" }, { title: "2. Structure", text: "Place each reason and example where it advances the argument." }, { title: "3. Evidence", text: "Use specific support and explain its relevance." }, { title: "4. Language", text: "Revise clarity, grammar, vocabulary, and concision last." }].map((item) => <article key={item.title} className="card"><h2 className="font-semibold text-brand-800">{item.title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p></article>)}
    </section>
    <section className="grid gap-4 md:grid-cols-3"><article className="card"><h2 className="font-semibold">Academic paragraph</h2><p className="mt-2 text-sm leading-6 text-slate-600">Claim → reason → specific evidence/example → explanation → qualification or link.</p></article><article className="card"><h2 className="font-semibold">Timed response</h2><p className="mt-2 text-sm leading-6 text-slate-600">Reserve a short planning block, develop fewer points well, then run one focused error check.</p></article><article className="card"><h2 className="font-semibold">Revision log</h2><p className="mt-2 text-sm leading-6 text-slate-600">Record recurring problems by category so the next draft targets a pattern, not just one sentence.</p></article></section>
    <section className="card flex flex-wrap items-center justify-between gap-4"><div><h2 className="font-semibold">Need feedback?</h2><p className="mt-1 text-sm text-slate-600">Paste your own draft into English AI and select Writing Feedback.</p></div><Link href="/english/ai" className="btn-primary">Open English AI</Link></section>
    <EnglishResourcePanel space="writing" title="Writing workbooks & drafts" />
  </div>;
}

