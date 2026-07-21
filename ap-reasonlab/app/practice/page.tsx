"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { practiceQuestions } from "@/data/content";
import {
  getSubjectsFromQuestionnaires,
  questionnaires,
} from "@/data/questionnaires";
import QuestionnaireItemCard from "@/components/QuestionnaireItemCard";

type Tab = "drills" | "sets";

export default function PracticePage() {
  const [tab, setTab] = useState<Tab>("drills");
  const [subject, setSubject] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const subjects = useMemo(() => getSubjectsFromQuestionnaires(), []);
  const filteredSets = subject
    ? questionnaires.filter((q) => q.subject === subject)
    : questionnaires;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Practice</h1>
        <p className="mt-2 text-slate-600">
          Half-process drills and AI-generated question sets — hints only, no final answer keys.
        </p>
      </div>

      <div className="card p-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setTab("drills")}
            className={tab === "drills" ? "rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow" : "rounded-xl bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"}
          >
            Half-Process Drills
          </button>
          <button
            type="button"
            onClick={() => setTab("sets")}
            className={tab === "sets" ? "rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow" : "rounded-xl bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"}
          >
            Generated Sets
          </button>
        </div>
      </div>

      {mounted && tab === "drills" && (
        <div className="space-y-6">
          {practiceQuestions.map((q) => (
            <article key={q.id} className="card space-y-4">
              <div className="flex flex-wrap gap-2">
                <span className="badge">{q.subject}</span>
                <span className="badge">{q.topic}</span>
              </div>
              <p className="font-medium text-slate-900">{q.question}</p>
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Visible steps
                </h2>
                <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-slate-700">
                  {q.visibleSteps.map((step) => (
                    <li key={step}>{step}</li>
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
                      {step}
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
                    <li key={hint}>{hint}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      )}

      {mounted && tab === "sets" && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSubject("")}
              className={!subject ? "filter-pill-active" : "filter-pill"}
            >
              All subjects
            </button>
            {subjects.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSubject(s)}
                className={subject === s ? "filter-pill-active" : "filter-pill"}
              >
                {s}
              </button>
            ))}
          </div>

          <p className="text-sm text-slate-500">{filteredSets.length} generated set(s).</p>

          <div className="grid gap-4 md:grid-cols-2">
            {filteredSets.map((q) => (
              <Link key={q.id} href={`/questionnaires/${q.id}`} className="card-hover block">
                <div className="flex flex-wrap gap-2">
                  <span className="badge">{q.subject}</span>
                  <span className="badge-generated">GENERATED</span>
                  <span className="badge">~{q.estimatedMinutes} min</span>
                </div>
                <h2 className="mt-3 text-xl font-semibold text-slate-900">{q.title}</h2>
                <p className="mt-2 text-sm text-slate-600">{q.description}</p>
                <p className="mt-3 text-xs text-slate-400">
                  {q.items.length} items · {q.generationNote}
                </p>
              </Link>
            ))}
          </div>

          {filteredSets.length === 0 && (
            <div className="card text-sm text-slate-600">
              No sets for this subject yet. See{" "}
              <Link href="/guide" className="text-brand-600 hover:underline">
                AI Guide
              </Link>
              .
            </div>
          )}
        </div>
      )}
    </div>
  );
}
