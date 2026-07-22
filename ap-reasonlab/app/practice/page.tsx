"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { practiceQuestions } from "@/data/content";
import {
  getSubjectsFromQuestionnaires,
  questionnaires,
} from "@/data/questionnaires";
import FolderGrid from "@/components/FolderGrid";
import UploadAndShow from "@/components/UploadAndShow";
import RichContent from "@/components/RichContent";

type Tab = "drills" | "sets";

function PracticeContent() {
  const searchParams = useSearchParams();
  const subject = searchParams.get("subject");
  const [tab, setTab] = useState<Tab>("drills");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const subjects = useMemo(() => {
    const set = new Set<string>();
    practiceQuestions.forEach((q) => set.add(q.subject));
    getSubjectsFromQuestionnaires().forEach((s) => set.add(s));
    return [...set].sort();
  }, []);

  const subjectFolders = subjects.map((s) => {
    const drillCount = practiceQuestions.filter((q) => q.subject === s).length;
    const setCount = questionnaires.filter((q) => q.subject === s).length;
    return {
      id: s,
      title: s,
      subtitle: `${drillCount} drills · ${setCount} generated sets`,
      count: drillCount + setCount,
      href: `/practice?subject=${encodeURIComponent(s)}`,
    };
  });

  if (!subject) {
    return (
      <div className="space-y-6">
        <div>
          <Link href="/ap" className="text-sm text-brand-600 hover:underline">
            ← AP Area
          </Link>
          <h1 className="mt-2 text-3xl font-bold">Practice</h1>
          <p className="mt-2 text-slate-600">
            Open a subject folder first. Use + to add a document or upload a practice file (change code required).
          </p>
        </div>
        <UploadAndShow alsoShow={["document", "folder"]} folderArea="practice" title="Uploaded files & notes" />
        <FolderGrid folders={subjectFolders} />
      </div>
    );
  }

  const drills = practiceQuestions.filter((q) => q.subject === subject);
  const sets = questionnaires.filter((q) => q.subject === subject);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/practice" className="text-sm text-brand-600 hover:underline">
          ← All subject folders
        </Link>
        <h1 className="mt-2 text-3xl font-bold">{subject}</h1>
        <p className="mt-2 text-slate-600">
          Practice for this subject — hints only, no final answer keys.
        </p>
      </div>

      <UploadAndShow alsoShow={["document", "folder"]} folderArea="practice" title="Uploaded files & notes" />

      <div className="card p-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setTab("drills")}
            className={
              tab === "drills"
                ? "rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow"
                : "rounded-xl bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            }
          >
            Half-Process Drills ({drills.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("sets")}
            className={
              tab === "sets"
                ? "rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow"
                : "rounded-xl bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            }
          >
            Generated Sets ({sets.length})
          </button>
        </div>
      </div>

      {mounted && tab === "drills" && (
        <div className="space-y-6">
          {drills.length === 0 ? (
            <div className="card text-sm text-slate-500">No drills in this folder yet.</div>
          ) : (
            drills.map((q) => (
              <article key={q.id} className="card space-y-4">
                <div className="flex flex-wrap gap-2">
                  <span className="badge">{q.topic}</span>
                </div>
                <RichContent className="font-medium text-slate-900">{q.question}</RichContent>
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Visible steps
                  </h2>
                  <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-slate-700">
                    {q.visibleSteps.map((step) => (
                      <li key={step}>
                        <RichContent>{step}</RichContent>
                      </li>
                    ))}
                  </ol>
                </div>
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Your turn (fill in)
                  </h2>
                  <ul className="mt-2 space-y-2">
                    {q.blankSteps.map((step) => (
                      <li
                        key={step}
                        className="rounded-xl border border-dashed border-brand-300 bg-brand-50 px-4 py-3 text-sm text-slate-700"
                      >
                        <RichContent>{step}</RichContent>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Hints (no final answer)
                  </h2>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                    {q.hints.map((hint) => (
                      <li key={hint}>
                        <RichContent>{hint}</RichContent>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))
          )}
        </div>
      )}

      {mounted && tab === "sets" && (
        <div className="grid gap-4 md:grid-cols-2">
          {sets.length === 0 ? (
            <div className="card text-sm text-slate-500">No generated sets in this folder yet.</div>
          ) : (
            sets.map((q) => (
              <Link key={q.id} href={`/questionnaires/${q.id}`} className="card-hover block">
                <div className="flex flex-wrap gap-2">
                  <span className="badge-generated">GENERATED</span>
                  <span className="badge">~{q.estimatedMinutes} min</span>
                </div>
                <h2 className="mt-3 text-xl font-semibold text-slate-900">{q.title}</h2>
                <p className="mt-2 text-sm text-slate-600">{q.description}</p>
                <p className="mt-3 text-xs text-slate-400">
                  {q.items.length} items · {q.generationNote}
                </p>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={<div className="text-sm text-slate-500">Loading practice...</div>}>
      <PracticeContent />
    </Suspense>
  );
}
