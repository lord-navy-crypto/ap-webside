"use client";

import Link from "next/link";
import UploadAndShow from "@/components/UploadAndShow";

const apTools = [
  {
    href: "/concepts",
    title: "Concepts",
    description: "Subject folders → topics & guides. + Add subject / + Add topic.",
  },
  {
    href: "/formulas",
    title: "Formulas",
    description: "Subject folders → unit formulas. + Add subject / + Add formula.",
  },
  {
    href: "/practice",
    title: "Practice",
    description: "Subject folders → drills & AI FRQ sets. + Add subject / + Add generated set.",
  },
  {
    href: "/practice?subject=AP%20Statistics",
    title: "AP Statistics FRQs",
    description:
      "Generated FRQ sets + document section: regenerated practice pack PDF/MD with reference answers.",
  },
  {
    href: "/concepts?subject=AP%20Statistics",
    title: "AP Statistics Topics & Docs",
    description: "Topics, guides, and the FRQ Practice Pack document for Statistics.",
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
          Open Concepts / Formulas / Practice, then a subject folder. Every tool page has + buttons —
          including <strong className="text-white">+ Add subject</strong>,{" "}
          <strong className="text-white">+ Add topic</strong>, and{" "}
          <strong className="text-white">+ Add generated practice set</strong>. Save with a change
          code.
        </p>
      </section>

      <UploadAndShow
        alsoShow={["subject", "topic", "concept", "formula", "questionnaire", "document", "folder"]}
        defaultSubject="AP Statistics"
        folderArea="ap"
        spaceKey="AP Statistics"
        spaceBasePath="/ap"
        title="AP Statistics storage"
      />

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
