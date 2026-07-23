/**
 * Shared AI client — Instant (public) or mid-tier (author / BYOK).
 * Site order: Groq → Gemini → GitHub Models → Kimi → OpenRouter → DeepSeek.
 *
 * Owner setup:
 * - SITE_AI_TIER=public (default) → Instant models, lowest token caps
 * - SITE_AI_TIER=author → mid versatile models, modestly higher caps
 * - CONTENT_GITHUB_TOKEN → GitHub Models AI API
 * - KIMI_API_KEY (or MOONSHOT_API_KEY) → Kimi / Moonshot AI
 * - GITHUB_TOKEN → repo Save/publish only (see lib/managed-store.ts)
 */

import {
  capMaxTokens,
  midModelFor,
  type CloudSpendTier,
} from "@/lib/ai-tiers";
import { resolveSiteCloudTier } from "@/lib/ai-tiers-managed";
import {
  DEEPSEEK_DEFAULT_MODEL as SITE_DEEPSEEK_FALLBACK,
  GEMINI_FLASH_MODEL as SITE_GEMINI_FALLBACK,
  GITHUB_MODELS_DEFAULT_MODEL as SITE_GITHUB_FALLBACK,
  GROQ_INSTANT_MODEL as SITE_GROQ_FALLBACK,
  KIMI_DEFAULT_MODEL as SITE_KIMI_FALLBACK,
  OPENROUTER_DEFAULT_MODEL as SITE_OPENROUTER_FALLBACK,
  type AiProvider,
  type SiteModelChoice,
} from "@/lib/ai-site-models";

export type { AiProvider, SiteModelChoice } from "@/lib/ai-site-models";
export { SITE_INSTANT_MODELS } from "@/lib/ai-site-models";

export const GROQ_INSTANT_MODEL = SITE_GROQ_FALLBACK;
export const GROQ_FALLBACK_MODEL = "openai/gpt-oss-20b";
export const GEMINI_FLASH_MODEL =
  process.env.GEMINI_MODEL?.trim() || SITE_GEMINI_FALLBACK;
export const OPENROUTER_DEFAULT_MODEL =
  process.env.OPENROUTER_MODEL?.trim() || SITE_OPENROUTER_FALLBACK;
export const DEEPSEEK_DEFAULT_MODEL =
  process.env.DEEPSEEK_MODEL?.trim() || SITE_DEEPSEEK_FALLBACK;
export const GITHUB_MODELS_DEFAULT_MODEL =
  process.env.GITHUB_MODELS_MODEL?.trim() || SITE_GITHUB_FALLBACK;
export const KIMI_DEFAULT_MODEL =
  process.env.KIMI_MODEL?.trim() || process.env.MOONSHOT_MODEL?.trim() || SITE_KIMI_FALLBACK;
export const KIMI_API_BASE = (
  process.env.KIMI_API_BASE?.trim() ||
  process.env.MOONSHOT_API_BASE?.trim() ||
  "https://api.moonshot.cn/v1"
).replace(/\/$/, "");

export type ChatJsonResult = {
  data: Record<string, unknown>;
  provider: AiProvider;
  model: string;
  note: string;
};

function modelsForTier(tier: CloudSpendTier, provider: AiProvider): string {
  if (tier === "public") {
    if (provider === "groq") return GROQ_INSTANT_MODEL;
    if (provider === "gemini") return GEMINI_FLASH_MODEL;
    if (provider === "githubmodels") return GITHUB_MODELS_DEFAULT_MODEL;
    if (provider === "kimi") return KIMI_DEFAULT_MODEL;
    if (provider === "openrouter") return OPENROUTER_DEFAULT_MODEL;
    return DEEPSEEK_DEFAULT_MODEL;
  }
  return midModelFor(provider);
}

async function callOpenAiCompatibleJson(options: {
  url: string;
  apiKey: string;
  model: string;
  system: string;
  user: string;
  maxTokens: number;
  provider: AiProvider;
  extraHeaders?: Record<string, string>;
  note: string;
  includeResponseFormat?: boolean;
}): Promise<ChatJsonResult> {
  const body: Record<string, unknown> = {
    model: options.model,
    messages: [
      { role: "system", content: options.system },
      { role: "user", content: options.user },
    ],
    temperature: 0.35,
    max_tokens: options.maxTokens,
  };
  if (options.includeResponseFormat !== false) {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch(options.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${options.apiKey}`,
      ...options.extraHeaders,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`${options.provider} API error ${res.status}: ${errText}`);
  }

  const payload = await res.json();
  const text = payload?.choices?.[0]?.message?.content || "";
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(text);
  } catch {
    const jsonMatch = String(text).match(/\{[\s\S]*\}/);
    try {
      data = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch {
      data = { raw: text };
    }
  }

  return {
    data,
    provider: options.provider,
    model: options.model,
    note: options.note,
  };
}

async function callGroqJson(
  apiKey: string,
  system: string,
  user: string,
  maxTokens: number,
  model = GROQ_INSTANT_MODEL
): Promise<ChatJsonResult> {
  return callOpenAiCompatibleJson({
    url: "https://api.groq.com/openai/v1/chat/completions",
    apiKey,
    model,
    system,
    user,
    maxTokens,
    provider: "groq",
    note: `Powered by Groq (${model}).`,
  });
}

async function callGroqWithFallback(
  apiKey: string,
  system: string,
  user: string,
  maxTokens: number,
  preferredModel = GROQ_INSTANT_MODEL
): Promise<ChatJsonResult> {
  try {
    return await callGroqJson(apiKey, system, user, maxTokens, preferredModel);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!/groq API error (400|404|410)/i.test(message)) throw error;
    const fallback =
      preferredModel === GROQ_INSTANT_MODEL ? GROQ_FALLBACK_MODEL : GROQ_INSTANT_MODEL;
    return callGroqJson(apiKey, system, user, maxTokens, fallback);
  }
}

async function callGithubModelsJson(
  apiKey: string,
  system: string,
  user: string,
  maxTokens: number,
  model = GITHUB_MODELS_DEFAULT_MODEL
): Promise<ChatJsonResult> {
  try {
    return await callOpenAiCompatibleJson({
      url: "https://models.github.ai/inference/chat/completions",
      apiKey,
      model,
      system,
      user,
      maxTokens,
      provider: "githubmodels",
      extraHeaders: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      note: `Powered by GitHub Models (${model}).`,
      includeResponseFormat: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    // Some GitHub Models deployments reject response_format — retry without it.
    if (!/githubmodels API error (400|422)/i.test(message)) throw error;
    return callOpenAiCompatibleJson({
      url: "https://models.github.ai/inference/chat/completions",
      apiKey,
      model,
      system,
      user,
      maxTokens,
      provider: "githubmodels",
      extraHeaders: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      note: `Powered by GitHub Models (${model}).`,
      includeResponseFormat: false,
    });
  }
}

async function callKimiJson(
  apiKey: string,
  system: string,
  user: string,
  maxTokens: number,
  model = KIMI_DEFAULT_MODEL
): Promise<ChatJsonResult> {
  const bases = Array.from(
    new Set([KIMI_API_BASE, "https://api.moonshot.cn/v1", "https://api.moonshot.ai/v1"])
  );
  let lastError: Error | null = null;
  for (const base of bases) {
    try {
      return await callOpenAiCompatibleJson({
        url: `${base}/chat/completions`,
        apiKey,
        model,
        system,
        user,
        maxTokens,
        provider: "kimi",
        note: `Powered by Kimi / Moonshot (${model}).`,
      });
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      // Try next regional endpoint on auth/host mismatch.
      if (!/kimi API error (401|403|404)/i.test(lastError.message)) throw lastError;
    }
  }
  throw lastError || new Error("Kimi API failed");
}

async function callOpenRouterJson(
  apiKey: string,
  system: string,
  user: string,
  maxTokens: number,
  model = OPENROUTER_DEFAULT_MODEL
): Promise<ChatJsonResult> {
  return callOpenAiCompatibleJson({
    url: "https://openrouter.ai/api/v1/chat/completions",
    apiKey,
    model,
    system,
    user,
    maxTokens,
    provider: "openrouter",
    extraHeaders: {
      "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "https://results-academic.vercel.app",
      "X-Title": process.env.OPENROUTER_APP_NAME || "Knowledge Explorer",
    },
    note: `Powered by OpenRouter (${model}).`,
  });
}

async function callDeepSeekJson(
  apiKey: string,
  system: string,
  user: string,
  maxTokens: number,
  model = DEEPSEEK_DEFAULT_MODEL
): Promise<ChatJsonResult> {
  return callOpenAiCompatibleJson({
    url: "https://api.deepseek.com/chat/completions",
    apiKey,
    model,
    system,
    user,
    maxTokens,
    provider: "deepseek",
    note: `Powered by DeepSeek (${model}).`,
  });
}

async function callGeminiJson(
  apiKey: string,
  system: string,
  user: string,
  maxTokens = 900,
  model = GEMINI_FLASH_MODEL
): Promise<ChatJsonResult> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${system}\n\n${user}` }] }],
        generationConfig: {
          temperature: 0.35,
          maxOutputTokens: maxTokens,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errText}`);
  }

  const payload = await res.json();
  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  let data: Record<string, unknown>;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    data = JSON.parse(jsonMatch ? jsonMatch[0] : text);
  } catch {
    data = { raw: text };
  }

  return {
    data,
    provider: "gemini",
    model,
    note: `Powered by Gemini (${model}).`,
  };
}

function buildSiteChannels(
  system: string,
  user: string,
  maxTokens: number,
  tier: "public" | "author"
): Array<{ name: AiProvider; run: () => Promise<ChatJsonResult> }> {
  const channels: Array<{ name: AiProvider; run: () => Promise<ChatJsonResult> }> = [];
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const githubModelsKey = process.env.CONTENT_GITHUB_TOKEN;
  const kimiKey = process.env.KIMI_API_KEY || process.env.MOONSHOT_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const deepSeekKey = process.env.DEEPSEEK_API_KEY;
  const badge = tier === "author" ? "Advanced Default" : "Instant (lowest)";

  if (groqKey) {
    const model = modelsForTier(tier, "groq");
    channels.push({
      name: "groq",
      run: async () => {
        const result = await callGroqWithFallback(groqKey, system, user, maxTokens, model);
        return { ...result, note: `${badge} · Groq (${result.model}).` };
      },
    });
  }
  if (geminiKey) {
    const model = modelsForTier(tier, "gemini");
    channels.push({
      name: "gemini",
      run: async () => {
        const result = await callGeminiJson(geminiKey, system, user, maxTokens, model);
        return { ...result, note: `${badge} · Gemini (${model}).` };
      },
    });
  }
  if (githubModelsKey) {
    const model = modelsForTier(tier, "githubmodels");
    channels.push({
      name: "githubmodels",
      run: async () => {
        const result = await callGithubModelsJson(
          githubModelsKey,
          system,
          user,
          maxTokens,
          model
        );
        return { ...result, note: `${badge} · GitHub Models (${model}).` };
      },
    });
  }
  if (kimiKey) {
    const model = modelsForTier(tier, "kimi");
    channels.push({
      name: "kimi",
      run: async () => {
        const result = await callKimiJson(kimiKey, system, user, maxTokens, model);
        return { ...result, note: `${badge} · Kimi (${model}).` };
      },
    });
  }
  if (openRouterKey) {
    const model = modelsForTier(tier, "openrouter");
    channels.push({
      name: "openrouter",
      run: async () => {
        const result = await callOpenRouterJson(openRouterKey, system, user, maxTokens, model);
        return { ...result, note: `${badge} · OpenRouter (${model}).` };
      },
    });
  }
  if (deepSeekKey) {
    const model = modelsForTier(tier, "deepseek");
    channels.push({
      name: "deepseek",
      run: async () => {
        const result = await callDeepSeekJson(deepSeekKey, system, user, maxTokens, model);
        return { ...result, note: `${badge} · DeepSeek (${model}).` };
      },
    });
  }
  return channels;
}

/**
 * Site public: Instant + lowest caps (default).
 * Site author (SITE_AI_TIER=author): mid versatile models + modestly higher caps.
 * BYOK: mid models + slightly more open caps.
 */
export async function runChatJson(options: {
  system: string;
  user: string;
  maxTokens?: number;
  userApiKey?: string;
  provider?: AiProvider;
  /** Official site model when not using BYOK. Default: auto cascade. */
  siteModel?: SiteModelChoice;
}): Promise<ChatJsonResult> {
  const userKey = options.userApiKey?.trim();
  const tier: CloudSpendTier = userKey ? "byok" : await resolveSiteCloudTier();
  const maxTokens = capMaxTokens(options.maxTokens, tier);

  if (userKey) {
    const provider = options.provider || "groq";
    const model = modelsForTier("byok", provider);
    if (provider === "gemini") {
      const result = await callGeminiJson(userKey, options.system, options.user, maxTokens, model);
      return {
        ...result,
        note: `Your API (mid-tier) · Gemini (${model}) — personal quota, not the shared Instant pool.`,
      };
    }
    if (provider === "githubmodels") {
      const result = await callGithubModelsJson(
        userKey,
        options.system,
        options.user,
        maxTokens,
        model
      );
      return {
        ...result,
        note: `Your API (mid-tier) · GitHub Models (${model}).`,
      };
    }
    if (provider === "kimi") {
      const result = await callKimiJson(userKey, options.system, options.user, maxTokens, model);
      return {
        ...result,
        note: `Your API (mid-tier) · Kimi (${model}).`,
      };
    }
    if (provider === "openrouter") {
      const result = await callOpenRouterJson(
        userKey,
        options.system,
        options.user,
        maxTokens,
        model
      );
      return {
        ...result,
        note: `Your API (mid-tier) · OpenRouter (${model}).`,
      };
    }
    if (provider === "deepseek") {
      const result = await callDeepSeekJson(
        userKey,
        options.system,
        options.user,
        maxTokens,
        model
      );
      return {
        ...result,
        note: `Your API (mid-tier) · DeepSeek (${model}).`,
      };
    }
    const result = await callGroqWithFallback(
      userKey,
      options.system,
      options.user,
      maxTokens,
      model
    );
    return {
      ...result,
      note: `Your API (mid-tier) · Groq (${result.model}).`,
    };
  }

  // Default website API (Instant or Advanced Default from Manage).
  const siteTier = tier === "author" ? "author" : "public";
  const channels = buildSiteChannels(options.system, options.user, maxTokens, siteTier);
  const siteModel = options.siteModel || "auto";

  if (siteModel !== "auto") {
    const chosen = channels.find((channel) => channel.name === siteModel);
    if (!chosen) {
      throw new Error(
        `Official model “${siteModel}” is not configured on this site (missing API key). Pick Auto or another model.`
      );
    }
    return chosen.run();
  }

  const errors: string[] = [];
  for (const channel of channels) {
    try {
      return await channel.run();
    } catch (e) {
      errors.push(`${channel.name}: ${e instanceof Error ? e.message : "failed"}`);
    }
  }

  throw new Error(
    errors.length
      ? `All AI channels failed: ${errors.join(" | ")}`
      : "No site AI keys configured (CONTENT_GITHUB_TOKEN / KIMI_API_KEY / GROQ / GEMINI / OPENROUTER / DEEPSEEK)."
  );
}

export function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(String).map((s) => s.trim()).filter(Boolean);
}

export function parseAiProvider(value: unknown): AiProvider {
  if (
    value === "gemini" ||
    value === "githubmodels" ||
    value === "kimi" ||
    value === "openrouter" ||
    value === "deepseek" ||
    value === "groq"
  ) {
    return value;
  }
  return "groq";
}

export function parseSiteModelChoice(value: unknown): SiteModelChoice {
  if (value === "auto" || value === undefined || value === null || value === "") return "auto";
  return parseAiProvider(value);
}
