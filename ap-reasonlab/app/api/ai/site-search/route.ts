import { NextRequest, NextResponse } from "next/server";
import { getGithubTokenFromCookie } from "@/lib/auth";
import {
  formatAiSiteSearchContext,
  searchKnowledgeExplorerContent,
} from "@/lib/ai-site-search";
import { loadManagedContent, normalizeManagedContent } from "@/lib/managed-store";

/**
 * Search Knowledge Explorer study content for AI context.
 * Free of LLM token cost — only reads site data.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const query = String(body.query || body.q || "").trim();
    const enabled = body.enabled !== false;
    const limit = Math.min(8, Math.max(1, Number(body.limit) || 5));

    if (!enabled) {
      return NextResponse.json({ hits: [], context: "", note: "Site search off." });
    }
    if (query.length < 2) {
      return NextResponse.json({ hits: [], context: "", note: "Query too short." });
    }
    if (query.length > 4_000) {
      return NextResponse.json({ error: "Query too long." }, { status: 400 });
    }

    const token = await getGithubTokenFromCookie();
    const managed = normalizeManagedContent(await loadManagedContent(token));
    const hits = searchKnowledgeExplorerContent(query, managed, limit);
    const context = formatAiSiteSearchContext(hits);
    return NextResponse.json({
      hits,
      context,
      note:
        hits.length > 0
          ? `Found ${hits.length} Knowledge Explorer match(es). No LLM search fee.`
          : "No matching site content.",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Site search failed." }, { status: 500 });
  }
}
