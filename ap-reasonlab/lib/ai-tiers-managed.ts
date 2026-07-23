/**
 * Server-only: Manage Advanced Default → Instant vs mid-tier for website keys.
 * Do not import this from client components (uses managed-store / fs).
 */

import { loadManagedContent } from "@/lib/managed-store";
import { resolveSiteCloudTierFromEnv } from "@/lib/ai-tiers";

const CACHE_TTL_MS = 30_000;

let cached: { tier: "public" | "author"; advancedDefault: boolean; at: number } | null =
  null;

export function invalidateSiteAiTierCache(): void {
  cached = null;
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

export async function resolveSiteCloudTier(): Promise<"public" | "author"> {
  const status = await getSiteAiTierStatus();
  return status.tier;
}
