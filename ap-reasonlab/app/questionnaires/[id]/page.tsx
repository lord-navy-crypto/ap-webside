"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import EthicsBanner from "@/components/EthicsBanner";
import QuestionnaireItemCard from "@/components/QuestionnaireItemCard";
import ChangePanel from "@/components/ChangePanel";
import { getQuestionnaireById } from "@/data/questionnaires";
import type { Questionnaire } from "@/lib/types";

/**
 * Loads built-in sets first; falls back to managed sets from /api/edit
 * so UI-added questionnaires open without a redeploy.
 */
export default function QuestionnaireDetailPage() {
  const params = useParams();
  const id = String(params?.id || "");
  const builtIn = getQuestionnaireById(id);
  const [quiz, setQuiz] = useState<Questionnaire | null>(builtIn || null);
  const [loading, setLoading] = useState(!builtIn);
  const [error, setError] = useState("");
  const [changeCode, setChangeCode] = useState("");
  const [itemPrompt, setItemPrompt] = useState("");
  const [itemHint, setItemHint] = useState("");
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (builtIn) {
      setQuiz(builtIn);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/edit", { cache: "no-store" });
        const data = await res.json();
        if (cancelled) return;
        const found = (data.questionnaires || []).find(
          (q: Questionnaire) => q.id === id
        );
        if (!found) {
          setError("Set not found.");
          setQuiz(null);
        } else {
          setQuiz(found);
        }
      } catch {
        if (!cancelled) setError("Failed to load set.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [builtIn, id]);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!quiz || !itemPrompt.trim() || !changeCode.trim()) return;
    setSaving(true);
    setError("");
    setNote("");
    try {
      const res = await fetch("/api/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_questionnaire_item",
          setId: quiz.id,
          changeCode: changeCode.trim(),
          item: {
            prompt: itemPrompt.trim(),
            hint: itemHint.trim() || "Try yourself first.",
            format: "concept_check",
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      const updated = (data.content?.questionnaires || []).find(
        (q: Questionnaire) => q.id === quiz.id
      );
      if (updated) setQuiz(updated);
      setItemPrompt("");
      setItemHint("");
      setNote("Item added.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="text-sm text-slate-500">Loading set…</div>;
  }

  if (!quiz) {
    return (
      <div className="space-y-4">
        <Link href="/practice" className="text-sm font-medium text-brand-600 hover:underline">
          ← Practice
        </Link>
        <p className="text-sm text-red-600">{error || "Set not found."}</p>
      </div>
    );
  }

  const isManaged = quiz.id.startsWith("m-quiz");

  return (
    <div className="space-y-6">
      <Link
        href={`/practice?subject=${encodeURIComponent(quiz.subject)}`}
        className="text-sm font-medium text-brand-600 hover:underline"
      >
        ← {quiz.subject} practice
      </Link>

      <section className="card space-y-3 border-violet-100 bg-gradient-to-br from-white to-violet-50/30">
        <div className="flex flex-wrap gap-2">
          <span className="badge">{quiz.subject}</span>
          <span className="badge-generated">AI GENERATED</span>
          <span className="badge">~{quiz.estimatedMinutes} min</span>
          {isManaged && <span className="badge">UI-added</span>}
        </div>
        <h1 className="text-3xl font-bold">{quiz.title}</h1>
        <p className="text-slate-600">{quiz.description}</p>
        <p className="rounded-xl bg-slate-50 px-4 py-2 text-sm text-slate-500">
          {quiz.generationNote}
        </p>
      </section>

      <EthicsBanner />

      {(quiz.items || []).map((item, index) => (
        <QuestionnaireItemCard key={item.id} item={item} index={index} />
      ))}

      {isManaged && (
        <section className="card space-y-3 border-brand-200">
          <h2 className="font-semibold text-slate-900">+ Add item to this set</h2>
          <p className="text-sm text-slate-600">
            Paste an original FRQ prompt (no College Board text). Hints only — no answer key.
          </p>
          <form onSubmit={addItem} className="space-y-3">
            <textarea
              className="textarea min-h-[100px]"
              placeholder="Question prompt..."
              value={itemPrompt}
              onChange={(e) => setItemPrompt(e.target.value)}
              required
            />
            <input
              className="input"
              placeholder="Hint (optional)"
              value={itemHint}
              onChange={(e) => setItemHint(e.target.value)}
            />
            <input
              type="password"
              className="input"
              placeholder="Change code (required)"
              value={changeCode}
              onChange={(e) => setChangeCode(e.target.value)}
              required
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            {note && <p className="text-sm text-emerald-700">{note}</p>}
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save item"}
            </button>
          </form>
        </section>
      )}

      {!isManaged && (
        <section className="card space-y-3">
          <h2 className="font-semibold">Want another set like this?</h2>
          <p className="text-sm text-slate-600">
            Go back to Practice → this subject → use{" "}
            <strong>+ Add generated practice set</strong>, or create one from the AP hub.
          </p>
          <ChangePanel
            mode="questionnaire"
            label="+ Add generated practice set"
            defaultSubject={quiz.subject}
            folderArea="practice"
            spaceKey={quiz.subject}
          />
        </section>
      )}
    </div>
  );
}
