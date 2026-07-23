"use client";

import type { AiProvider, SiteModelChoice } from "@/lib/ai-client";
import { SITE_INSTANT_MODELS } from "@/lib/ai-client";

export type ApiChannel = "site" | "byok";

type Props = {
  channel: ApiChannel;
  onChannelChange: (channel: ApiChannel) => void;
  /** Official Instant model when using Default website API */
  siteModel: SiteModelChoice;
  onSiteModelChange: (model: SiteModelChoice) => void;
  /** BYOK provider */
  provider: AiProvider;
  onProviderChange: (provider: AiProvider) => void;
  userKey: string;
  onUserKeyChange: (key: string) => void;
};

const byokOptions: Array<{ value: AiProvider; label: string; placeholder: string }> = [
  { value: "groq", label: "Groq mid · llama-3.3-70b-versatile", placeholder: "gsk_..." },
  { value: "gemini", label: "Gemini · gemini-2.0-flash", placeholder: "AIza..." },
  {
    value: "githubmodels",
    label: "GitHub Models mid (PAT)",
    placeholder: "ghp_... or github_pat_...",
  },
  {
    value: "kimi",
    label: "Kimi / Moonshot mid (moonshot-v1-32k)",
    placeholder: "sk-... (Kimi / Moonshot)",
  },
  {
    value: "openrouter",
    label: "OpenRouter mid (llama-3.1-70b)",
    placeholder: "sk-or-v1-...",
  },
  { value: "deepseek", label: "DeepSeek (deepseek-chat)", placeholder: "sk-..." },
];

export default function AiApiChannel({
  channel,
  onChannelChange,
  siteModel,
  onSiteModelChange,
  provider,
  onProviderChange,
  userKey,
  onUserKeyChange,
}: Props) {
  const selected = byokOptions.find((option) => option.value === provider) || byokOptions[0];

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Cloud API channel
        </p>
        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
          Backup to Local AI
        </span>
      </div>
      <p className="text-xs text-slate-500">
        Prefer Local AI above when you can. Cloud is for devices without WebGPU or when you need a
        server model.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onChannelChange("site")}
          className={
            channel === "site"
              ? "rounded-xl bg-brand-600 px-4 py-3 text-left text-sm font-semibold text-white shadow"
              : "rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate-700 hover:border-brand-300"
          }
        >
          <span className="flex flex-wrap items-center gap-2">
            <span>Default website API</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                channel === "site" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"
              }`}
            >
              Public · lowest
            </span>
          </span>
          <span
            className={`mt-1 block text-xs font-normal ${channel === "site" ? "text-blue-100" : "text-slate-500"}`}
          >
            Shared Instant-class keys with the tightest limits. Free to try; may hit shared quotas.
          </span>
        </button>
        <button
          type="button"
          onClick={() => onChannelChange("byok")}
          className={
            channel === "byok"
              ? "rounded-xl bg-brand-600 px-4 py-3 text-left text-sm font-semibold text-white shadow"
              : "rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate-700 hover:border-brand-300"
          }
        >
          <span className="flex flex-wrap items-center gap-2">
            <span>Your own API</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                channel === "byok" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800"
              }`}
            >
              Advanced · mid-tier
            </span>
          </span>
          <span
            className={`mt-1 block text-xs font-normal ${channel === "byok" ? "text-blue-100" : "text-slate-500"}`}
          >
            Personal mid versatile models — easier quota than the public Instant pool (still not
            unlimited).
          </span>
        </button>
      </div>

      {channel === "site" && (
        <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
          <label className="block text-sm font-medium text-slate-800">
            Official site model{" "}
            <span className="font-normal text-slate-400">(public Instant by default)</span>
          </label>
          <select
            className="input"
            value={siteModel}
            onChange={(e) => onSiteModelChange(e.target.value as SiteModelChoice)}
          >
            {SITE_INSTANT_MODELS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
                {option.value === "auto" ? "" : ` · ${option.model}`}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500">
            Public tier stays Instant / Flash / fast-chat with low token caps. If the owner sets{" "}
            <code className="rounded bg-slate-100 px-1">SITE_AI_TIER=author</code>, the same keys
            use mid versatile models with modestly higher caps — still not as open as Local AI.
          </p>
        </div>
      )}

      {channel === "byok" && (
        <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/80 p-3">
          <p className="text-xs text-amber-900">
            Your key is sent only for this request and is not stored. BYOK uses mid-tier models with
            moderately higher limits than the public Instant pool.
          </p>
          <div>
            <label className="mb-1 block text-sm font-medium">Provider</label>
            <select
              className="input"
              value={provider}
              onChange={(e) => onProviderChange(e.target.value as AiProvider)}
            >
              {byokOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Your API key</label>
            <input
              type="password"
              className="input"
              placeholder={selected.placeholder}
              value={userKey}
              onChange={(e) => onUserKeyChange(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
