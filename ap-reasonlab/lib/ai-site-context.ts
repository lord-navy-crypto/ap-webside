import {
  appendAiSiteContext,
  formatAiSiteSearchContext,
  searchKnowledgeExplorerContent,
} from "@/lib/ai-site-search";

export { appendAiSiteContext, formatAiSiteSearchContext, searchKnowledgeExplorerContent };

/** Client helper: fetch Knowledge Explorer site search context for Local AI prompts. */
export async function fetchAiSiteContext(
  query: string,
  enabled = true
): Promise<{ context: string; note: string }> {
  if (!enabled || query.trim().length < 2) {
    return { context: "", note: "" };
  }
  try {
    const response = await fetch("/api/ai/site-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, enabled: true, limit: 5 }),
    });
    const data = await response.json();
    if (!response.ok) return { context: "", note: "" };
    return {
      context: String(data.context || ""),
      note: String(data.note || ""),
    };
  } catch {
    return { context: "", note: "" };
  }
}
