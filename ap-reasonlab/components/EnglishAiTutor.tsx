"use client";

import { useState } from "react";
import Link from "next/link";
import AiApiChannel, { type ApiChannel } from "@/components/AiApiChannel";
import LocalAIControls from "@/components/LocalAIControls";
import MarkdownLatexField from "@/components/MarkdownLatexField";
import RichContent from "@/components/RichContent";
import { useLocalAI } from "@/components/LocalAIProvider";
import type { AiProvider, SiteModelChoice } from "@/lib/ai-client";

type Result = {
  refused: boolean;
  feedback: string;
  strengths: string[];
  priorities: string[];
  revisionExample: string;
  practicePrompt: string;
  aiMayBeWrong: string;
  note: string;
};

const modes = [
  { value: "writing-feedback", label: "Writing feedback" },
  { value: "grammar-explanation", label: "Grammar & sentence help" },
  { value: "vocabulary-coach", label: "Vocabulary coach" },
  { value: "test-strategy", label: "TOEFL / IELTS / SAT strategy" },
  { value: "original-practice", label: "Create original practice" },
] as const;

type Props = {
  embedded?: boolean;
  channel?: ApiChannel;
  onChannelChange?: (channel: ApiChannel) => void;
  siteModel?: SiteModelChoice;
  onSiteModelChange?: (model: SiteModelChoice) => void;
  provider?: AiProvider;
  onProviderChange?: (provider: AiProvider) => void;
  userKey?: string;
  onUserKeyChange?: (key: string) => void;
  hideChannelUi?: boolean;
};

export default function EnglishAiTutor({
  embedded = false,
  channel: channelProp,
  onChannelChange,
  siteModel: siteModelProp,
  onSiteModelChange,
  provider: providerProp,
  onProviderChange,
  userKey: userKeyProp,
  onUserKeyChange,
  hideChannelUi = false,
}: Props) {
  const localAI = useLocalAI();
  const [mode, setMode] = useState<(typeof modes)[number]["value"]>("writing-feedback");
  const [target, setTarget] = useState("General academic English");
  const [input, setInput] = useState("");
  const [channelLocal, setChannelLocal] = useState<ApiChannel>("site");
  const [siteModelLocal, setSiteModelLocal] = useState<SiteModelChoice>("auto");
  const [providerLocal, setProviderLocal] = useState<AiProvider>("groq");
  const [userKeyLocal, setUserKeyLocal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  const channel = channelProp ?? channelLocal;
  const setChannel = onChannelChange ?? setChannelLocal;
  const siteModel = siteModelProp ?? siteModelLocal;
  const setSiteModel = onSiteModelChange ?? setSiteModelLocal;
  const provider = providerProp ?? providerLocal;
  const setProvider = onProviderChange ?? setProviderLocal;
  const userKey = userKeyProp ?? userKeyLocal;
  const setUserKey = onUserKeyChange ?? setUserKeyLocal;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const useLocal =
        localAI.mode === "local" || (localAI.mode === "auto" && localAI.ready);
      if (useLocal) {
        if (!localAI.ready) {
          throw new Error(
            "Local AI mode is on, but no model is enabled. Enable Local AI above, or switch to Auto / Cloud."
          );
        }
        const text = await localAI.complete([
          {
            role: "system",
            content:
              "You are English AI Tutor. Only English learning help (writing, grammar, vocab, TOEFL/IELTS/SAT strategy). Refuse AP science/math solving. Reply with short markdown feedback.",
          },
          {
            role: "user",
            content: `Mode: ${mode}\nTarget: ${target}\n\nStudent input:\n${input}`,
          },
        ]);
        setResult({
          refused: false,
          feedback: text,
          strengths: [],
          priorities: [],
          revisionExample: "",
          practicePrompt: "",
          aiMayBeWrong: "Local AI language advice may be wrong — verify important points.",
          note: "Local AI · processed in this browser",
        });
        return;
      }

      if (channel === "byok" && !userKey.trim()) {
        throw new Error("Paste your own API key, or choose Default website API / Local AI.");
      }
      const response = await fetch("/api/ai/english", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          target,
          input,
          userApiKey: channel === "byok" ? userKey.trim() : undefined,
          provider,
          siteModel: channel === "site" ? siteModel : "auto",
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "English AI failed");
      setResult(data as Result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "English AI failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {!embedded && (
        <div>
          <h2 className="text-xl font-semibold">English AI</h2>
          <p className="mt-1 text-sm text-slate-600">
            Writing, grammar, vocabulary, and test strategy — Local, Auto, or Cloud.{" "}
            <Link href="/hints?tool=english" className="font-semibold underline">
              AI Toolbox · English AI
            </Link>
          </p>
        </div>
      )}

      {!hideChannelUi && <LocalAIControls />}

      {!hideChannelUi && localAI.mode !== "local" && (
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
      )}

      <form onSubmit={submit} className="card space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium">
            Tool
            <select
              className="input mt-1"
              value={mode}
              onChange={(event) => setMode(event.target.value as typeof mode)}
            >
              {modes.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            Target
            <select className="input mt-1" value={target} onChange={(event) => setTarget(event.target.value)}>
              <option>General academic English</option>
              <option>TOEFL iBT</option>
              <option>IELTS Academic</option>
              <option>SAT Reading & Writing</option>
              <option>School writing</option>
            </select>
          </label>
        </div>
        <MarkdownLatexField
          label="Your text or English-learning question"
          help="Paste writing or a learning question. Markdown supported."
          value={input}
          onChange={setInput}
          required
          minHeightClass="min-h-52"
          placeholder="Paste your own paragraph, sentence, vocabulary question, or ask for an original practice exercise…"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            Maximum 10,000 characters · AI feedback is not an official test score.
          </p>
          <button type="submit" className="btn-primary" disabled={loading || !input.trim()}>
            {loading ? "Reviewing…" : "Ask English AI"}
          </button>
        </div>
      </form>

      {error && (
        <div role="alert" className="card border-red-200 bg-red-50 text-sm text-red-700">
          {error}
        </div>
      )}

      {result && (
        <section className={`card space-y-5 ${result.refused ? "border-amber-200 bg-amber-50/50" : ""}`}>
          <div>
            <h2 className="text-xl font-semibold">
              {result.refused ? "Outside English Tutor scope" : "Feedback"}
            </h2>
            <RichContent className="mt-2 text-sm text-slate-700">{result.feedback}</RichContent>
          </div>
          {result.strengths?.length > 0 && (
            <div>
              <h3 className="font-semibold text-emerald-800">Strengths</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {result.strengths.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          {result.priorities?.length > 0 && (
            <div>
              <h3 className="font-semibold text-brand-800">Priorities</h3>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-700">
                {result.priorities.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            </div>
          )}
          {result.revisionExample && (
            <div className="rounded-xl bg-slate-950 p-4 text-sm text-slate-100">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Short revision example
              </p>
              <RichContent>{result.revisionExample}</RichContent>
            </div>
          )}
          {result.practicePrompt && (
            <div className="rounded-xl bg-indigo-50 p-4 text-sm text-indigo-950">
              <strong>Next practice:</strong> {result.practicePrompt}
            </div>
          )}
          <p className="text-sm text-amber-800">{result.aiMayBeWrong}</p>
          <p className="text-xs text-slate-400">{result.note}</p>
        </section>
      )}
    </div>
  );
}
