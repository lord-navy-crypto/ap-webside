/**
 * Cloud spend tiers for Knowledge Explorer AI.
 *
 * - public: website shared Instant keys — lowest limits (default)
 * - author: SITE_AI_TIER=author — mid versatile models, modestly higher tokens
 * - byok: user-pasted key — mid models, slightly more open (not unlimited)
 *
 * Local AI (browser) is separate and has no product-side token caps.
 */

export type CloudSpendTier = "public" | "author" | "byok";

/** Set SITE_AI_TIER=author on the server to use mid-tier models for the website keys. */
export function resolveSiteCloudTier(): "public" | "author" {
  const raw = (process.env.SITE_AI_TIER || process.env.AUTHOR_AI_TIER || "public")
    .trim()
    .toLowerCase();
  return raw === "author" || raw === "mid" || raw === "standard" ? "author" : "public";
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

/** Mid versatile models for author / BYOK (not Instant). Overridable via env. */
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
  if (tier === "public") return "Public Instant (lowest)";
  if (tier === "author") return "Author mid-tier";
  return "Your API (mid-tier)";
}
