/**
 * Shared AI client — forced Instant / Flash only (no Versatile).
 * Groq Instant first, Gemini Flash as fallback for site keys.
 */

export const GROQ_INSTANT_MODEL = "llama-3.1-8b-instant";
export const GEMINI_FLASH_MODEL = "gemini-2.0-flash";

export type AiProvider = "groq" | "gemini";

export type ChatJsonResult = {
  data: Record<string, unknown>;
  provider: AiProvider;
  model: string;
  note: string;
};

async function callGroqJson(
  apiKey: string,
  system: string,
  user: string,
  maxTokens: number
): Promise<ChatJsonResult> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_INSTANT_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.35,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq API error ${res.status}: ${errText}`);
  }

  const payload = await res.json();
  const text = payload?.choices?.[0]?.message?.content || "";
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  return {
    data,
    provider: "groq",
    model: GROQ_INSTANT_MODEL,
    note: `Powered by Groq Instant (${GROQ_INSTANT_MODEL}).`,
  };
}

async function callGeminiJson(
  apiKey: string,
  system: string,
  user: string
): Promise<ChatJsonResult> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_FLASH_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
 * Site default: Groq Instant → Gemini Flash.
 * BYOK: only the provider the user selected (still Instant/Flash).
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
    const result = await callGroqJson(userKey, options.system, options.user, maxTokens);
    return {
      ...result,
      note: `Your own Groq key · Instant (${GROQ_INSTANT_MODEL}) — usually stronger quota and fewer shared limits.`,
    };
  }

  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const errors: string[] = [];

  if (groqKey) {
    try {
      const result = await callGroqJson(groqKey, options.system, options.user, maxTokens);
      return {
        ...result,
        note: `Site default · Groq Instant (${GROQ_INSTANT_MODEL}).`,
      };
    } catch (e) {
      errors.push(e instanceof Error ? e.message : "Groq failed");
    }
  }

  if (geminiKey) {
    try {
      const result = await callGeminiJson(geminiKey, options.system, options.user);
      return {
        ...result,
        note: `Site fallback · Gemini Flash (${GEMINI_FLASH_MODEL}).`,
      };
    } catch (e) {
      errors.push(e instanceof Error ? e.message : "Gemini failed");
    }
  }

  throw new Error(
    errors.length
      ? `All AI channels failed: ${errors.join(" | ")}`
      : "No site AI keys configured (GROQ_API_KEY / GEMINI_API_KEY)."
  );
}

export function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(String).map((s) => s.trim()).filter(Boolean);
}
