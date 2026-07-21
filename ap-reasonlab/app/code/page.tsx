"use client";

import Link from "next/link";
import UploadAndShow from "@/components/UploadAndShow";

const resources = [
  {
    id: "python",
    title: "Python",
    description: "Snippets and study scripts. Upload files with +.",
    href: "/code/python",
  },
  {
    id: "java",
    title: "Java",
    description: "Java examples. Upload files with +.",
    href: "/code/java",
  },
  {
    id: "web",
    title: "Web / HTML",
    description: "Web demos and embeds. Upload files with +.",
    href: "/code/web",
  },
];

export default function CodePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Code Resource</h1>
        <p className="mt-2 text-slate-600">
          Programming area. Use + to upload code files or notes (change code required).
        </p>
      </div>

      <UploadAndShow alsoShow={["document"]} title="Uploaded files & notes" />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {resources.map((r) => (
          <Link key={r.id} href={r.href} className="card-hover group flex items-start gap-3">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-xl">
              📁
            </span>
            <div>
              <h2 className="font-semibold group-hover:text-brand-700">{r.title}</h2>
              <p className="mt-1 text-sm text-slate-600">{r.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
