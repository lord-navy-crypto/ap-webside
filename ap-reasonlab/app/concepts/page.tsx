"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { concepts } from "@/data/content";
import { keyConceptGuides } from "@/data/key-concepts";

type Filter = "all" | "concept" | "ap_content" | "ai_for_ap" | "study_skill";

const categoryLabel: Record<string, string> = {
  ap_content: "AP Guide",
  ai_for_ap: "AI for AP",
  study_skill: "Study Skill",
};

export default function ConceptsPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const items = useMemo(() => {
    const list: Array<
      | { kind: "concept"; id: string; title: string; subject: string; summary: string }
      | {
          kind: "guide";
          id: string;
          title: string;
          subject: string;
          summary: string;
          category: string;
        }
    > = [];

    if (filter === "all" || filter === "concept") {
      concepts.forEach((c) =>
        list.push({
          kind: "concept",
          id: c.id,
          title: c.title,
          subject: c.subject,
          summary: c.summary,
        })
      );
    }
    if (filter === "all" || filter === "ap_content" || filter === "ai_for_ap" || filter === "study_skill") {
      keyConceptGuides
        .filter((g) => filter === "all" || g.category === filter)
        .forEach((g) =>
          list.push({
            kind: "guide",
            id: g.id,
            title: g.title,
            subject: g.subject,
            summary: g.introduction,
            category: g.category,
          })
        );
    }
    return list;
  }, [filter]);

  const filtered = items.filter((item) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.subject.toLowerCase().includes(q) ||
      item.summary.toLowerCase().includes(q)
    );
  });

  const filters: { value: Filter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "concept", label: "Concepts" },
    { value: "ap_content", label: "AP Guides" },
    { value: "ai_for_ap", label: "AI for AP" },
    { value: "study_skill", label: "Study Skills" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Concept Library</h1>
        <p className="mt-2 text-slate-600">
          Core AP concepts, key guides, AI-usage tips, and study skills — all in one place.
          Search by title, subject, or topic.
        </p>
      </div>

      <input
        type="text"
        className="input"
        placeholder="Search concepts and guides (e.g. torque, monopoly, derivatives)..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={filter === f.value ? "filter-pill-active" : "filter-pill"}
          >
            {f.label}
          </button>
        ))}
      </div>

      {mounted && (
        <div className="grid gap-4">
          {filtered.length > 0 ? (
            filtered.map((item) => (
              <Link
                key={`${item.kind}-${item.id}`}
                href={item.kind === "concept" ? `/concepts/${item.id}` : `/key-concepts/${item.id}`}
                className="card block transition hover:border-brand-300"
              >
                <div className="flex flex-wrap gap-2">
                  <span className="badge">{item.subject}</span>
                  {item.kind === "concept" ? (
                    <span className="badge">Concept</span>
                  ) : (
                    <span className="badge">{categoryLabel[(item as { category: string }).category]}</span>
                  )}
                </div>
                <h2 className="mt-3 text-xl font-semibold">{item.title}</h2>
                <p className="mt-2 line-clamp-2 text-sm text-slate-600">{item.summary}</p>
              </Link>
            ))
          ) : (
            <p className="text-sm text-slate-500">No items match your search.</p>
          )}
        </div>
      )}
    </div>
  );
}
