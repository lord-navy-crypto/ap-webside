"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { concepts } from "@/data/content";
import { keyConceptGuides } from "@/data/key-concepts";
import { AP_SUBJECTS } from "@/data/ap-expanded";
import FolderGrid from "@/components/FolderGrid";
import UploadAndShow from "@/components/UploadAndShow";

type Filter = "all" | "concept" | "guide";

function ConceptsContent() {
  const searchParams = useSearchParams();
  const subject = searchParams.get("subject");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const subjects = useMemo(() => {
    const set = new Set<string>();
    AP_SUBJECTS.forEach((s) => set.add(s));
    concepts.forEach((c) => set.add(c.subject));
    keyConceptGuides.forEach((g) => set.add(g.subject));
    return [...set].sort();
  }, []);

  const subjectFolders = subjects.map((s) => {
    const conceptCount = concepts.filter((c) => c.subject === s).length;
    const guideCount = keyConceptGuides.filter((g) => g.subject === s).length;
    return {
      id: s,
      title: s,
      subtitle: `${conceptCount} concepts · ${guideCount} guides`,
      count: conceptCount + guideCount,
      href: `/concepts?subject=${encodeURIComponent(s)}`,
    };
  });

  const list = useMemo(() => {
    if (!subject) return [];
    const items: Array<{
      kind: "concept" | "guide";
      id: string;
      title: string;
      summary: string;
      href: string;
    }> = [];

    if (filter === "all" || filter === "concept") {
      concepts
        .filter((c) => c.subject === subject)
        .forEach((c) =>
          items.push({
            kind: "concept",
            id: c.id,
            title: c.title,
            summary: c.summary,
            href: `/concepts/${c.id}`,
          })
        );
    }
    if (filter === "all" || filter === "guide") {
      keyConceptGuides
        .filter((g) => g.subject === subject)
        .forEach((g) =>
          items.push({
            kind: "guide",
            id: g.id,
            title: g.title,
            summary: g.introduction,
            href: `/key-concepts/${g.id}`,
          })
        );
    }
    return items;
  }, [subject, filter]);

  const filtered = list.filter((item) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.summary.toLowerCase().includes(q)
    );
  });

  if (!subject) {
    return (
      <div className="space-y-6">
        <div>
          <Link href="/ap" className="text-sm text-brand-600 hover:underline">
            ← AP Area
          </Link>
          <h1 className="mt-2 text-3xl font-bold">Concepts</h1>
          <p className="mt-2 text-slate-600">
            Open a subject folder first. Upload files on the left — they show on the right immediately after a successful save.
          </p>
        </div>
        <UploadAndShow
          alsoShow={["concept", "folder"]}
          folderArea="concepts"
          title="Uploaded files & folders"
        />
        <FolderGrid folders={subjectFolders} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/concepts" className="text-sm text-brand-600 hover:underline">
          ← All subject folders
        </Link>
        <h1 className="mt-2 text-3xl font-bold">{subject}</h1>
        <p className="mt-2 text-slate-600">
          Concepts and key guides for this subject. Click a topic card to open it.
        </p>
      </div>

      <UploadAndShow
        alsoShow={["concept", "document", "folder"]}
        defaultSubject={subject}
        folderArea="concepts"
        title="Uploaded files & folders"
      />

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "All"],
            ["concept", "Concepts"],
            ["guide", "Guides"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={filter === value ? "filter-pill-active" : "filter-pill"}
          >
            {label}
          </button>
        ))}
      </div>

      <input
        type="text"
        className="input"
        placeholder="Search topics in this subject..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {mounted && (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.length > 0 ? (
            filtered.map((item) => (
              <Link
                key={`${item.kind}-${item.id}`}
                href={item.href}
                className="card block transition hover:border-brand-300"
              >
                <span className="badge">{item.kind === "concept" ? "Concept" : "Guide"}</span>
                <h2 className="mt-3 text-lg font-semibold">{item.title}</h2>
                <p className="mt-2 line-clamp-2 text-sm text-slate-600">{item.summary}</p>
              </Link>
            ))
          ) : (
            <p className="text-sm text-slate-500">No topics in this folder yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function ConceptsPage() {
  return (
    <Suspense fallback={<div className="text-sm text-slate-500">Loading concepts...</div>}>
      <ConceptsContent />
    </Suspense>
  );
}
