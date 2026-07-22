"use client";

import Link from "next/link";
import { QuestionnaireItem } from "@/lib/types";
import RichContent from "@/components/RichContent";

export default function QuestionnaireItemCard({
  item,
  index,
}: {
  item: QuestionnaireItem;
  index: number;
}) {
  return (
    <article className="card space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="badge">Q{index + 1}</span>
        <span className="badge">{item.format}</span>
      </div>

      {item.conceptIntro && (
        <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <strong>Key concept intro: </strong>
          <RichContent className="mt-1">{item.conceptIntro}</RichContent>
        </div>
      )}

      <RichContent className="font-medium text-slate-900">{item.prompt}</RichContent>

      {item.choices && (
        <ul className="space-y-2 text-sm text-slate-700">
          {item.choices.map((c) => (
            <li
              key={c}
              className="rounded-xl border border-slate-200 px-4 py-2"
            >
              <RichContent>{c}</RichContent>
            </li>
          ))}
        </ul>
      )}

      {item.visibleSteps && item.visibleSteps.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Visible steps
          </h3>
          <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-slate-700">
            {item.visibleSteps.map((s) => (
              <li key={s}>
                <RichContent>{s}</RichContent>
              </li>
            ))}
          </ol>
        </div>
      )}

      {item.blankSteps && item.blankSteps.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Your turn (fill in)
          </h3>
          <ul className="mt-2 space-y-2">
            {item.blankSteps.map((s) => (
              <li
                key={s}
                className="rounded-xl border border-dashed border-brand-300 bg-brand-50 px-4 py-3 text-sm"
              >
                <RichContent>{s}</RichContent>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Hints (no final answer)
        </h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
          {item.hints.map((h) => (
            <li key={h}>
              <RichContent>{h}</RichContent>
            </li>
          ))}
        </ul>
      </div>

      {item.conceptId && (
        <Link
          href={`/concepts/${item.conceptId}`}
          className="text-sm text-brand-600 hover:underline"
        >
          Open related concept →
        </Link>
      )}
    </article>
  );
}
