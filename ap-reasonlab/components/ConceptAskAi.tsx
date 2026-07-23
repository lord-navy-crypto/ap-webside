"use client";

import { useMemo, useState } from "react";
import EthicsBanner from "@/components/EthicsBanner";
import AiApiChannel, { type ApiChannel } from "@/components/AiApiChannel";
import RichContent from "@/components/RichContent";
import type { AiProvider, SiteModelChoice } from "@/lib/ai-client";

type Props = {
  defaultSubject?: string;
  conceptTitle: string;
  conceptSummary?: string;
  lockToConcept?: boolean;
};

export default function ConceptAskAi({
  defaultSubject = "",
  conceptTitle,
  conceptSummary = "",
  lockToConcept = true,
}: Props) {
  const [channel, setChannel] = useState<ApiChannel>("site");
  const [siteModel, setSiteModel] = useState<SiteModelChoice>("auto");
  const [provider, setProvider] = useState<AiProvider>("groq");
  const [userKey, setUserKey] = useState("");
  const [mode, setMode] = useState<"explain" | "quiz" | "ask">("explain");
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    refused: boolean;
    reply: string;
    quizPrompt: string;
    aiMayBeWrong: string;
    note: string;
  } | null>(null);

  const title = useMemo(() => conceptTitle || "This concept", [conceptTitle]);

  async function run(nextMode: "explain" | "quiz" | "ask") {
    setMode(nextMode);
    setLoading(true);
    setError("");
    setResult(null);
    try {
      if (channel === "byok" && !userKey.trim()) {
        throw new Error("Paste your own API key, or switch to Default website API.");
      }
      const res = await fetch("/api/ai/concept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: defaultSubject,
          conceptTitle,
          conceptSummary,
          mode: nextMode,
          question:
            nextMode === "ask"
              ? question
              : nextMode === "quiz"
                ? "Quiz me on this concept."
                : "Explain this concept for AP study.",
          lockToConcept,
          userApiKey: channel === "byok" ? userKey.trim() : undefined,
          provider,
          siteModel: channel === "site" ? siteModel : "auto",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI request failed");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card space-y-4 border-brand-100">
      <div>
        <h2 className="text-lg font-semibold">Ask AI about “{title}”</h2>
        <p className="mt-1 text-sm text-slate-600">
          Explain or quiz on this concept. Off-topic or non-learning questions are refused.
        </p>
      </div>
      <EthicsBanner />
      <AiApiChannel
        channel={channel}
        onChannelChange={setChannel}
        siteModel={siteModel}
        onSiteModelChange={setSiteModel}
        provider={provider}
        onProviderChange={setProvider}
        userKey={userKey}
        onUserKeyChange={setUserKey}
      />
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-primary" disabled={loading} onClick={() => run("explain")}>
          {loading && mode === "explain" ? "Explaining…" : "Explain"}
        </button>
        <button type="button" className="btn-secondary" disabled={loading} onClick={() => run("quiz")}>
          {loading && mode === "quiz" ? "Preparing…" : "Quiz me"}
        </button>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Or ask a follow-up (must stay on this concept)</label>
        <textarea
          className="textarea min-h-[90px]"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. Why do students mix this up with …?"
        />
        <button
          type="button"
          className="btn-secondary"
          disabled={loading || !question.trim()}
          onClick={() => run("ask")}
        >
          {loading && mode === "ask" ? "Thinking…" : "Ask"}
        </button>
      </div>
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {result && (
        <div className={`rounded-xl px-4 py-3 text-sm ${result.refused ? "border border-amber-200 bg-amber-50 text-amber-950" : "border border-slate-200 bg-white text-slate-800"}`}>
          <RichContent>{result.reply}</RichContent>
          {result.quizPrompt && (
            <p className="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-brand-900">
              <strong>Try:</strong> {result.quizPrompt}
            </p>
          )}
          <p className="mt-3 text-xs text-slate-500">{result.aiMayBeWrong}</p>
          <p className="mt-1 text-xs text-slate-400">{result.note}</p>
        </div>
      )}
    </section>
  );
}
