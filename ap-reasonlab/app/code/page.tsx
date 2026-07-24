"use client";

import Link from "next/link";
import UnifiedMediaFrame from "@/components/UnifiedMediaFrame";
import { howToEmbedEditors, standardSnippets } from "@/data/code-snippets";

const langs = [
  {
    id: "python",
    title: "Python",
    href: "/code/python",
    description: "In-browser Pyodide playground + uploads.",
  },
  {
    id: "java",
    title: "Java",
    href: "/code/java",
    description: "CSA-style starters + documents. No in-browser runner yet.",
  },
  {
    id: "web",
    title: "Web / HTML",
    href: "/code/web",
    description: "Live HTML preview playground + uploads.",
  },
];

export default function CodePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Code Resource</h1>
        <p className="mt-2 text-slate-600">
          Python and Web include in-browser playgrounds. Java still uses snippets + uploads for now.
          Upload files, add documents, or save simulation notes with a change code.
        </p>
      </div>

      <UnifiedMediaFrame
        alsoShow={["document", "folder"]}
        folderArea="code"
        spaceKey="_root"
        spaceBasePath="/code"
        title="Code hub · pictures, documents & files"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {langs.map((r) => (
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

      <section className="card space-y-2">
        <h2 className="text-lg font-semibold">Editors</h2>
        <p className="text-sm text-slate-600">
          <Link href="/code/web" className="font-medium text-brand-700 underline">
            Web / HTML
          </Link>{" "}
          has a live preview editor.{" "}
          <Link href="/code/python" className="font-medium text-brand-700 underline">
            Python
          </Link>{" "}
          runs with Pyodide in the browser. Java still needs a remote runner later.
        </p>
        <pre className="whitespace-pre-wrap text-sm text-slate-600">{howToEmbedEditors}</pre>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Standard snippets (preview)</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {standardSnippets.map((s) => (
            <article key={s.id} className="card space-y-2">
              <div className="flex flex-wrap gap-2">
                <span className="badge">{s.language}</span>
              </div>
              <h3 className="font-semibold">{s.title}</h3>
              <p className="text-sm text-slate-600">{s.description}</p>
              <pre className="overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">
                {s.code}
              </pre>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
