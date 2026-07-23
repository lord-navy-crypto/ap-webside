"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import UploadAndShow from "@/components/UploadAndShow";
import type { SubjectDefinition } from "@/data/ap-catalog";
import type { ManagedContent } from "@/lib/managed-types";
import { ROOT_SPACE, normalizeSpace, spaceLabel } from "@/lib/storage-space";

const OBSERVER_AREAS = [
  { id: "ap-subject", label: "AP subject storage", hint: "Files/folders from Add Content" },
  { id: "concepts", label: "Concepts", hint: "Concept page uploads" },
  { id: "formulas", label: "Formulas", hint: "Formula page uploads" },
  { id: "practice", label: "Practice", hint: "Practice & questionnaires" },
  { id: "past-papers", label: "Past papers", hint: "Subject past-paper panels" },
  { id: "academic", label: "Academic", hint: "Academic workspace" },
  { id: "materials", label: "Materials", hint: "Sharing materials" },
  { id: "code", label: "Code", hint: "Code lab root" },
] as const;

type Props = {
  data: Partial<ManagedContent>;
  subjects: SubjectDefinition[];
  subjectId: string;
  subjectName: string;
  onSubjectChange: (id: string) => void;
  onRefresh: () => void;
};

function countInAreaSpace(
  items: Array<{ area?: string; space?: string }> | undefined,
  area: string,
  space: string
) {
  return (items || []).filter(
    (item) => (item.area || "") === area && normalizeSpace(item.space) === space
  ).length;
}

export default function ManageStructureObserver({
  data,
  subjects,
  subjectId,
  subjectName,
  onSubjectChange,
  onRefresh,
}: Props) {
  const [area, setArea] = useState<(typeof OBSERVER_AREAS)[number]["id"]>("ap-subject");
  const [selectedSpace, setSelectedSpace] = useState<string>(subjectName || ROOT_SPACE);

  const spaceOptions = useMemo(() => {
    const spaces = new Set<string>([ROOT_SPACE, subjectName]);
    for (const file of data.files || []) {
      if ((file.area || "") === area) spaces.add(normalizeSpace(file.space));
    }
    for (const doc of data.documents || []) {
      if ((doc.area || "") === area) spaces.add(normalizeSpace(doc.space));
    }
    for (const folder of data.folders || []) {
      if ((folder.area || "") === area) spaces.add(normalizeSpace(folder.space));
      if ((folder.area || "") === area) spaces.add(`folder:${folder.id}`);
    }
    for (const subject of subjects) {
      spaces.add(subject.name);
    }
    return Array.from(spaces);
  }, [area, data.documents, data.files, data.folders, subjectName, subjects]);

  const tree = useMemo(
    () =>
      OBSERVER_AREAS.map((entry) => {
        const space = entry.id === "ap-subject" || entry.id === "past-papers" || entry.id === "concepts" || entry.id === "formulas" || entry.id === "practice"
          ? subjectName
          : ROOT_SPACE;
        const files = countInAreaSpace(data.files, entry.id, space);
        const docs = countInAreaSpace(data.documents, entry.id, space);
        const folders = countInAreaSpace(data.folders, entry.id, space);
        return { ...entry, files, docs, folders, total: files + docs + folders, space };
      }),
    [data.documents, data.files, data.folders, subjectName]
  );

  const activeSpace =
    selectedSpace && spaceOptions.includes(selectedSpace) ? selectedSpace : subjectName || ROOT_SPACE;

  return (
    <section className="space-y-4">
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-sky-50 p-5 md:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">
              File & structure observer
            </p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">Background files by subject</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Switch AP subjects, inspect area buckets, and browse uploads like a desktop explorer
              (folders, files, revisions via History). Windows/Mac-style path: area → space → items.
            </p>
          </div>
          <label className="min-w-[14rem] text-sm font-medium text-slate-700">
            Active subject
            <select
              className="input mt-1"
              value={subjectId}
              onChange={(event) => {
                const next = subjects.find((subject) => subject.id === event.target.value);
                onSubjectChange(event.target.value);
                if (next) setSelectedSpace(next.name);
              }}
            >
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.icon} {subject.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryChip label="Files (site)" value={(data.files || []).length} />
          <SummaryChip label="Folders" value={(data.folders || []).length} />
          <SummaryChip label="Documents" value={(data.documents || []).length} />
          <SummaryChip label="Content items" value={(data.contentItems || []).filter((item) => !item.deletedAt).length} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,16rem)_1fr]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-3">
          <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Structure tree
          </p>
          <ul className="space-y-1">
            {tree.map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => {
                    setArea(entry.id);
                    setSelectedSpace(entry.space);
                  }}
                  className={`flex w-full items-start gap-2 rounded-xl px-3 py-2 text-left text-sm transition ${
                    area === entry.id
                      ? "bg-slate-900 text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span className="mt-0.5 shrink-0 font-mono text-xs opacity-70">
                    {area === entry.id ? "▾" : "▸"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{entry.label}</span>
                    <span className={`block text-xs ${area === entry.id ? "text-slate-300" : "text-slate-500"}`}>
                      {entry.total} items · {entry.hint}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-4 border-t border-slate-100 px-2 pt-3 text-xs text-slate-500">
            Path:{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-700">
              {area}/{spaceLabel(activeSpace)}
            </code>
          </div>
          <Link
            href={`/ap/${subjects.find((subject) => subject.id === subjectId)?.slug || subjects[0]?.slug || ""}`}
            className="mt-3 block px-2 text-xs font-medium text-brand-700 hover:underline"
          >
            Open subject page →
          </Link>
        </aside>

        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4">
            <label className="min-w-[12rem] flex-1 text-sm font-medium">
              Space (folder / subject bucket)
              <select
                className="input mt-1"
                value={activeSpace}
                onChange={(event) => setSelectedSpace(event.target.value)}
              >
                {spaceOptions.map((space) => (
                  <option key={space} value={space}>
                    {spaceLabel(space)}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className="btn-secondary" onClick={onRefresh}>
              Refresh structure
            </button>
          </div>

          <UploadAndShow
            key={`${area}:${activeSpace}`}
            title={`${OBSERVER_AREAS.find((entry) => entry.id === area)?.label || area} observer`}
            folderArea={area}
            spaceKey={activeSpace}
            defaultSubject={subjectName}
            alsoShow={["document", "folder"]}
            collapsedByDefault={false}
          />
        </div>
      </div>
    </section>
  );
}

function SummaryChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{value}</p>
    </div>
  );
}
