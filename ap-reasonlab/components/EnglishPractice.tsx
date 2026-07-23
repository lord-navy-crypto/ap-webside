"use client";

import { useState } from "react";
import type { EnglishPracticeQuestion } from "@/data/english-content";

type Props = { questions: EnglishPracticeQuestion[] };

export default function EnglishPractice({ questions }: Props) {
  const [answers, setAnswers] = useState<Record<string, number>>({});

  return (
    <div className="space-y-4">
      {questions.map((question, questionIndex) => {
        const selected = answers[question.id];
        const answered = selected !== undefined;
        return (
          <article key={question.id} className="card space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge">Original practice {questionIndex + 1}</span>
              <span className="text-xs font-medium text-slate-500">{question.skill}</span>
            </div>
            <p className="font-medium leading-7 text-slate-900">{question.prompt}</p>
            <div className="grid gap-2">
              {question.choices.map((choice, choiceIndex) => {
                const isSelected = selected === choiceIndex;
                const isCorrect = answered && choiceIndex === question.answer;
                return (
                  <button
                    key={choice}
                    type="button"
                    onClick={() => setAnswers((current) => ({ ...current, [question.id]: choiceIndex }))}
                    className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                      isCorrect
                        ? "border-emerald-300 bg-emerald-50 text-emerald-950"
                        : isSelected
                          ? "border-brand-400 bg-brand-50 text-brand-950"
                          : "border-slate-200 bg-white hover:border-brand-300"
                    }`}
                    aria-pressed={isSelected}
                  >
                    <span className="mr-2 font-semibold">{String.fromCharCode(65 + choiceIndex)}.</span>
                    {choice}
                  </button>
                );
              })}
            </div>
            {answered && (
              <div role="status" className={`rounded-xl px-4 py-3 text-sm ${selected === question.answer ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-950"}`}>
                <strong>{selected === question.answer ? "Correct." : `Review: the best answer is ${String.fromCharCode(65 + question.answer)}.`}</strong>{" "}
                {question.explanation}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

