"use client";

import Link from "next/link";
import UploadAndShow from "@/components/UploadAndShow";

const academicTools = [
  {
    href: "/learning-box",
    title: "Learning Box",
    description:
      "Document & Storage for your own notes and materials, plus Random Draw for spaced review.",
  },
  {
    href: "/academic/materials",
    title: "Shared materials",
    description: "Documents and files added with a change code — visible to everyone.",
  },
  {
    href: "/picture",
    title: "Picture",
    description: "Upload photos of handwritten notes, textbook pages, and diagrams.",
  },
  {
    href: "/image-gen",
    title: "Image Generation",
    description: "Generate study visuals from a prompt. Free, no API key needed.",
  },
];

export default function AcademicPlatformPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 px-6 py-8 text-white shadow-lg">
        <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
          ACADEMIC PLATFORM
        </span>
        <h1 className="mt-3 text-3xl font-bold">Academic Platform</h1>
        <p className="mt-2 max-w-2xl text-slate-300">
          Cross-curriculum tools. Click + to add documents or upload files — save with a change code.
        </p>
      </section>

      <UploadAndShow alsoShow={["document"]} title="Uploaded files & notes" />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {academicTools.map((tool) => (
          <Link key={tool.href} href={tool.href} className="card-hover group flex items-start gap-3">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-xl">
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
