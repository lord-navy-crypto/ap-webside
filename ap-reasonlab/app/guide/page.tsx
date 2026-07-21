import Link from "next/link";
import EthicsBanner from "@/components/EthicsBanner";

const steps = [
  {
    n: "1",
    title: "Install API access (free tier)",
    body: "Get a Gemini API key from Google AI Studio. Add it to .env.local. No fine-tuning needed for MVP.",
    href: "https://aistudio.google.com/apikey",
  },
  {
    n: "2",
    title: "Feed topics to Claude / ChatGPT",
    body: "Paste subject + topic + 2–3 sample problems you know. Ask AI to create NEW original questions (not copy wording).",
    href: "/docs/ai-workflow.md",
  },
  {
    n: "3",
    title: "Paste JSON into the website",
    body: "Copy AI output into data/questionnaires.ts as a new generated set.",
    href: "/docs/how-to-insert-questionnaires.md",
  },
  {
    n: "4",
    title: "Run & publish",
    body: "npm run dev locally, then deploy to Vercel. Optional: wire /api/hints for live Hint Coach.",
    href: "/SETUP-zh.md",
  },
];

export default function GuidePage() {
  return (
    <div className="space-y-8">
      <section className="hero-gradient rounded-2xl px-6 py-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold">AI Guide — Generate & Embed Questions</h1>
        <p className="mt-2 max-w-2xl text-blue-100">
          ReasonLab uses <strong className="text-white">generated questions only</strong>.
          You do not upload real exam keys. You feed topics to AI, get new practice, and embed it here.
        </p>
      </section>

      <EthicsBanner />

      <section className="grid gap-4 md:grid-cols-2">
        {steps.map((s) => (
          <div key={s.n} className="card space-y-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
              {s.n}
            </span>
            <h2 className="text-lg font-semibold">{s.title}</h2>
            <p className="text-sm text-slate-600">{s.body}</p>
            {s.href.startsWith("http") ? (
              <a href={s.href} className="text-sm font-medium text-brand-600 hover:underline" target="_blank" rel="noreferrer">
                Open link →
              </a>
            ) : (
              <p className="text-xs text-slate-400">See repo: {s.href}</p>
            )}
          </div>
        ))}
      </section>

      <section className="card space-y-4">
        <h2 className="section-title">Do I need to “train” AI?</h2>
        <p className="text-sm text-slate-600">
          For this project, <strong>no model training</strong> is required. You use:
        </p>
        <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
          <li>
            <strong>Prompting</strong> — tell Claude/ChatGPT the topic and output format
          </li>
          <li>
            <strong>Static embed</strong> — paste generated JSON into{" "}
            <code className="rounded bg-slate-100 px-1">data/questionnaires.ts</code>
          </li>
          <li>
            <strong>Live API (optional)</strong> — Hint Coach calls Gemini at runtime via{" "}
            <code className="rounded bg-slate-100 px-1">/api/hints</code>
          </li>
        </ul>
        <p className="text-sm text-slate-500">
          Fine-tuning / RAG is advanced and optional later. Start with prompts + paste.
        </p>
      </section>

      <section className="card space-y-3">
        <h2 className="section-title">Three difficulty levels (planned)</h2>
        <p className="text-sm text-slate-600">
          You asked for Tier 1 / 2 / 3. Types already include optional{" "}
          <code className="rounded bg-slate-100 px-1">difficultyTier</code> — UI filters coming later.
          For now, tag sets in <code className="rounded bg-slate-100 px-1">tags</code> (e.g. intro, standard, challenge).
        </p>
      </section>

      <section className="card space-y-3">
        <h2 className="section-title">Full documentation (in repo)</h2>
        <ul className="space-y-2 text-sm">
          <li>
            <code>docs/ai-workflow.md</code> — Claude/ChatGPT prompts, upload workflow
          </li>
          <li>
            <code>docs/how-to-insert-questionnaires.md</code> — JSON schema & embed steps
          </li>
          <li>
            <code>SETUP-zh.md</code> — install Node, run dev server (中文)
          </li>
        </ul>
        <Link href="/questionnaires" className="btn-primary inline-flex">
          View generated sets
        </Link>
      </section>
    </div>
  );
}
