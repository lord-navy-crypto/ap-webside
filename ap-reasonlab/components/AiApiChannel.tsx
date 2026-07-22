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

export default function AiApiChannel({
  channel,
  onChannelChange,
  provider,
  onProviderChange,
  userKey,
  onUserKeyChange,
}: Props) {
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
          <span className={`mt-1 block text-xs font-normal ${channel === "site" ? "text-blue-100" : "text-slate-500"}`}>
            Shared site fast models. Free to try; may hit shared rate limits.
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
          <span className={`mt-1 block text-xs font-normal ${channel === "byok" ? "text-blue-100" : "text-slate-500"}`}>
            More effective and more powerful for you — stronger personal quota, fewer shared limits, usually faster when the site key is busy.
          </span>
        </button>
      </div>

      {channel === "byok" && (
        <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/80 p-3">
          <p className="text-xs text-amber-900">
            Your key is sent only for this request and is not stored. Groq can use a supported fallback if Instant is retired.
          </p>
          <div>
            <label className="mb-1 block text-sm font-medium">Provider</label>
            <select
              className="input"
              value={provider}
              onChange={(e) => onProviderChange(e.target.value as AiProvider)}
            >
              <option value="groq">Groq Instant (llama-3.1-8b-instant)</option>
              <option value="gemini">Gemini Flash (gemini-2.0-flash)</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Your API key</label>
            <input
              type="password"
              className="input"
              placeholder={provider === "gemini" ? "AIza..." : "gsk_..."}
              value={userKey}
              onChange={(e) => onUserKeyChange(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
