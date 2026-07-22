"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import EthicsBanner from "@/components/EthicsBanner";
import AiApiChannel, { type ApiChannel } from "@/components/AiApiChannel";
import RichContent from "@/components/RichContent";
import type { AiProvider } from "@/lib/ai-client";

type Tool = "hint" | "concept" | "guide";

type HintResult = {
  hints: string[];
  keyFormulas: string[];
  checkpoints: string[];
  processOutline: string[];
  aiMayBeWrong: string;
  note: string;
};

type TextResult = {
  refused: boolean;
  reply: string;
  quizPrompt?: string;
  aiMayBeWrong: string;
  note: string;
};

const SUBJECT_OPTIONS = [
  "AP Physics 1",
  "AP Physics 2",
  "AP Physics C: Mechanics",
  "AP Physics C: E&M",
  "AP Calculus AB/BC",
  "AP Statistics",
  "AP Chemistry",
  "AP Biology",
  "AP Psychology",
  "AP Computer Science A",
  "AP Microeconomics",
  "AP Macroeconomics",
  "AP US History",
] as const;

function resolveSubject(raw: string | null): string {
  if (!raw?.trim()) return SUBJECT_OPTIONS[0];
  const trimmed = raw.trim();
  const exact = SUBJECT_OPTIONS.find((option) => option === trimmed);
  if (exact) return exact;
  const ci = SUBJECT_OPTIONS.find((option) => option.toLowerCase() === trimmed.toLowerCase());
  return ci || trimmed;
}

function ToolboxContent() {
  const searchParams = useSearchParams();
  const [tool, setTool] = useState<Tool>("hint");
  const [channel, setChannel] = useState<ApiChannel>("site");
  const [provider, setProvider] = useState<AiProvider>("groq");
  const [userKey, setUserKey] = useState("");

  const [subject, setSubject] = useState(() => resolveSubject(searchParams.get("subject")));
  const [question, setQuestion] = useState("");
  const [notes, setNotes] = useState("");
  const [conceptName, setConceptName] = useState("");
  const [conceptMode, setConceptMode] = useState<"explain" | "quiz" | "ask">("explain");
  const [guideQuestion, setGuideQuestion] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hintResult, setHintResult] = useState<HintResult | null>(null);
  const [textResult, setTextResult] = useState<TextResult | null>(null);

  useEffect(() => {
    setSubject(resolveSubject(searchParams.get("subject")));
    const tab = searchParams.get("tool");
    if (tab === "concept" || tab === "guide" || tab === "hint") setTool(tab);
  }, [searchParams]);

  const subjectChoices = SUBJECT_OPTIONS.includes(subject as (typeof SUBJECT_OPTIONS)[number])
    ? SUBJECT_OPTIONS
    : ([subject, ...SUBJECT_OPTIONS] as string[]);

  function requireByok() {
    if (channel === "byok" && !userKey.trim()) {
      throw new Error("Paste your own API key, or switch to Default website API.");
    }
  }

  async function submitHint(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setHintResult(null);
    setTextResult(null);
    try {
      requireByok();
      const res = await fetch("/api/hints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          subject,
          notes,
          userApiKey: channel === "byok" ? userKey.trim() : undefined,
          provider,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get hints");
      setHintResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function submitConcept(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setHintResult(null);
    setTextResult(null);
    try {
      requireByok();
      const res = await fetch("/api/ai/concept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          conceptTitle: conceptName,
          mode: conceptMode,
          question:
            conceptMode === "ask"
              ? question
              : conceptMode === "quiz"
                ? "Quiz me on this concept."
                : "Explain this concept for AP study.",
          lockToConcept: false,
          userApiKey: channel === "byok" ? userKey.trim() : undefined,
          provider,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Concept AI failed");
      setTextResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function submitGuide(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setHintResult(null);
    setTextResult(null);
    try {
      requireByok();
      const res = await fetch("/api/ai/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: guideQuestion,
          userApiKey: channel === "byok" ? userKey.trim() : undefined,
          provider,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Guide AI failed");
      setTextResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const tools: Array<{ id: Tool; label: string; blurb: string }> = [
    {
      id: "hint",
      label: "Hint & Process",
      blurb: "Strategy hints, key formulas, and mid-process checkpoints — not final answers.",
    },
    {
      id: "concept",
      label: "Concept Explainer",
      blurb: "Explain or quiz an AP concept. Refuses off-topic / non-learning asks.",
    },
    {
      id: "guide",
      label: "Site Guide",
      blurb: "Only how to use Results — navigation, design, authors. Not study content.",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">AI Toolbox</p>
        <h1 className="mt-1 text-3xl font-bold">Study tools powered by Instant models</h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Three focused AIs. Site default uses shared Instant / Flash. Your own API is more
          effective and more powerful for personal quota when the shared key is busy.
        </p>
      </div>

      <EthicsBanner />

      <div className="grid gap-3 md:grid-cols-3">
        {tools.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setTool(item.id);
              setError("");
              setHintResult(null);
              setTextResult(null);
            }}
            className={
              tool === item.id
                ? "card border-brand-400 bg-brand-50 text-left shadow-md"
                : "card-hover text-left"
            }
          >
            <h2 className="font-semibold text-slate-900">{item.label}</h2>
            <p className="mt-2 text-sm text-slate-600">{item.blurb}</p>
          </button>
        ))}
      </div>

      <AiApiChannel
        channel={channel}
        onChannelChange={setChannel}
        provider={provider}
        onProviderChange={setProvider}
        userKey={userKey}
        onUserKeyChange={setUserKey}
      />

      {tool === "hint" && (
        <form onSubmit={submitHint} className="card space-y-4">
          <h2 className="text-xl font-semibold">Hint & Process</h2>
          <div>
            <label className="mb-2 block text-sm font-medium">Subject</label>
            <select className="input" value={subject} onChange={(e) => setSubject(e.target.value)}>
              {subjectChoices.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
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
          <div>
            <label className="mb-2 block text-sm font-medium">Your notes / attempt (optional)</label>
            <textarea
              className="textarea min-h-[100px]"
              placeholder="What you tried — helps the AI give better checkpoints."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading || !question.trim()}>
            {loading ? "Generating…" : "Get hints, formulas & checkpoints"}
          </button>
        </form>
      )}

      {tool === "concept" && (
        <form onSubmit={submitConcept} className="card space-y-4">
          <h2 className="text-xl font-semibold">Concept Explainer</h2>
          <div>
            <label className="mb-2 block text-sm font-medium">Subject</label>
            <select className="input" value={subject} onChange={(e) => setSubject(e.target.value)}>
              {subjectChoices.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Concept name</label>
            <input
              className="input"
              value={conceptName}
              onChange={(e) => setConceptName(e.target.value)}
              placeholder="e.g. Conservation of energy"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Mode</label>
            <select
              className="input"
              value={conceptMode}
              onChange={(e) => setConceptMode(e.target.value as "explain" | "quiz" | "ask")}
            >
              <option value="explain">Explain</option>
              <option value="quiz">Quiz me</option>
              <option value="ask">Ask a follow-up</option>
            </select>
          </div>
          {conceptMode === "ask" && (
            <div>
              <label className="mb-2 block text-sm font-medium">Your question</label>
              <textarea
                className="textarea"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Must be about this concept / learning."
                required
              />
            </div>
          )}
          <button
            type="submit"
            className="btn-primary"
            disabled={loading || !conceptName.trim() || (conceptMode === "ask" && !question.trim())}
          >
            {loading ? "Working…" : "Ask Concept Explainer"}
          </button>
        </form>
      )}

      {tool === "guide" && (
        <form onSubmit={submitGuide} className="card space-y-4">
          <h2 className="text-xl font-semibold">Site Guide</h2>
          <p className="text-sm text-slate-600">
            Ask how to use Results, where AP folders live, Manage / change codes (no secret values),
            partners, or site design. Study questions are refused.
          </p>
          <div>
            <label className="mb-2 block text-sm font-medium">Your question about the site</label>
            <textarea
              className="textarea"
              value={guideQuestion}
              onChange={(e) => setGuideQuestion(e.target.value)}
              placeholder="e.g. How do I add a concept? Who founded this site?"
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading || !guideQuestion.trim()}>
            {loading ? "Looking up…" : "Ask Site Guide"}
          </button>
        </form>
      )}

      {error && <div className="card border-red-200 bg-red-50 text-sm text-red-700">{error}</div>}

      {hintResult && (
        <section className="card space-y-5">
          <div>
            <h2 className="text-lg font-semibold">Hints</h2>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-slate-700">
              {hintResult.hints.map((hint) => (
                <li key={hint}>
                  <RichContent>{hint}</RichContent>
                </li>
              ))}
            </ul>
          </div>
          {hintResult.keyFormulas?.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold">Key formulas</h2>
              <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-slate-700">
                {hintResult.keyFormulas.map((item) => (
                  <li key={item}>
                    <RichContent>{item}</RichContent>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {hintResult.checkpoints?.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold">Checkpoints (verify mid-process)</h2>
              <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-slate-700">
                {hintResult.checkpoints.map((item) => (
                  <li key={item}>
                    <RichContent>{item}</RichContent>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {hintResult.processOutline?.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold">Process outline</h2>
              <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-slate-700">
                {hintResult.processOutline.map((item) => (
                  <li key={item}>
                    <RichContent>{item}</RichContent>
                  </li>
                ))}
              </ol>
            </div>
          )}
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {hintResult.aiMayBeWrong}
          </p>
          <p className="text-sm text-slate-500">{hintResult.note}</p>
        </section>
      )}

      {textResult && (
        <section
          className={`card space-y-3 ${textResult.refused ? "border-amber-200 bg-amber-50/50" : ""}`}
        >
          <h2 className="text-lg font-semibold">{textResult.refused ? "Declined" : "Reply"}</h2>
          <RichContent className="text-sm text-slate-800">{textResult.reply}</RichContent>
          {textResult.quizPrompt && (
            <p className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-900">
              <strong>Try:</strong> {textResult.quizPrompt}
            </p>
          )}
          <p className="text-sm text-slate-500">{textResult.aiMayBeWrong}</p>
          <p className="text-xs text-slate-400">{textResult.note}</p>
        </section>
      )}
    </div>
  );
}

export default function AiToolboxPage() {
  return (
    <Suspense fallback={<div className="text-sm text-slate-500">Loading AI Toolbox…</div>}>
      <ToolboxContent />
    </Suspense>
  );
}
