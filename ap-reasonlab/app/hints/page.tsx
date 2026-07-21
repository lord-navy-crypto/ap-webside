"use client";

import { useState } from "react";
import EthicsBanner from "@/components/EthicsBanner";

type HintResponse = {
  hints: string[];
  aiMayBeWrong: string;
  note: string;
};

export default function HintsPage() {
  const [question, setQuestion] = useState("");
  const [subject, setSubject] = useState("AP Physics 1");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HintResponse | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/hints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, subject }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to get hints");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Hint Coach</h1>
        <p className="mt-2 text-slate-600">
          Paste an AP-style question. You will receive strategy hints only — not the final answer.
        </p>
      </div>

      <EthicsBanner />

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium">Subject</label>
          <select
            className="input"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          >
            <option>AP Physics 1</option>
            <option>AP Calculus AB</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Your question</label>
          <textarea
            className="textarea"
            placeholder="Paste an AP problem here..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn-primary" disabled={loading || !question.trim()}>
          {loading ? "Generating hints..." : "Get hints (no final answer)"}
        </button>
      </form>

      {error && (
        <div className="card border-red-200 bg-red-50 text-sm text-red-700">{error}</div>
      )}

      {result && (
        <section className="card space-y-4">
          <h2 className="text-lg font-semibold">Hints</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
            {result.hints.map((hint) => (
              <li key={hint}>{hint}</li>
            ))}
          </ul>
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {result.aiMayBeWrong}
          </p>
          <p className="text-sm text-slate-500">{result.note}</p>
        </section>
      )}
    </div>
  );
}
