"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { concepts } from "@/data/content";

export default function ConceptsPage() {
  const [query, setQuery] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filtered = concepts.filter((concept) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      concept.title.toLowerCase().includes(q) ||
      concept.subject.toLowerCase().includes(q) ||
      concept.summary.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Concept Library</h1>
        <p className="mt-2 text-slate-600">
          Core AP knowledge points. Search by title, subject, or topic.
        </p>
      </div>

      <input
        type="text"
        className="input"
        placeholder="Search concepts (e.g. torque, integral, limit)..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {mounted && (
        <div className="grid gap-4">
          {filtered.length > 0 ? (
            filtered.map((concept) => (
              <Link
                key={concept.id}
                href={`/concepts/${concept.id}`}
                className="card block hover:border-brand-300 transition"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="badge">{concept.subject}</span>
                </div>
                <h2 className="mt-3 text-xl font-semibold">{concept.title}</h2>
                <p className="mt-2 text-sm text-slate-600">{concept.summary}</p>
              </Link>
            ))
          ) : (
            <p className="text-sm text-slate-500">No concepts match your search.</p>
          )}
        </div>
      )}
    </div>
  );
}
