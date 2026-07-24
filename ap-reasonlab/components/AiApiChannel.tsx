"use client";

import { useEffect, useMemo, useState } from "react";
import type { AdvancedModelMap, AiProvider, SiteModelChoice } from "@/lib/ai-site-models";
import { siteModelOptionsForTier } from "@/lib/ai-site-models";

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

/** @deprecated Prefer shared LocalAIProvider settings + LocalAIControls. Kept for type imports. */
export type ApiChannel = "site" | "byok";

type Props = {
  /** Which cloud path options to show — parent already chose Website API vs Your own API. */
  path: "site" | "byok";
  siteModel: SiteModelChoice;
  onSiteModelChange: (model: SiteModelChoice) => void;
  provider: AiProvider;
  onProviderChange: (provider: AiProvider) => void;
  userKey: string;
  onUserKeyChange: (key: string) => void;
};

/**
 * Detail fields for Website API or Your own API.
 * Path choice lives in LocalAIControls (Local / Website API / Your own API).
 */
export default function AiApiChannel({
  path,
  siteModel,
  onSiteModelChange,
  provider,
  onProviderChange,
  userKey,
  onUserKeyChange,
}: Props) {
  const selected = byokOptions.find((option) => option.value === provider) || byokOptions[0];
  const [advancedDefault, setAdvancedDefault] = useState(false);
  const [advancedModels, setAdvancedModels] = useState<AdvancedModelMap | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/ai/site-tier", { cache: "no-store" })
      .then((response) => response.json())
      .then(
        (payload: {
          advancedDefault?: boolean;
          advancedModels?: AdvancedModelMap;
        }) => {
          if (cancelled) return;
          setAdvancedDefault(Boolean(payload.advancedDefault));
          setAdvancedModels(payload.advancedModels || null);
        }
      )
      .catch(() => {
        if (!cancelled) {
          setAdvancedDefault(false);
          setAdvancedModels(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const siteOptions = useMemo(
    () => siteModelOptionsForTier(advancedDefault, advancedModels),
    [advancedDefault, advancedModels]
  );

  if (path === "site") {
    return (
      <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
        <label className="block text-sm font-medium text-slate-800">
          Website model{" "}
          <span className="font-normal text-slate-400">
            ({advancedDefault ? "Advanced Default" : "Instant · lowest limits"})
          </span>
        </label>
        <select
          className="input"
          value={siteModel}
          onChange={(e) => onSiteModelChange(e.target.value as SiteModelChoice)}
        >
          {siteOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
              {option.value === "auto" ? "" : ` · ${option.model}`}
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-500">
          {advancedDefault
            ? "Uses the site’s mid-tier models on shared keys."
            : "Shared Instant-class keys with the tightest limits."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/80 p-3">
      <p className="text-xs text-amber-900">
        Your key is sent only for this request and is not stored on the site.
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
  );
}
