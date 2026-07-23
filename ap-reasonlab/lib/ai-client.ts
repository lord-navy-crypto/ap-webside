/**
 * Shared AI client — Instant-class cascade.
 * Site order: Groq → Gemini → GitHub Models → Kimi → OpenRouter → DeepSeek.
 *
 * Owner setup:
 * - CONTENT_GITHUB_TOKEN → GitHub Models AI API
 * - KIMI_API_KEY (or MOONSHOT_API_KEY) → Kimi / Moonshot AI
 * - GITHUB_TOKEN → repo Save/publish only (see lib/managed-store.ts)
 */

export const GROQ_INSTANT_MODEL = "llama-3.1-8b-instant";
export const GROQ_FALLBACK_MODEL = "openai/gpt-oss-20b";
export const GEMINI_FLASH_MODEL = "gemini-2.0-flash";
export const OPENROUTER_DEFAULT_MODEL =
  process.env.OPENROUTER_MODEL?.trim() || "meta-llama/llama-3.1-8b-instruct";
export const DEEPSEEK_DEFAULT_MODEL =
  process.env.DEEPSEEK_MODEL?.trim() || "deepseek-chat";
export const GITHUB_MODELS_DEFAULT_MODEL =
  process.env.GITHUB_MODELS_MODEL?.trim() || "openai/gpt-4o-mini";
export const KIMI_DEFAULT_MODEL =
  process.env.KIMI_MODEL?.trim() || process.env.MOONSHOT_MODEL?.trim() || "moonshot-v1-8k";
export const KIMI_API_BASE = (
  process.env.KIMI_API_BASE?.trim() ||
  process.env.MOONSHOT_API_BASE?.trim() ||
  "https://api.moonshot.cn/v1"
).replace(/\/$/, "");

export type AiProvider =
  | "groq"
  | "gemini"
  | "githubmodels"
  | "kimi"
  | "openrouter"
  | "deepseek";

export type ChatJsonResult = {
  data: Record<string, unknown>;
  provider: AiProvider;
  model: string;
  note: string;
};

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
  maxTokens: number
): Promise<ChatJsonResult> {
  try {
    return await callGroqJson(apiKey, system, user, maxTokens, GROQ_INSTANT_MODEL);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!/groq API error (400|404|410)/i.test(message)) throw error;
    return callGroqJson(apiKey, system, user, maxTokens, GROQ_FALLBACK_MODEL);
  }
}

async function callGithubModelsJson(
  apiKey: string,
  system: string,
  user: string,
  maxTokens: number
): Promise<ChatJsonResult> {
  try {
    return await callOpenAiCompatibleJson({
      url: "https://models.github.ai/inference/chat/completions",
      apiKey,
      model: GITHUB_MODELS_DEFAULT_MODEL,
      system,
      user,
      maxTokens,
      provider: "githubmodels",
      extraHeaders: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      note: `Powered by GitHub Models (${GITHUB_MODELS_DEFAULT_MODEL}).`,
      includeResponseFormat: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    // Some GitHub Models deployments reject response_format — retry without it.
    if (!/githubmodels API error (400|422)/i.test(message)) throw error;
    return callOpenAiCompatibleJson({
      url: "https://models.github.ai/inference/chat/completions",
      apiKey,
      model: GITHUB_MODELS_DEFAULT_MODEL,
      system,
      user,
      maxTokens,
      provider: "githubmodels",
      extraHeaders: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      note: `Powered by GitHub Models (${GITHUB_MODELS_DEFAULT_MODEL}).`,
      includeResponseFormat: false,
    });
  }
}

async function callKimiJson(
  apiKey: string,
  system: string,
  user: string,
  maxTokens: number
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
        model: KIMI_DEFAULT_MODEL,
        system,
        user,
        maxTokens,
        provider: "kimi",
        note: `Powered by Kimi / Moonshot (${KIMI_DEFAULT_MODEL}).`,
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
  maxTokens: number
): Promise<ChatJsonResult> {
  return callOpenAiCompatibleJson({
    url: "https://openrouter.ai/api/v1/chat/completions",
    apiKey,
    model: OPENROUTER_DEFAULT_MODEL,
    system,
    user,
    maxTokens,
    provider: "openrouter",
    extraHeaders: {
      "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "https://results-academic.vercel.app",
      "X-Title": process.env.OPENROUTER_APP_NAME || "Results Academic Platform",
    },
    note: `Powered by OpenRouter (${OPENROUTER_DEFAULT_MODEL}).`,
  });
}

async function callDeepSeekJson(
  apiKey: string,
  system: string,
  user: string,
  maxTokens: number
): Promise<ChatJsonResult> {
  return callOpenAiCompatibleJson({
    url: "https://api.deepseek.com/chat/completions",
    apiKey,
    model: DEEPSEEK_DEFAULT_MODEL,
    system,
    user,
    maxTokens,
    provider: "deepseek",
    note: `Powered by DeepSeek (${DEEPSEEK_DEFAULT_MODEL}).`,
  });
}

async function callGeminiJson(
  apiKey: string,
  system: string,
  user: string
): Promise<ChatJsonResult> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_FLASH_MODEL}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${system}\n\n${user}` }] }],
        generationConfig: {
          temperature: 0.35,
          maxOutputTokens: 900,
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
    model: GEMINI_FLASH_MODEL,
    note: `Powered by Gemini Flash (${GEMINI_FLASH_MODEL}).`,
  };
}

/**
 * Site default: Groq → Gemini → GitHub Models → Kimi → OpenRouter → DeepSeek.
 * BYOK: only the provider the user selected.
 */
export async function runChatJson(options: {
  system: string;
  user: string;
  maxTokens?: number;
  userApiKey?: string;
  provider?: AiProvider;
}): Promise<ChatJsonResult> {
  const maxTokens = options.maxTokens ?? 700;
  const userKey = options.userApiKey?.trim();

  if (userKey) {
    const provider = options.provider || "groq";
    if (provider === "gemini") {
      const result = await callGeminiJson(userKey, options.system, options.user);
      return {
        ...result,
        note: `Your own Gemini key · Flash (${GEMINI_FLASH_MODEL}) — usually stronger quota and fewer shared limits.`,
      };
    }
    if (provider === "githubmodels") {
      const result = await callGithubModelsJson(userKey, options.system, options.user, maxTokens);
      return {
        ...result,
        note: `Your own GitHub Models token · ${GITHUB_MODELS_DEFAULT_MODEL}.`,
      };
    }
    if (provider === "kimi") {
      const result = await callKimiJson(userKey, options.system, options.user, maxTokens);
      return {
        ...result,
        note: `Your own Kimi / Moonshot key · ${KIMI_DEFAULT_MODEL}.`,
      };
    }
    if (provider === "openrouter") {
      const result = await callOpenRouterJson(userKey, options.system, options.user, maxTokens);
      return {
        ...result,
        note: `Your own OpenRouter key · ${OPENROUTER_DEFAULT_MODEL} — more effective personal routing/quota.`,
      };
    }
    if (provider === "deepseek") {
      const result = await callDeepSeekJson(userKey, options.system, options.user, maxTokens);
      return {
        ...result,
        note: `Your own DeepSeek key · ${DEEPSEEK_DEFAULT_MODEL} — stronger personal quota.`,
      };
    }
    const result = await callGroqWithFallback(userKey, options.system, options.user, maxTokens);
    return {
      ...result,
      note: `Your own Groq key · ${result.model} — usually stronger quota and fewer shared limits.`,
    };
  }

  const channels: Array<{ name: string; run: () => Promise<ChatJsonResult> }> = [];
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const githubModelsKey = process.env.CONTENT_GITHUB_TOKEN;
  const kimiKey = process.env.KIMI_API_KEY || process.env.MOONSHOT_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const deepSeekKey = process.env.DEEPSEEK_API_KEY;

  if (groqKey) {
    channels.push({
      name: "groq",
      run: async () => {
        const result = await callGroqWithFallback(groqKey, options.system, options.user, maxTokens);
        return { ...result, note: `Site default · Groq (${result.model}).` };
      },
    });
  }
  if (geminiKey) {
    channels.push({
      name: "gemini",
      run: async () => {
        const result = await callGeminiJson(geminiKey, options.system, options.user);
        return { ...result, note: `Site fallback · Gemini Flash (${GEMINI_FLASH_MODEL}).` };
      },
    });
  }
  if (githubModelsKey) {
    channels.push({
      name: "githubmodels",
      run: async () => {
        const result = await callGithubModelsJson(
          githubModelsKey,
          options.system,
          options.user,
          maxTokens
        );
        return {
          ...result,
          note: `Site · GitHub Models via CONTENT_GITHUB_TOKEN (${GITHUB_MODELS_DEFAULT_MODEL}).`,
        };
      },
    });
  }
  if (kimiKey) {
    channels.push({
      name: "kimi",
      run: async () => {
        const result = await callKimiJson(kimiKey, options.system, options.user, maxTokens);
        return {
          ...result,
          note: `Site · Kimi / Moonshot (${KIMI_DEFAULT_MODEL}).`,
        };
      },
    });
  }
  if (openRouterKey) {
    channels.push({
      name: "openrouter",
      run: async () => {
        const result = await callOpenRouterJson(
          openRouterKey,
          options.system,
          options.user,
          maxTokens
        );
        return {
          ...result,
          note: `Site fallback · OpenRouter (${OPENROUTER_DEFAULT_MODEL}).`,
        };
      },
    });
  }
  if (deepSeekKey) {
    channels.push({
      name: "deepseek",
      run: async () => {
        const result = await callDeepSeekJson(deepSeekKey, options.system, options.user, maxTokens);
        return {
          ...result,
          note: `Site fallback · DeepSeek (${DEEPSEEK_DEFAULT_MODEL}).`,
        };
      },
    });
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
