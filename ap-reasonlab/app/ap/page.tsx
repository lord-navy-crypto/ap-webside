"use client";

import Link from "next/link";
import UploadAndShow from "@/components/UploadAndShow";

const apTools = [
  {
    href: "/concepts",
    title: "Concepts",
    description: "Subject folders → concepts & key guides. + to add.",
  },
  {
    href: "/formulas",
    title: "Formulas",
    description: "Subject folders → unit formulas. + to add.",
  },
  {
    href: "/practice",
    title: "Practice",
    description: "Subject folders → drills and generated sets. + to upload files.",
  },
  {
    href: "/hints",
    title: "Hint Coach",
    description: "Strategy hints only — default AI or bring your own key.",
  },
  {
    href: "/checklist",
    title: "Checklist",
    description: "What's done and what's next for this AP box.",
  },
  {
    href: "/guide",
    title: "Setup & AI Guide",
    description: "How to generate practice and use AI safely for AP.",
  },
];

export default function ApHubPage() {
  return (
    <div className="space-y-8">
      <section className="hero-gradient rounded-2xl px-6 py-8 text-white shadow-lg">
        <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
          AP BOX
        </span>
        <h1 className="mt-3 text-3xl font-bold">AP Area</h1>
        <p className="mt-2 max-w-2xl text-blue-100">
          Open a tool, then a subject folder. Every page has a + button — save with a change code.
        </p>
      </section>

      <UploadAndShow alsoShow={["concept", "formula"]} title="Uploaded files & notes" />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {apTools.map((tool) => (
          <Link key={tool.href} href={tool.href} className="card-hover group flex items-start gap-3">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-xl">
              📁
            </span>
            <div>
              <h2 className="font-semibold group-hover:text-brand-700">{tool.title}</h2>
              <p className="mt-1 text-sm text-slate-600">{tool.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
