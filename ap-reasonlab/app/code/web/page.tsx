"use client";

import Link from "next/link";
import UploadAndShow from "@/components/UploadAndShow";
import { standardSnippets } from "@/data/code-snippets";

export default function CodeWebPage() {
  const snippets = standardSnippets.filter((s) => s.language === "html");
  return (
    <div className="space-y-6">
      <Link href="/code" className="text-sm text-brand-600 hover:underline">
        ← Back to Code Resource
      </Link>
      <div>
        <h1 className="text-3xl font-bold">Web / HTML</h1>
        <p className="mt-2 text-slate-600">
          HTML starters. Use + Add document with category <strong>Simulation</strong> for simulation
          webpage notes/links. No iframe editor installed yet.
        </p>
      </div>

      <UploadAndShow
        alsoShow={["document", "folder"]}
        folderArea="code-web"
        spaceKey="_root"
        spaceBasePath="/code/web"
        title="Web files & simulation docs"
      />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Standard HTML</h2>
        {snippets.map((s) => (
          <article key={s.id} className="card space-y-2">
            <h3 className="font-semibold">{s.title}</h3>
            <p className="text-sm text-slate-600">{s.description}</p>
            <pre className="overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">
              {s.code}
            </pre>
          </article>
        ))}
      </section>
    </div>
  );
}
