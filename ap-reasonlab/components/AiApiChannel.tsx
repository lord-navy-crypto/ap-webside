"use client";

import type { AiProvider } from "@/lib/ai-client";

export type ApiChannel = "site" | "byok";

type Props = {
  channel: ApiChannel;
  onChannelChange: (channel: ApiChannel) => void;
  provider: AiProvider;
  onProviderChange: (provider: AiProvider) => void;
  userKey: string;
  onUserKeyChange: (key: string) => void;
};

const providerOptions: Array<{ value: AiProvider; label: string; placeholder: string }> = [
  { value: "groq", label: "Groq Instant (llama-3.1-8b-instant)", placeholder: "gsk_..." },
  { value: "gemini", label: "Gemini Flash (gemini-2.0-flash)", placeholder: "AIza..." },
  {
    value: "githubmodels",
    label: "GitHub Models (CONTENT_GITHUB_TOKEN / PAT)",
    placeholder: "ghp_... or github_pat_...",
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
  provider,
  onProviderChange,
  userKey,
  onUserKeyChange,
}: Props) {
  const selected = providerOptions.find((option) => option.value === provider) || providerOptions[0];

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
            Shared Instant-class cascade: Groq → Gemini → OpenRouter → DeepSeek. Free to try; may
            hit shared rate limits.
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
            More effective and more powerful for you — stronger personal quota, fewer shared
            limits, usually faster when the site key is busy.
          </span>
        </button>
      </div>

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
              {providerOptions.map((option) => (
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
