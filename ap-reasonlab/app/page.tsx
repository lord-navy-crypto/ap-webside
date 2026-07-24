import Link from "next/link";
import EthicsBanner from "@/components/EthicsBanner";
import { brand, trueJetMembers } from "@/data/brand";

const boxes = [
  {
    title: "AP",
    description: "Concepts, formulas, practice — folders first. + to add with a change code.",
    href: "/ap",
  },
  {
    title: "English Learning",
    description: "TOEFL, IELTS, SAT, vocabulary, writing, grammar, and a focused English AI tutor.",
    href: "/english",
  },
  {
    title: "Academic Platform",
    description: "Private Learning Box (notes + pictures) and shared materials.",
    href: "/academic",
  },
  {
    title: "AI Toolbox",
    description:
      "Local AI first — hints, concepts, Site Guide, calculator, grapher, Image Gen, English AI.",
    href: "/hints",
  },
  {
    title: "Code Resource",
    description: "Python, Java, and web folders. + to upload files.",
    href: "/code",
  },
  {
    title: "Forum",
    description: "Post tips and questions.",
    href: "/forum",
  },
  {
    title: "Partners",
    description: "TrueJet members with GitHub. Add anyone by name + GitHub username.",
    href: "/partners",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="hero-gradient overflow-hidden rounded-2xl px-6 py-10 text-white shadow-xl md:px-10">
        <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold tracking-wide">
          KNOWLEDGE EXPLORER · ACADEMIC BOX & PLATFORM
        </span>
        <h1 className="mt-4 max-w-2xl text-4xl font-bold leading-tight">{brand.name}</h1>
        <p className="mt-4 max-w-xl text-lg text-blue-100">{brand.tagline}</p>
        <p className="mt-3 max-w-xl text-blue-100/90">{brand.description}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/ap"
            className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 shadow hover:bg-blue-50"
          >
            Open AP box
          </Link>
          <Link
            href="/hints?tool=calculator"
            className="rounded-xl border border-white/40 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
          >
            Calculator & Grapher
          </Link>
          <Link
            href="/english"
            className="rounded-xl border border-white/40 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
          >
            English Learning
          </Link>
          <Link
            href="/hints"
            className="rounded-xl border border-white/40 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
          >
            AI Toolbox
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-5 py-4 text-emerald-950 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
          We recommend
        </p>
        <p className="mt-1 text-lg font-bold text-emerald-900">
          Local AI is the best. We recommend using Local AI. There are no restrictions.
        </p>
        <p className="mt-2 max-w-2xl text-sm text-emerald-900/85">
          Run study tools on your own device — private, free for the site, with no product-side
          caps. Open the AI Toolbox, enable a Local model, and use Cloud Instant only as backup.
        </p>
        <Link
          href="/hints"
          className="mt-3 inline-flex rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          Open AI Toolbox · use Local AI
        </Link>
      </section>

      <EthicsBanner />

      <section className="space-y-3">
        <h2 className="section-title">Main boxes</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {boxes.map((b) => (
            <Link key={b.href} href={b.href} className="card-hover group flex items-start gap-3">
              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-xl">
                📁
              </span>
              <div>
                <h3 className="text-lg font-semibold group-hover:text-brand-700">{b.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{b.description}</p>
              </div>
            </Link>
          ))}
        </div>
        <p className="text-sm text-slate-500">
          Coming later: A-Level box and IB box — same folder pattern, separate from AP.
        </p>
      </section>

      <section className="card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="section-title">TrueJet members</h2>
          <Link href="/partners" className="text-sm font-medium text-brand-600 hover:underline">
            Full roster & join →
          </Link>
        </div>
        <p className="text-sm text-slate-600">
          People on TrueJet / Knowledge Explorer with GitHub. Add anyone on Partners — free name + GitHub,
          not a fixed single choice.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {trueJetMembers.map((c) => (
            <a
              key={c.name}
              href={c.github}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-3 hover:border-brand-300"
            >
              {c.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.avatar} alt="" className="h-10 w-10 rounded-full" />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-500">
                  {c.name.slice(0, 1).toUpperCase()}
                </span>
              )}
              <div>
                <p className="font-medium text-slate-900">{c.name}</p>
                <p className="text-xs text-slate-500">{c.role}</p>
                <p className="text-xs text-brand-700">
                  @{c.github.replace(/^https?:\/\/github\.com\//i, "")}
                </p>
              </div>
            </a>
          ))}
          <Link
            href="/partners"
            className="flex items-center gap-3 rounded-xl border border-dashed border-slate-300 px-3 py-3 hover:border-brand-300"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-500">
              +
            </span>
            <div>
              <p className="font-medium text-slate-900">Add a person</p>
              <p className="text-xs text-slate-500">Name + GitHub on Partners</p>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
