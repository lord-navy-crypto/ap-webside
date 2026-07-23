import { NextResponse } from "next/server";
import { midModelFor, tierLabel } from "@/lib/ai-tiers";
import { getSiteAiTierStatus } from "@/lib/ai-tiers-managed";

/** Public status for Default website API Instant vs Advanced Default. */
export async function GET() {
  const status = await getSiteAiTierStatus();
  return NextResponse.json({
    advancedDefault: status.advancedDefault,
    tier: status.tier,
    source: status.source,
    label: tierLabel(status.tier),
    advancedModels: {
      groq: midModelFor("groq"),
      gemini: midModelFor("gemini"),
      githubmodels: midModelFor("githubmodels"),
      kimi: midModelFor("kimi"),
      openrouter: midModelFor("openrouter"),
      deepseek: midModelFor("deepseek"),
    },
  });
}
