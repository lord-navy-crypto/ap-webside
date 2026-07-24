"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import EthicsBanner from "@/components/EthicsBanner";
import LocalAIControls from "@/components/LocalAIControls";
import UnifiedMediaFrame from "@/components/UnifiedMediaFrame";
import { useLocalAI } from "@/components/LocalAIProvider";
import RichContent from "@/components/RichContent";
import MarkdownLatexField from "@/components/MarkdownLatexField";
import TICalculator from "@/components/TICalculator";
import TIGrapher from "@/components/TIGrapher";
import ImageGenPanel from "@/components/ImageGenPanel";
import EnglishAiTutor from "@/components/EnglishAiTutor";
import CodingAiPanel from "@/components/CodingAiPanel";
import { appendAiSiteContext, fetchAiSiteContext } from "@/lib/ai-site-context";

type Tool =
  | "hint"
  | "concept"
  | "guide"
  | "calculator"
  | "grapher"
  | "imagegen"
  | "english"
  | "coding";

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
  const localAI = useLocalAI();
  const [tool, setTool] = useState<Tool>("hint");
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
    if (
      tab === "concept" ||
      tab === "guide" ||
      tab === "hint" ||
      tab === "calculator" ||
      tab === "grapher" ||
      tab === "imagegen" ||
      tab === "english" ||
      tab === "coding"
    ) {
      setTool(tab);
    }
  }, [searchParams]);

  const subjectChoices = SUBJECT_OPTIONS.includes(subject as (typeof SUBJECT_OPTIONS)[number])
    ? SUBJECT_OPTIONS
    : ([subject, ...SUBJECT_OPTIONS] as string[]);

  function requireByok() {
    if (localAI.mode === "byok" && !localAI.userKey.trim()) {
      throw new Error("Paste your own API key, or switch to Website API.");
    }
  }

  async function runLocalIfSelected(system: string, prompt: string) {
    if (!localAI.usesLocal) return false;
    if (!localAI.ready) {
      throw new Error(
        "Local is selected, but no model is enabled yet. Enable a local model above, or switch to Website API / Your own API."
      );
    }

    const { context } = await fetchAiSiteContext(prompt, localAI.siteSearchEnabled);
    const promptWithSite = appendAiSiteContext(prompt, context);

    setTextResult({
      refused: false,
      reply: "Starting local response…",
      aiMayBeWrong: "Small local models can miss facts and instructions. Verify important details.",
      note: context
        ? "Local AI · processed in this browser · with Knowledge Explorer site search"
        : "Local AI · processed in this browser",
    });
    await localAI.complete(
      [
        { role: "system", content: system },
        { role: "user", content: promptWithSite },
      ],
      (_token, fullText) =>
        setTextResult({
          refused: false,
          reply: fullText,
          aiMayBeWrong:
            "Small local models can miss facts and instructions. Verify important details.",
          note: context
            ? "Local AI · processed in this browser · with Knowledge Explorer site search"
            : "Local AI · processed in this browser",
        })
    );
    return true;
  }

  async function submitHint(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setHintResult(null);
    setTextResult(null);
    try {
      if (
        await runLocalIfSelected(
          "You are a concise study coach. Give hints and a process outline, not only a final answer. Use clear Markdown. If unsure, say so.",
          `Subject: ${subject}\nQuestion: ${question}\nStudent attempt: ${notes || "Not provided"}`
        )
      ) {
        return;
      }
      requireByok();
      const res = await fetch("/api/hints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          subject,
          notes,
          ...localAI.cloudRequestFields,
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
      if (
        await runLocalIfSelected(
          "You are a concise AP concept tutor. Explain clearly, use Markdown, and stay on the named concept. If unsure, say so.",
          `Subject: ${subject}\nConcept: ${conceptName}\nMode: ${conceptMode}\nQuestion: ${
            conceptMode === "ask"
              ? question
              : conceptMode === "quiz"
                ? "Create a short quiz without immediately revealing the answer."
                : "Explain the concept with key ideas and one example."
          }`
        )
      ) {
        return;
      }
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
          ...localAI.cloudRequestFields,
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
      if (
        await runLocalIfSelected(
          "You are the Knowledge Explorer website guide. Only answer how to use the Knowledge Explorer study website. Never reveal or guess secret change codes. If you lack site facts, say that and direct the user to About or Manage.",
          guideQuestion
        )
      ) {
        return;
      }
      requireByok();
      const res = await fetch("/api/ai/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: guideQuestion,
          ...localAI.cloudRequestFields,
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
      blurb: "Only how to use Knowledge Explorer — navigation, design, authors. Not study content.",
    },
    {
      id: "calculator",
      label: "Calculator",
      blurb: "TI-style KE-84 scientific keypad — sin, log, powers, ANS.",
    },
    {
      id: "grapher",
      label: "Grapher",
      blurb: "TI-style function plotter — y = f(x) with zoom and trace.",
    },
    {
      id: "imagegen",
      label: "Image Gen",
      blurb: "Study diagrams from a prompt (Local / Website API / Your own API); save privately in this browser.",
    },
    {
      id: "english",
      label: "English AI",
      blurb: "Writing, grammar, vocabulary, TOEFL / IELTS / SAT — shared AI settings.",
    },
    {
      id: "coding",
      label: "Coding AI",
      blurb: "Python, Java, and web coaching — shared AI settings (hints, not graded dumps).",
    },
  ];

  const isAiTool =
    tool === "hint" ||
    tool === "concept" ||
    tool === "guide" ||
    tool === "imagegen" ||
    tool === "english" ||
    tool === "coding";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">AI Toolbox</p>
        <h1 className="mt-1 text-3xl font-bold">Study tools</h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Every AI tool uses the same settings: <strong>Local</strong>,{" "}
          <strong>Website API</strong>, or <strong>Your own API</strong>.
        </p>
      </div>

      <EthicsBanner />

      <UnifiedMediaFrame
        title="AI Toolbox · pictures, documents & files"
        folderArea="hints"
        spaceKey="_root"
        alsoShow={["document", "folder"]}
        collapsedByDefault
      />

      {isAiTool && <LocalAIControls />}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
            <MarkdownLatexField
              label="Your question"
              value={question}
              onChange={setQuestion}
              required
              minHeightClass="min-h-[8rem]"
              placeholder="Paste an AP problem here…"
            />
          </div>
          <div>
            <MarkdownLatexField
              label="Your notes / attempt (optional)"
              help="What you tried — Markdown + LaTeX supported."
              value={notes}
              onChange={setNotes}
              minHeightClass="min-h-[6rem]"
              placeholder="What you tried — helps the AI give better checkpoints."
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
              <MarkdownLatexField
                label="Your question"
                value={question}
                onChange={setQuestion}
                required
                minHeightClass="min-h-[6rem]"
                placeholder="Must be about this concept / learning."
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
            Ask how to use Knowledge Explorer, where AP folders live, Manage / change codes (no secret values),
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

      {tool === "calculator" && (
        <section className="space-y-3">
          <div>
            <h2 className="text-xl font-semibold">Calculator</h2>
            <p className="mt-1 text-sm text-slate-600">
              Texas Instruments–inspired scientific calculator inside the AI Toolbox.
            </p>
          </div>
          <TICalculator />
        </section>
      )}

      {tool === "grapher" && (
        <section className="space-y-3">
          <div>
            <h2 className="text-xl font-semibold">Grapher</h2>
            <p className="mt-1 text-sm text-slate-600">
              Plot y = f(x) with zoom and trace — graphing-calculator style.
            </p>
          </div>
          <TIGrapher />
        </section>
      )}

      {tool === "imagegen" && (
        <section className="space-y-3">
          <div>
            <h2 className="text-xl font-semibold">Image Generation</h2>
            <p className="mt-1 text-sm text-slate-600">
              Local, Website API, or Your own API diagrams. Images stay private on this device. Upload
              your own
              photos in the{" "}
              <a href="/learning-box?tab=pictures" className="font-medium text-brand-700 underline">
                Private Learning Box
              </a>
              .
            </p>
          </div>
          <ImageGenPanel embedded />
        </section>
      )}

      {tool === "english" && (
        <section className="space-y-3">
          <div>
            <h2 className="text-xl font-semibold">English AI Tutor</h2>
            <p className="mt-1 text-sm text-slate-600">
              English-only coaching using the shared AI settings above. Also linked from the{" "}
              <a href="/english/ai" className="font-medium text-brand-700 underline">
                English hub
              </a>
              .
            </p>
          </div>
          <EnglishAiTutor embedded hideChannelUi />
        </section>
      )}

      {tool === "coding" && (
        <section className="space-y-3">
          <div>
            <h2 className="text-xl font-semibold">Coding AI</h2>
            <p className="mt-1 text-sm text-slate-600">
              Programming coach for Python, Java, and web — uses the shared AI settings above. Use
              the{" "}
              <a href="/code" className="font-medium text-brand-700 underline">
                Code area
              </a>{" "}
              playgrounds to run snippets yourself.
            </p>
          </div>
          <CodingAiPanel embedded hideChannelUi />
        </section>
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
