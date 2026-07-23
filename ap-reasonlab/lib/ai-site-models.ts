/**
 * Client-safe site model picker labels (no Node fs).
 * Instant vs Advanced Default model ids for display; server enforces the real switch.
 */

export type AiProvider =
  | "groq"
  | "gemini"
  | "githubmodels"
  | "kimi"
  | "openrouter"
  | "deepseek";

export type SiteModelChoice = "auto" | AiProvider;

export const GROQ_INSTANT_MODEL = "llama-3.1-8b-instant";
export const GEMINI_FLASH_MODEL = "gemini-2.0-flash";
export const OPENROUTER_DEFAULT_MODEL = "meta-llama/llama-3.1-8b-instruct";
export const DEEPSEEK_DEFAULT_MODEL = "deepseek-chat";
export const GITHUB_MODELS_DEFAULT_MODEL = "openai/gpt-4o-mini";
export const KIMI_DEFAULT_MODEL = "moonshot-v1-8k";

/** Display defaults matching server midModelFor() when Advanced Default is ON. */
export const GROQ_ADVANCED_MODEL = "llama-3.3-70b-versatile";
export const GEMINI_ADVANCED_MODEL = "gemini-2.0-flash";
export const OPENROUTER_ADVANCED_MODEL = "meta-llama/llama-3.1-70b-instruct";
export const DEEPSEEK_ADVANCED_MODEL = "deepseek-chat";
export const GITHUB_MODELS_ADVANCED_MODEL = "openai/gpt-4o-mini";
export const KIMI_ADVANCED_MODEL = "moonshot-v1-32k";

export type SiteModelOption = {
  value: SiteModelChoice;
  label: string;
  model: string;
};

export const SITE_INSTANT_MODELS: SiteModelOption[] = [
  { value: "auto", label: "Auto cascade · Instant (lowest)", model: "cascade" },
  { value: "groq", label: "Groq Instant", model: GROQ_INSTANT_MODEL },
  { value: "gemini", label: "Gemini Flash", model: GEMINI_FLASH_MODEL },
  { value: "githubmodels", label: "GitHub Models", model: GITHUB_MODELS_DEFAULT_MODEL },
  { value: "kimi", label: "Kimi / Moonshot Instant", model: KIMI_DEFAULT_MODEL },
  { value: "openrouter", label: "OpenRouter Instant", model: OPENROUTER_DEFAULT_MODEL },
  { value: "deepseek", label: "DeepSeek Chat", model: DEEPSEEK_DEFAULT_MODEL },
];

export const SITE_ADVANCED_MODELS: SiteModelOption[] = [
  { value: "auto", label: "Auto cascade · Advanced Default", model: "cascade" },
  { value: "groq", label: "Groq Advanced", model: GROQ_ADVANCED_MODEL },
  { value: "gemini", label: "Gemini Advanced", model: GEMINI_ADVANCED_MODEL },
  {
    value: "githubmodels",
    label: "GitHub Models Advanced",
    model: GITHUB_MODELS_ADVANCED_MODEL,
  },
  { value: "kimi", label: "Kimi / Moonshot Advanced", model: KIMI_ADVANCED_MODEL },
  { value: "openrouter", label: "OpenRouter Advanced", model: OPENROUTER_ADVANCED_MODEL },
  { value: "deepseek", label: "DeepSeek Advanced", model: DEEPSEEK_ADVANCED_MODEL },
];

export type AdvancedModelMap = Partial<Record<AiProvider, string>>;

/** Build picker rows for Instant or Advanced Default (optionally override ids from API). */
export function siteModelOptionsForTier(
  advancedDefault: boolean,
  advancedModels?: AdvancedModelMap | null
): SiteModelOption[] {
  if (!advancedDefault) return SITE_INSTANT_MODELS;
  return SITE_ADVANCED_MODELS.map((option) => {
    if (option.value === "auto") return option;
    const override = advancedModels?.[option.value];
    return override ? { ...option, model: override } : option;
  });
}

export function parseAiProvider(raw: unknown): AiProvider | undefined {
  const value = String(raw || "").trim().toLowerCase();
  if (
    value === "groq" ||
    value === "gemini" ||
    value === "githubmodels" ||
    value === "kimi" ||
    value === "openrouter" ||
    value === "deepseek"
  ) {
    return value;
  }
  return undefined;
}

export function parseSiteModelChoice(raw: unknown): SiteModelChoice | undefined {
  const value = String(raw || "").trim().toLowerCase();
  if (value === "auto") return "auto";
  return parseAiProvider(value);
}
