/**
 * Cloud spend tiers for Knowledge Explorer AI.
 *
 * - public: website shared Instant keys — lowest limits (default)
 * - author / Advanced Default: mid versatile models (same class as BYOK), modestly higher tokens
 * - byok: user-pasted key — mid models, slightly more open (not unlimited)
 *
 * Local AI (browser) is separate and has no product-side token caps.
 *
 * Manage → Advanced Default toggles the website Default API between Instant and Advanced
 * without redeploying env. Env SITE_AI_TIER=author remains a fallback when the Manage
 * flag has never been used / content load fails.
 */

import { loadManagedContent } from "@/lib/managed-store";

export type CloudSpendTier = "public" | "author" | "byok";

const CACHE_TTL_MS = 30_000;

let cached: { tier: "public" | "author"; advancedDefault: boolean; at: number } | null =
  null;

/** Clear cached Manage override (call after saving Advanced Default). */
export function invalidateSiteAiTierCache(): void {
  cached = null;
}

/** Env-only fallback (sync). Prefer resolveSiteCloudTier() in AI routes. */
export function resolveSiteCloudTierFromEnv(): "public" | "author" {
  const raw = (process.env.SITE_AI_TIER || process.env.AUTHOR_AI_TIER || "public")
    .trim()
    .toLowerCase();
  return raw === "author" || raw === "mid" || raw === "standard" ? "author" : "public";
}

/**
 * Resolve Default website API tier.
 * Manage Advanced Default wins when settings load; otherwise env SITE_AI_TIER.
 */
export async function resolveSiteCloudTier(): Promise<"public" | "author"> {
  const status = await getSiteAiTierStatus();
  return status.tier;
}

export async function getSiteAiTierStatus(): Promise<{
  tier: "public" | "author";
  advancedDefault: boolean;
  source: "manage" | "env";
}> {
  const now = Date.now();
  if (cached && now - cached.at < CACHE_TTL_MS) {
    return {
      tier: cached.tier,
      advancedDefault: cached.advancedDefault,
      source: "manage",
    };
  }

  try {
    const content = await loadManagedContent();
    const advancedDefault = Boolean(content.settings?.advancedDefault);
    const tier: "public" | "author" = advancedDefault ? "author" : "public";
    cached = { tier, advancedDefault, at: now };
    return { tier, advancedDefault, source: "manage" };
  } catch {
    const tier = resolveSiteCloudTierFromEnv();
    return {
      tier,
      advancedDefault: tier === "author",
      source: "env",
    };
  }
}

const TOKEN_CAPS: Record<CloudSpendTier, number> = {
  public: 800,
  author: 1600,
  byok: 1800,
};

const TOKEN_DEFAULTS: Record<CloudSpendTier, number> = {
  public: 700,
  author: 1200,
  byok: 1400,
};

export function capMaxTokens(requested: number | undefined, tier: CloudSpendTier): number {
  const base = requested ?? TOKEN_DEFAULTS[tier];
  return Math.max(64, Math.min(base, TOKEN_CAPS[tier]));
}

/** Mid versatile models for Advanced Default / BYOK (not Instant). Overridable via env. */
export function midModelFor(provider: string): string {
  switch (provider) {
    case "groq":
      return (
        process.env.AUTHOR_GROQ_MODEL?.trim() ||
        process.env.BYOK_GROQ_MODEL?.trim() ||
        "llama-3.3-70b-versatile"
      );
    case "gemini":
      return (
        process.env.AUTHOR_GEMINI_MODEL?.trim() ||
        process.env.BYOK_GEMINI_MODEL?.trim() ||
        "gemini-2.0-flash"
      );
    case "githubmodels":
      return (
        process.env.AUTHOR_GITHUB_MODELS_MODEL?.trim() ||
        process.env.GITHUB_MODELS_MODEL?.trim() ||
        "openai/gpt-4o-mini"
      );
    case "kimi":
      return (
        process.env.AUTHOR_KIMI_MODEL?.trim() ||
        process.env.KIMI_MODEL?.trim() ||
        process.env.MOONSHOT_MODEL?.trim() ||
        "moonshot-v1-32k"
      );
    case "openrouter":
      return (
        process.env.AUTHOR_OPENROUTER_MODEL?.trim() ||
        process.env.OPENROUTER_MODEL?.trim() ||
        "meta-llama/llama-3.1-70b-instruct"
      );
    case "deepseek":
      return (
        process.env.AUTHOR_DEEPSEEK_MODEL?.trim() ||
        process.env.DEEPSEEK_MODEL?.trim() ||
        "deepseek-chat"
      );
    default:
      return "llama-3.3-70b-versatile";
  }
}

export function tierLabel(tier: CloudSpendTier): string {
  if (tier === "public") return "Instant (lowest)";
  if (tier === "author") return "Advanced Default";
  return "Your API (Advanced)";
}
