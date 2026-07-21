import Link from "next/link";
import EthicsBanner from "@/components/EthicsBanner";
import { brand, collaborators } from "@/data/brand";

const boxes = [
  {
    title: "AP",
    description: "Concepts, formulas, practice — folders first. + to add with a change code.",
    href: "/ap",
  },
  {
    title: "Academic Platform",
    description: "Learning Box, shared materials, Picture, Image Gen.",
    href: "/academic",
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
    description: "Add members with the master change code.",
    href: "/partners",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="hero-gradient overflow-hidden rounded-2xl px-6 py-10 text-white shadow-xl md:px-10">
        <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold tracking-wide">
          RESULTS · ACADEMIC BOX & PLATFORM
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
            href="/academic"
            className="rounded-xl border border-white/40 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
          >
            Academic Platform
          </Link>
        </div>
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
        <h2 className="section-title">Collaborators</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {collaborators.map((c) => (
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
                  +
                </span>
              )}
              <div>
                <p className="font-medium text-slate-900">{c.name}</p>
                <p className="text-xs text-slate-500">{c.role}</p>
              </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
