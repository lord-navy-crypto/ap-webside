"use client";

import Link from "next/link";
import UploadAndShow from "@/components/UploadAndShow";
import { standardSnippets } from "@/data/code-snippets";

export default function CodeJavaPage() {
  const snippets = standardSnippets.filter((s) => s.language === "java");
  return (
    <div className="space-y-6">
      <Link href="/code" className="text-sm text-brand-600 hover:underline">
        ← Back to Code Resource
      </Link>
      <div>
        <h1 className="text-3xl font-bold">Java</h1>
        <p className="mt-2 text-slate-600">
          CSA-style starters. No in-browser editor yet — use IntelliJ / Replit locally, or upload
          .java files here.
        </p>
      </div>

      <UploadAndShow
        alsoShow={["document", "folder"]}
        folderArea="code-java"
        title="Java files & notes"
      />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Standard code</h2>
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
