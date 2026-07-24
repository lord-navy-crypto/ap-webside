"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { concepts } from "@/data/content";
import { keyConceptGuides } from "@/data/key-concepts";
import { AP_SUBJECTS } from "@/data/ap-expanded";
import FolderGrid from "@/components/FolderGrid";
import UnifiedMediaFrame from "@/components/UnifiedMediaFrame";
import RichContent from "@/components/RichContent";
import {
  ROOT_SPACE,
  isFolderSpace,
  spaceFromSearchParams,
} from "@/lib/storage-space";

type Filter = "all" | "concept" | "guide";

function ConceptsContent() {
  const searchParams = useSearchParams();
  const subject = searchParams.get("subject");
  const folderParam = searchParams.get("folder");
  const spaceKey = spaceFromSearchParams({ subject, folder: folderParam });
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [mounted, setMounted] = useState(false);
  const [folderTitle, setFolderTitle] = useState<string | null>(null);
  const [managedConcepts, setManagedConcepts] = useState<
    Array<{ id: string; title: string; subject: string; summary: string }>
  >([]);
  const [managedSubjects, setManagedSubjects] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/edit", { cache: "no-store" });
        const data = await res.json();
        if (cancelled) return;
        setManagedConcepts(Array.isArray(data.concepts) ? data.concepts : []);
        setManagedSubjects(
          Array.isArray(data.subjects)
            ? data.subjects.map((s: unknown) =>
                typeof s === "string" ? s : String((s as { name?: string }).name || "")
              ).filter(Boolean)
            : []
        );
        if (folderParam) {
          const found = (data.folders || []).find(
            (f: { id: string }) => f.id === folderParam
          );
          setFolderTitle(found?.title || folderParam);
        } else {
          setFolderTitle(null);
        }
      } catch {
        if (!cancelled && folderParam) setFolderTitle(folderParam);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [folderParam, spaceKey]);

  const subjects = useMemo(() => {
    const set = new Set<string>();
    AP_SUBJECTS.forEach((s) => set.add(s));
    concepts.forEach((c) => set.add(c.subject));
    keyConceptGuides.forEach((g) => set.add(g.subject));
    managedSubjects.forEach((s) => set.add(s));
    managedConcepts.forEach((c) => set.add(c.subject));
    return [...set].sort();
  }, [managedSubjects, managedConcepts]);

  const subjectFolders = subjects.map((s) => {
    const conceptCount =
      concepts.filter((c) => c.subject === s).length +
      managedConcepts.filter((c) => c.subject === s).length;
    const guideCount = keyConceptGuides.filter((g) => g.subject === s).length;
    return {
      id: s,
      title: s,
      subtitle: `${conceptCount} topics · ${guideCount} guides · own storage`,
      count: conceptCount + guideCount,
      href: `/concepts?subject=${encodeURIComponent(s)}`,
    };
  });

  const list = useMemo(() => {
    if (!subject || isFolderSpace(spaceKey)) return [];
    const items: Array<{
      kind: "concept" | "guide";
      id: string;
      title: string;
      summary: string;
      href: string;
    }> = [];

    if (filter === "all" || filter === "concept") {
      const seen = new Set<string>();
      concepts
        .filter((c) => c.subject === subject)
        .forEach((c) => {
          seen.add(c.id);
          items.push({
            kind: "concept",
            id: c.id,
            title: c.title,
            summary: c.summary,
            href: `/concepts/${c.id}`,
          });
        });
      managedConcepts
        .filter((c) => c.subject === subject && !seen.has(c.id))
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
  }, [subject, filter, spaceKey, managedConcepts]);

  const filtered = list.filter((item) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.summary.toLowerCase().includes(q)
    );
  });

  // Custom nested folder view
  if (folderParam && isFolderSpace(spaceKey)) {
    return (
      <div className="space-y-6">
        <div>
          <Link
            href={subject ? `/concepts?subject=${encodeURIComponent(subject)}` : "/concepts"}
            className="text-sm text-brand-600 hover:underline"
          >
            ← Back
          </Link>
          <h1 className="mt-2 text-3xl font-bold">{folderTitle || "Folder"}</h1>
          <p className="mt-2 text-slate-600">
            Storage for this folder only. Use <strong>+ Add topic</strong> and paste one complete
            Markdown document with optional LaTeX math.
          </p>
        </div>
        <UnifiedMediaFrame
          alsoShow={["topic", "concept", "document", "folder"]}
          defaultSubject={subject || folderTitle || "Custom"}
          folderArea="concepts"
          spaceKey={spaceKey}
          spaceBasePath="/concepts"
          title="Folder · pictures, documents, files & topics"
          onSubjectsChange={setManagedSubjects}
        />
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="space-y-6">
        <div>
          <Link href="/ap" className="text-sm text-brand-600 hover:underline">
            ← AP Area
          </Link>
          <h1 className="mt-2 text-3xl font-bold">Concepts</h1>
          <p className="mt-2 text-slate-600">
            Open a subject folder to add topics. Or use <strong>+ Add subject folder</strong> below
            to create a new subject that appears in this grid.
          </p>
        </div>
        <UnifiedMediaFrame
          alsoShow={["subject", "folder", "document"]}
          folderArea="concepts"
          spaceKey={ROOT_SPACE}
          spaceBasePath="/concepts"
          title="Concepts hub · pictures, documents, files & subject folders"
          onSubjectsChange={setManagedSubjects}
          collapsedByDefault
        />
        <FolderGrid folders={subjectFolders} emptyText="No subject folders yet. Add a subject above." />
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
          Use <strong>+ Add topic</strong> to add a topic to this subject. Add a title, then paste the
          complete Markdown document into one large content box.
          {subject === "AP Statistics" && (
            <>
              {" "}
              The regenerated <strong>FRQ Practice Pack</strong> is in Documents below (PDF download
              included).
            </>
          )}
        </p>
      </div>

      <UnifiedMediaFrame
        alsoShow={["topic", "concept", "document", "folder"]}
        defaultSubject={subject}
        folderArea="concepts"
        spaceKey={spaceKey}
        spaceBasePath="/concepts"
        title={`${subject} · pictures, documents, files & topics`}
        onSubjectsChange={setManagedSubjects}
      />

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "All"],
            ["concept", "Topics"],
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
                <span className="badge">{item.kind === "concept" ? "Topic" : "Guide"}</span>
                <h2 className="mt-3 text-lg font-semibold">{item.title}</h2>
                <RichContent clampLines={2} className="mt-2 text-sm text-slate-600">{item.summary}</RichContent>
              </Link>
            ))
          ) : (
            <p className="text-sm text-slate-500">
              No topics in this folder yet. Use + Add topic above.
            </p>
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
