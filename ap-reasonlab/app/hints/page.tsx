"use client";

import { useEffect, useState } from "react";
import EthicsBanner from "@/components/EthicsBanner";

type Provider = "groq" | "gemini";
type Mode = "default" | "bring-your-own";

type HintResponse = {
  hints: string[];
  aiMayBeWrong: string;
  note: string;
};

export default function HintsPage() {
  // Initialize from hash to avoid SSR/client mismatch and keep mode shareable.
  const [mode, setMode] = useState<Mode>("default");
  const [question, setQuestion] = useState("");
  const [subject, setSubject] = useState("AP Physics 1");
  const [provider, setProvider] = useState<Provider>("groq");
  const [userKey, setUserKey] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HintResponse | null>(null);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined" && window.location.hash === "#byok") {
      setMode("bring-your-own");
    }
  }, []);

  const promptWithNotes = () => {
    let full = question;
    if (notes.trim()) {
      full += "\n\n[Student notes / context]\n" + notes.trim();
    }
    return full;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const payload: Record<string, string> = {
        question: promptWithNotes(),
        subject,
      };
      if (mode === "bring-your-own") {
        payload.provider = provider;
        payload.userApiKey = userKey.trim();
      }

      const res = await fetch("/api/hints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

      <div className="card p-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMode("default")}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              mode === "default"
                ? "bg-brand-600 text-white shadow"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            Default AI (free)
          </button>
          <button
            type="button"
            onClick={() => setMode("bring-your-own")}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              mode === "bring-your-own"
                ? "bg-brand-600 text-white shadow"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            Bring your own key
          </button>
        </div>
      </div>

      {mode === "default" && (
        <div className="rounded-2xl border border-brand-100 bg-brand-50/50 px-5 py-4 text-sm text-brand-900">
          <strong>Default AI:</strong> uses the site&apos;s free Groq API key. No setup needed.
          Subject to daily rate limits. If it shows mock hints, the site key is not configured yet.
        </div>
      )}

      {mode === "bring-your-own" && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          <strong>Bring your own key:</strong> your API key is only used for this request and is
          not stored. Get a free key from{" "}
          <a
            href="https://console.groq.com/keys"
            className="font-medium underline"
            target="_blank"
            rel="noreferrer"
          >
            Groq
          </a>{" "}
          or{" "}
          <a
            href="https://aistudio.google.com/apikey"
            className="font-medium underline"
            target="_blank"
            rel="noreferrer"
          >
            Google AI Studio
          </a>
          .
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium">Subject</label>
          <select className="input" value={subject} onChange={(e) => setSubject(e.target.value)}>
            <option>AP Physics 1</option>
            <option>AP Physics 2</option>
            <option>AP Calculus AB</option>
            <option>AP Microeconomics</option>
            <option>AP Macroeconomics</option>
          </select>
        </div>

        {mounted && mode === "bring-your-own" && (
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Provider</label>
              <select
                className="input"
                value={provider}
                onChange={(e) => setProvider(e.target.value as Provider)}
              >
                <option value="groq">Groq (llama-3.3-70b-versatile)</option>
                <option value="gemini">Gemini (gemini-2.0-flash)</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Your API key</label>
              <input
                type="password"
                className="input"
                placeholder="Paste your key here (e.g., gsk_... or AIza...)"
                value={userKey}
                onChange={(e) => setUserKey(e.target.value)}
                required={mode === "bring-your-own"}
              />
              <p className="mt-1 text-xs text-slate-500">
                Key is sent only for this request and is not logged or stored.
              </p>
            </div>
          </div>
        )}

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

        <div>
          <label className="mb-2 block text-sm font-medium">
            Your notes / context (optional)
          </label>
          <textarea
            className="textarea min-h-[100px]"
            placeholder="Paste your own notes, formulas, or what you have tried so the AI can give better hints. Not saved or uploaded to the server."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <p className="mt-1 text-xs text-slate-500">
            This text is only included in the current AI prompt and is not stored.
          </p>
        </div>

        <button type="submit" className="btn-primary" disabled={loading || !question.trim()}>
          {loading ? "Generating hints..." : "Get hints (no final answer)"}
        </button>
      </form>

      {error && <div className="card border-red-200 bg-red-50 text-sm text-red-700">{error}</div>}

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
