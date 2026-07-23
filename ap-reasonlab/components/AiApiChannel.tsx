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
  { value: "groq", label: "Groq Instant (llama-3.1-8b-instant)", placeholder: "gsk_..." },
  { value: "gemini", label: "Gemini Flash (gemini-2.0-flash)", placeholder: "AIza..." },
  {
    value: "githubmodels",
    label: "GitHub Models (PAT)",
    placeholder: "ghp_... or github_pat_...",
  },
  {
    value: "kimi",
    label: "Kimi / Moonshot (moonshot-v1-8k)",
    placeholder: "sk-... (Kimi / Moonshot)",
  },
  {
    value: "openrouter",
    label: "OpenRouter (llama-3.1-8b via OpenRouter)",
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
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">API channel</p>
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
          <span className="block">Default website API</span>
          <span
            className={`mt-1 block text-xs font-normal ${channel === "site" ? "text-blue-100" : "text-slate-500"}`}
          >
            Pick one official Instant model, or Auto cascade. Free to try; may hit shared limits.
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
          <span className="block">Your own API</span>
          <span
            className={`mt-1 block text-xs font-normal ${channel === "byok" ? "text-blue-100" : "text-slate-500"}`}
          >
            More effective for you — personal Instant-class key, fewer shared limits.
          </span>
        </button>
      </div>

      {channel === "site" && (
        <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
          <label className="block text-sm font-medium text-slate-800">Official Instant model</label>
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
            All official options stay Instant / Flash / fast-chat class. Auto tries configured keys
            in order until one works.
          </p>
        </div>
      )}

      {channel === "byok" && (
        <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/80 p-3">
          <p className="text-xs text-amber-900">
            Your key is sent only for this request and is not stored. Models stay Instant-class;
            Groq can use a supported fallback if Instant is retired.
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
