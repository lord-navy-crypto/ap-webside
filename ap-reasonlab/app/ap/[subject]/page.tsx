"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import RichContent from "@/components/RichContent";
import UnifiedAddContent from "@/components/UnifiedAddContent";
import UploadAndShow from "@/components/UploadAndShow";
import ResourceEditor from "@/components/ResourceEditor";
import { useEditorMode } from "@/components/EditorModeProvider";
import { concepts } from "@/data/content";
import { formulas } from "@/data/formulas";
import { questionnaires } from "@/data/questionnaires";
import { getSubjectBySlug } from "@/data/ap-catalog";
import type { ManagedContent, ManagedContentItem, ManagedUnit } from "@/lib/managed-types";

const sectionConfig = [
  { key: "units", label: "Units", icon: "▦" },
  { key: "concept", label: "Concepts", icon: "◇" },
  { key: "formula", label: "Formulas", icon: "∑" },
  { key: "practice", label: "Practice", icon: "✓" },
  { key: "document", label: "Documents", icon: "▤" },
  { key: "past-papers", label: "Released Exams", icon: "▧" },
  { key: "hints", label: "AI Toolbox", icon: "✦" },
] as const;

function SubjectWorkspaceContent() {
  const { active: editMode } = useEditorMode();
  const params = useParams<{ subject: string }>();
  const searchParams = useSearchParams();
  const builtIn = getSubjectBySlug(params.subject);
  const [managed, setManaged] = useState<Partial<ManagedContent>>({});
  const [query, setQuery] = useState("");
  const [type, setType] = useState(() => {
    const fromQuery = searchParams.get("type");
    return fromQuery === "concept" ||
      fromQuery === "formula" ||
      fromQuery === "practice" ||
      fromQuery === "document"
      ? fromQuery
      : "all";
  });
  const [unitId, setUnitId] = useState("all");
  const [actionError, setActionError] = useState("");

  const refresh = useCallback(() => {
    fetch("/api/edit", { cache: "no-store" })
      .then((response) => response.json())
      .then(setManaged)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const fromQuery = searchParams.get("type");
    if (
      fromQuery === "concept" ||
      fromQuery === "formula" ||
      fromQuery === "practice" ||
      fromQuery === "document"
    ) {
      setType(fromQuery);
    }
  }, [searchParams]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash === "#document" || window.location.hash === "#subject-content") {
      if (window.location.hash === "#document") setType("document");
      requestAnimationFrame(() => {
        document.getElementById("subject-content")?.scrollIntoView({ behavior: "smooth" });
      });
    }
  }, []);

  const managedSubject = managed.subjects?.find((subject) => subject.slug === params.subject);
  const subject = builtIn
    ? builtIn
    : managedSubject
      ? {
          ...managedSubject,
          shortName: managedSubject.shortName || managedSubject.name,
          description: managedSubject.description || "Managed AP subject workspace.",
          icon: managedSubject.icon || "◇",
        }
      : undefined;

  useEffect(() => {
    if (!subject) return;
    const current = JSON.parse(localStorage.getItem("results-recent-subjects") || "[]") as string[];
    localStorage.setItem(
      "results-recent-subjects",
      JSON.stringify(
        [params.subject, ...current.filter((slug) => slug !== params.subject)].slice(0, 6)
      )
    );
  }, [params.subject, subject]);

  const subjectName = subject?.name || "";
  const managedSubjectId = managedSubject?.id || params.subject;
  const units = useMemo<ManagedUnit[]>(() => {
    const configured = (managed.units || []).filter(
      (unit) => unit.subjectId === managedSubjectId && unit.enabled
    );
    const names = new Set(
      formulas.filter((formula) => formula.subject === subjectName).map((formula) => formula.unit)
    );
    const derived = [...names].map((title, index) => ({
      id: `derived-${index}`,
      subjectId: managedSubjectId,
      title,
      order: index,
      enabled: true,
      createdAt: 0,
    }));
    return [
      ...configured,
      ...derived.filter((unit) => !configured.some((existing) => existing.title === unit.title)),
    ].sort((a, b) => a.order - b.order);
  }, [managed.units, managedSubjectId, subjectName]);

  const items = useMemo(
    () =>
      (managed.contentItems || []).filter(
        (item) => item.subjectId === managedSubjectId && !item.deletedAt && item.status === "published"
      ),
    [managed.contentItems, managedSubjectId]
  );
  const filteredItems = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items
      .filter(
        (item) =>
          (type === "all" || item.type === type) &&
          (unitId === "all" || item.unitId === unitId) &&
          (!needle ||
            `${item.title} ${item.content} ${item.tags.join(" ")}`.toLowerCase().includes(needle))
      )
      .sort((a, b) => a.order - b.order || b.updatedAt - a.updatedAt);
  }, [items, query, type, unitId]);

  async function deleteContentItem(item: ManagedContentItem) {
    if (!window.confirm(`Delete “${item.title}”? It can be restored from Manage → Recycle Bin.`)) return;
    setActionError("");
    try {
      const response = await fetch("/api/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", target: "content_item", id: item.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Delete failed");
      setManaged(data.content || {});
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Delete failed");
    }
  }

  if (!subject) {
    return (
      <div className="card">
        <h1 className="text-xl font-bold">Subject not found</h1>
        <Link href="/ap" className="mt-3 inline-block text-brand-600">
          Return to AP subjects
        </Link>
      </div>
    );
  }

  const counts: Record<string, number> = {
    units: units.length,
    concept:
      concepts.filter((item) => item.subject === subjectName).length +
      items.filter((item) => item.type === "concept").length,
    formula:
      formulas.filter((item) => item.subject === subjectName).length +
      items.filter((item) => item.type === "formula").length,
    practice:
      questionnaires.filter((item) => item.subject === subjectName).length +
      items.filter((item) => item.type === "practice").length,
    document: items.filter((item) => item.type === "document").length,
    hints: 1,
    "past-papers": 0,
  };

  const hrefFor = (key: string) => {
    if (key === "concept") return `/concepts?subject=${encodeURIComponent(subjectName)}`;
    if (key === "formula") return `/formulas?subject=${encodeURIComponent(subjectName)}`;
    if (key === "practice") return `/practice?subject=${encodeURIComponent(subjectName)}`;
    if (key === "hints") return `/hints?subject=${encodeURIComponent(subjectName)}`;
    if (key === "document") return `?type=document#subject-content`;
    if (key === "past-papers") return "#past-papers";
    return `#${key}`;
  };

  return (
    <div className="space-y-7">
      <Breadcrumbs items={[{ label: "AP", href: "/ap" }, { label: subject.shortName }]} />
      <section className="rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-indigo-50 p-6 md:p-8">
        <div className="max-w-3xl">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-2xl font-bold text-white">
            {subject.icon}
          </span>
          <h1 className="mt-4 text-3xl font-bold md:text-4xl">{subject.name}</h1>
          <p className="mt-2 text-slate-600">{subject.description}</p>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sectionConfig.map((section) => (
          <Link
            key={section.key}
            href={hrefFor(section.key)}
            className="card-hover flex items-center gap-4"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-xl font-bold text-brand-700">
              {section.icon}
            </span>
            <div>
              <h2 className="font-semibold">{section.label}</h2>
              <p className="text-sm text-slate-500">
                {section.key === "past-papers" ? "Upload area" : `${counts[section.key]} available`}
              </p>
            </div>
          </Link>
        ))}
      </section>

      <section id="media-frame" className="scroll-mt-24 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        Files, pictures, and documents for this subject are in the <strong>top-right Media window</strong>
        (scroll &amp; view). Open <Link href="/manage?tab=files" className="font-medium text-brand-700 underline">Manage → Files</Link> for the full Mac Finder backend.
      </section>

      <section id="units" className="space-y-3">
        <h2 className="section-title">Units</h2>
        {units.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {units.map((unit) => (
              <button
                key={unit.id}
                type="button"
                onClick={() => {
                  setUnitId(unit.id);
                  document.getElementById("subject-content")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="card-hover text-left"
              >
                <span className="badge">Unit {unit.order + 1}</span>
                <h3 className="mt-3 font-semibold">{unit.title}</h3>
                {unit.description && (
                  <p className="mt-1 text-sm text-slate-600">{unit.description}</p>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="card text-sm text-slate-500">
            No units configured yet. Add them from Manage.
          </div>
        )}
      </section>

      <section id="subject-content" className="space-y-4">
        <div id="document">
          <h2 className="section-title">Subject content</h2>
          <p className="mt-1 text-sm text-slate-500">
            Search and filter content published through the new manager.
          </p>
        </div>
        <div className="card grid gap-3 md:grid-cols-3">
          <input
            type="search"
            className="input md:col-span-3"
            placeholder="Search title, content, or tags…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select
            className="input"
            value={type}
            onChange={(event) => setType(event.target.value)}
          >
            <option value="all">All types</option>
            {["concept", "formula", "practice", "document"].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <select
            className="input md:col-span-2"
            value={unitId}
            onChange={(event) => setUnitId(event.target.value)}
          >
            <option value="all">All units</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.title}
              </option>
            ))}
          </select>
        </div>
        {actionError && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{actionError}</p>}
        <div className="grid gap-4 md:grid-cols-2">
          {filteredItems.map((item: ManagedContentItem) => (
            <article key={item.id} className="card min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex flex-wrap gap-2">
                  <span className="badge">{item.type}</span>
                  <span className="badge">{item.difficulty}</span>
                </div>
                {editMode && <div className="flex items-center gap-1">
                  <ResourceEditor target="content_item" item={item} onSaved={(content) => setManaged(content as ManagedContent)} />
                  <button type="button" className="btn-ghost px-2 py-1 text-xs text-red-600" onClick={() => void deleteContentItem(item)}>− Delete</button>
                </div>}
              </div>
              <h3 className="mt-3 text-lg font-semibold">{item.title}</h3>
              <div className="mt-2 max-h-[65vh] overflow-auto overscroll-contain">
                <RichContent className="text-sm">{item.content}</RichContent>
              </div>
              {item.tags.length > 0 && (
                <p className="mt-3 text-xs text-slate-500">{item.tags.join(" · ")}</p>
              )}
            </article>
          ))}
        </div>
        {filteredItems.length === 0 && (
          <div className="card text-sm text-slate-500">
            No managed content matches these filters yet. Built-in materials remain available
            through the section cards above.
          </div>
        )}
      </section>

      <section id="past-papers" className="space-y-3 scroll-mt-24">
        <div>
          <h2 className="section-title">Released exams & past papers</h2>
          <p className="mt-1 text-sm text-slate-600">
            Upload downloadable exam files or add a text document for {subject.name}. A change code is required.
          </p>
          <p className="mt-1 text-xs text-amber-800">
            Upload only officially released, public-domain, original, or authorized material. Link to restricted exams instead of redistributing them.
          </p>
        </div>
        <UploadAndShow
          title={`${subject.shortName} · Exam archive`}
          folderArea="past-papers"
          spaceKey={params.subject}
          defaultSubject={subjectName}
          collapsedByDefault
          alsoShow={["document", "folder"]}
        />
      </section>

      <section className="card flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-900">Add content for this subject</h2>
          <p className="mt-1 text-sm text-slate-500">
            Editors can publish concepts, formulas, practice, and documents here.
          </p>
        </div>
        <UnifiedAddContent
          subjectId={managedSubjectId}
          subjectName={subjectName}
          units={units}
          onSaved={refresh}
        />
      </section>
    </div>
  );
}

export default function SubjectWorkspacePage() {
  return (
    <Suspense fallback={<div className="text-sm text-slate-500">Loading subject workspace...</div>}>
      <SubjectWorkspaceContent />
    </Suspense>
  );
}
