"use client";

import Link from "next/link";
import PythonPlayground from "@/components/PythonPlayground";
import UnifiedMediaFrame from "@/components/UnifiedMediaFrame";
import { standardSnippets } from "@/data/code-snippets";

export default function CodePythonPage() {
  const snippets = standardSnippets.filter((s) => s.language === "python");
  return (
    <div className="space-y-6">
      <Link href="/code" className="text-sm text-brand-600 hover:underline">
        ← Back to Code Resource
      </Link>
      <div>
        <h1 className="text-3xl font-bold">Python</h1>
        <p className="mt-2 text-slate-600">
          In-browser Python (Pyodide). Run examples below, or upload your .py files with a change
          code.
        </p>
      </div>

      <PythonPlayground
        examples={snippets.map((item) => ({
          id: item.id,
          title: item.title,
          code: item.code,
        }))}
      />

      <UnifiedMediaFrame
        alsoShow={["document", "folder"]}
        folderArea="code-python"
        spaceKey="_root"
        spaceBasePath="/code/python"
        title="Python · pictures, documents & files"
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
