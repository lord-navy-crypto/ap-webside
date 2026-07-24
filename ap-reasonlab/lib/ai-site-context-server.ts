import { getGithubTokenFromCookie } from "@/lib/auth";
import {
  appendAiSiteContext,
  formatAiSiteSearchContext,
  searchKnowledgeExplorerContent,
} from "@/lib/ai-site-search";
import { loadManagedContent, normalizeManagedContent } from "@/lib/managed-store";

export { appendAiSiteContext };

/** Server-side Knowledge Explorer search for AI prompts. No LLM API cost. */
export async function buildServerAiSiteContext(query: string, enabled = true): Promise<string> {
  if (!enabled || query.trim().length < 2) return "";
  try {
    const token = await getGithubTokenFromCookie();
    const managed = normalizeManagedContent(await loadManagedContent(token));
    return formatAiSiteSearchContext(searchKnowledgeExplorerContent(query, managed, 5));
  } catch {
    return "";
  }
}
