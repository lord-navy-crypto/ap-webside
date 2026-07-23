/**
 * Client-safe site model picker labels (no Node fs).
 * Instant model ids are display defaults; Advanced Default switches server-side.
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

export const SITE_INSTANT_MODELS: Array<{
  value: SiteModelChoice;
  label: string;
  model: string;
}> = [
  { value: "auto", label: "Auto cascade (Instant or Advanced Default)", model: "cascade" },
  { value: "groq", label: "Groq", model: GROQ_INSTANT_MODEL },
  { value: "gemini", label: "Gemini", model: GEMINI_FLASH_MODEL },
  { value: "githubmodels", label: "GitHub Models", model: GITHUB_MODELS_DEFAULT_MODEL },
  { value: "kimi", label: "Kimi / Moonshot", model: KIMI_DEFAULT_MODEL },
  { value: "openrouter", label: "OpenRouter", model: OPENROUTER_DEFAULT_MODEL },
  { value: "deepseek", label: "DeepSeek Chat", model: DEEPSEEK_DEFAULT_MODEL },
];

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
