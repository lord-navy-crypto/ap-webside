"use client";

import { useState } from "react";
import LocalAIControls from "@/components/LocalAIControls";
import MarkdownLatexField from "@/components/MarkdownLatexField";
import RichContent from "@/components/RichContent";
import { useLocalAI } from "@/components/LocalAIProvider";

type Result = {
  refused: boolean;
  reply: string;
  steps: string[];
  snippet: string;
  aiMayBeWrong: string;
  note: string;
};

const LANGUAGES = ["Python", "Java", "HTML / CSS / JS", "General algorithms", "Other"] as const;

type Props = {
  embedded?: boolean;
  /** When true, parent already shows LocalAIControls */
  hideChannelUi?: boolean;
};

export default function CodingAiPanel({ embedded = false, hideChannelUi = false }: Props) {
  const localAI = useLocalAI();
  const [language, setLanguage] = useState<(typeof LANGUAGES)[number]>("Python");
  const [task, setTask] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      if (localAI.usesLocal) {
        if (!localAI.ready) {
          throw new Error(
            "Local is selected, but no model is enabled. Enable Local above, or switch to Website API / Your own API."
          );
        }
        const text = await localAI.complete([
          {
            role: "system",
            content:
              "You are Coding AI. Teach programming with hints and short examples. Never finish a full graded homework dump. Reply in plain markdown with sections: Reply, Steps (bullets), optional Snippet.",
          },
          {
            role: "user",
            content: `Language: ${language}\nTask: ${task}\nCode:\n${code || "(none)"}`,
          },
        ]);
        setResult({
          refused: false,
          reply: text,
          steps: [],
          snippet: "",
          aiMayBeWrong: "Local AI may be wrong — test every suggestion.",
          note: "Local AI · processed in this browser",
        });
        return;
      }

      if (localAI.mode === "byok" && !localAI.userKey.trim()) {
        throw new Error("Paste your own API key, or choose Website API / Local.");
      }
      const response = await fetch("/api/ai/coding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          task,
          code,
          ...localAI.cloudRequestFields,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Coding AI failed");
      setResult(data as Result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Coding AI failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {!embedded && (
        <div>
          <h2 className="text-xl font-semibold">Coding AI</h2>
          <p className="mt-1 text-sm text-slate-600">
            Programming coach for Python, Java, and web — Local, Website API, or Your own API.
          </p>
        </div>
      )}

      {!hideChannelUi && <LocalAIControls />}

      <form onSubmit={submit} className="card space-y-4">
        <label className="block text-sm font-medium">
          Language / stack
          <select
            className="input mt-1"
            value={language}
            onChange={(event) => setLanguage(event.target.value as (typeof LANGUAGES)[number])}
          >
            {LANGUAGES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <MarkdownLatexField
          label="What are you trying to build or debug?"
          help="Describe the goal. Markdown ok. Keep graded work as coaching — not a full submission dump."
          value={task}
          onChange={setTask}
          required
          minHeightClass="min-h-[8rem]"
          placeholder="e.g. Why does my loop skip the last item? How do I structure a Flask route?"
        />
        <label className="block text-sm font-medium">
          Your code (optional)
          <textarea
            className="textarea mt-1 min-h-[10rem] font-mono text-xs leading-relaxed"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="Paste a snippet for debugging help…"
            spellCheck={false}
          />
          <span className="mt-1 block text-xs font-normal text-slate-500">
            Code stays plain text (no LaTeX conversion).
          </span>
        </label>
        <button type="submit" className="btn-primary" disabled={loading || !task.trim()}>
          {loading ? "Thinking…" : "Ask Coding AI"}
        </button>
      </form>

      {error && <div className="card border-red-200 bg-red-50 text-sm text-red-700">{error}</div>}

      {result && (
        <section
          className={`card space-y-4 ${result.refused ? "border-amber-200 bg-amber-50/50" : ""}`}
        >
          <div>
            <h3 className="text-lg font-semibold">{result.refused ? "Outside Coding AI scope" : "Coach reply"}</h3>
            <RichContent className="mt-2 text-sm text-slate-800">{result.reply}</RichContent>
          </div>
          {result.steps?.length > 0 && (
            <div>
              <h4 className="font-semibold text-brand-800">Steps</h4>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-700">
                {result.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          )}
          {result.snippet ? (
            <pre className="overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-100">
              <code>{result.snippet}</code>
            </pre>
          ) : null}
          <p className="text-sm text-amber-800">{result.aiMayBeWrong}</p>
          <p className="text-xs text-slate-400">{result.note}</p>
        </section>
      )}
    </div>
  );
}
