"use client";

import { practiceQuestions } from "@/data/content";

export default function PracticePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Half-Process Practice</h1>
        <p className="mt-2 text-slate-600">
          Questions show partial reasoning. Fill in the blank steps yourself before checking hints.
        </p>
      </div>

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
  );
}
