"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ManagedContent } from "@/lib/managed-store";

export default function ManagedMaterialsPage() {
  const [content, setContent] = useState<ManagedContent | null>(null);

  useEffect(() => {
    fetch("/api/admin/content")
      .then((r) => r.json())
      .then(setContent)
      .catch(() => setContent(null));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/academic" className="text-sm text-brand-600 hover:underline">
          ← Academic Platform
        </Link>
        <h1 className="mt-2 text-3xl font-bold">Shared learning materials</h1>
        <p className="mt-2 text-slate-600">
          Documents and files uploaded by admin/partners via Manager UI. Visible to everyone.
        </p>
      </div>

      {!content ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Documents ({content.documents.length})</h2>
            {content.documents.length === 0 ? (
              <div className="card text-sm text-slate-500">
                No shared documents yet. Admin can add them in{" "}
                <Link href="/admin" className="text-brand-600 hover:underline">
                  Manager
                </Link>
                .
              </div>
            ) : (
              content.documents.map((d) => (
                <article key={d.id} className="card space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <span className="badge">{d.category}</span>
                  </div>
                  <h3 className="text-lg font-semibold">{d.title}</h3>
                  <p className="whitespace-pre-wrap text-sm text-slate-700">{d.content}</p>
                </article>
              ))
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Files ({content.files.length})</h2>
            {content.files.length === 0 ? (
              <div className="card text-sm text-slate-500">No shared files yet.</div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {content.files.map((f) => (
                  <div key={f.id} className="card space-y-2">
                    <p className="font-medium">{f.name}</p>
                    <p className="text-xs text-slate-500">{f.mime}</p>
                    {f.dataUrl?.startsWith("data:image") && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={f.dataUrl} alt={f.name} className="max-h-48 rounded-lg object-contain" />
                    )}
                    {f.dataUrl && (
                      <a href={f.dataUrl} download={f.name} className="text-sm text-brand-600 hover:underline">
                        Download
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
