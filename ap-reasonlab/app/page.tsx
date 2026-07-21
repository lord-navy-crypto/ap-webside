import Link from "next/link";
import EthicsBanner from "@/components/EthicsBanner";

const features = [
  {
    title: "Concept Library",
    description: "Definitions, key points, common mistakes, and examples.",
    href: "/concepts",
    icon: "📚",
  },
  {
    title: "Key Concept Guides",
    description: "Introductions + how to use AI safely for each topic.",
    href: "/key-concepts",
    icon: "💡",
  },
  {
    title: "Formula Reference",
    description: "AP Physics 1 & Calc AB formulas with when-to-use notes.",
    href: "/formulas",
    icon: "📐",
  },
  {
    title: "Generated Sets",
    description: "AI-generated practice by subject — hints only, no answer keys.",
    href: "/questionnaires",
    icon: "✨",
  },
  {
    title: "Half-Process Practice",
    description: "Fill-in reasoning steps instead of copying solutions.",
    href: "/practice",
    icon: "🧩",
  },
  {
    title: "Hint Coach",
    description: "Live strategy hints from Gemini API (optional key).",
    href: "/hints",
    icon: "🎯",
  },
  {
    title: "Project Checklist",
    description: "What's done, in progress, and still on your to-do list.",
    href: "/checklist",
    icon: "✅",
  },
  {
    title: "AI Guide",
    description: "How to generate questions with Claude/ChatGPT and embed them.",
    href: "/guide",
    icon: "🤖",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="hero-gradient overflow-hidden rounded-2xl px-6 py-10 text-white shadow-xl md:px-10">
        <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold tracking-wide">
          GENERATED QUESTIONS ONLY
        </span>
        <h1 className="mt-4 max-w-2xl text-4xl font-bold leading-tight">
          Learn AP by reasoning — not by copying answers
        </h1>
        <p className="mt-4 max-w-xl text-lg text-blue-100">
          Feed topics to Claude or ChatGPT, generate original practice, embed it here.
          Tutor-style hints — never pasted exam keys.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/questionnaires"
            className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 shadow hover:bg-blue-50"
          >
            Browse generated sets
          </Link>
          <Link
            href="/guide"
            className="rounded-xl border border-white/40 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
          >
            AI setup guide
          </Link>
        </div>
      </section>

      <EthicsBanner />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <Link key={f.href} href={f.href} className="card-hover group">
            <span className="text-2xl">{f.icon}</span>
            <h2 className="mt-3 text-lg font-semibold group-hover:text-brand-700">
              {f.title}
            </h2>
            <p className="mt-2 text-sm text-slate-600">{f.description}</p>
          </Link>
        ))}
      </section>

      <section className="card space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="section-title">Build status</h2>
          <Link href="/checklist" className="text-sm font-medium text-brand-600 hover:underline">
            Full checklist →
          </Link>
        </div>
        <ul className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
          <li>✅ Live site + GitHub + Vercel deploy</li>
          <li>✅ Concepts, key guides, formulas (Physics 1 + Calc AB)</li>
          <li>✅ Generated sets + formula practice drills</li>
          <li>✅ Hint Coach (Gemini optional)</li>
          <li>🔄 Expanding Units 4–8 content</li>
          <li>🔜 GEMINI_API_KEY on Vercel + difficulty tiers UI</li>
        </ul>
      </section>
    </div>
  );
}
