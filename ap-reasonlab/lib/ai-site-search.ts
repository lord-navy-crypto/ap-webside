import { concepts } from "@/data/content";
import { formulas } from "@/data/formulas";
import { questionnaires } from "@/data/questionnaires";
import type { ManagedContent } from "@/lib/managed-types";

export type AiSiteSearchHit = {
  type: string;
  title: string;
  subject: string;
  detail: string;
  score: number;
};

function tokenize(raw: string): string[] {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff+$/%.-]+/gi, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 2)
    .slice(0, 24);
}

function scoreText(haystack: string, tokens: string[]): number {
  const text = haystack.toLowerCase();
  if (!text || tokens.length === 0) return 0;
  let score = 0;
  for (const token of tokens) {
    if (text.includes(token)) score += 1;
  }
  return score;
}

function clip(text: string, max = 420): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max - 1)}…`;
}

/**
 * Search Knowledge Explorer built-in + managed study content.
 * This is site search only — not the open web. No LLM API cost.
 */
export function searchKnowledgeExplorerContent(
  query: string,
  managed?: Partial<ManagedContent> | null,
  limit = 5
): AiSiteSearchHit[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];

  const hits: AiSiteSearchHit[] = [];

  for (const item of concepts) {
    const titleScore = scoreText(item.title, tokens) * 3;
    const bodyScore = scoreText(
      `${item.subject} ${item.summary} ${(item.keyPoints || []).join(" ")}`,
      tokens
    );
    const score = titleScore + bodyScore;
    if (score > 0) {
      hits.push({
        type: "concept",
        title: item.title,
        subject: item.subject,
        detail: clip(item.summary),
        score,
      });
    }
  }

  for (const item of formulas) {
    const titleScore = scoreText(item.name, tokens) * 3;
    const bodyScore = scoreText(
      `${item.subject} ${item.expression || ""} ${item.content || ""} ${item.unit || ""}`,
      tokens
    );
    const score = titleScore + bodyScore;
    if (score > 0) {
      hits.push({
        type: "formula",
        title: item.name,
        subject: item.subject,
        detail: clip(`${item.expression || ""} ${item.content || ""}`.trim()),
        score,
      });
    }
  }

  for (const item of questionnaires) {
    const titleScore = scoreText(item.title, tokens) * 3;
    const bodyScore = scoreText(`${item.subject} ${item.description || ""}`, tokens);
    const score = titleScore + bodyScore;
    if (score > 0) {
      hits.push({
        type: "practice",
        title: item.title,
        subject: item.subject,
        detail: clip(item.description || ""),
        score,
      });
    }
  }

  const subjects = managed?.subjects || [];
  const subjectName = (id: string) =>
    subjects.find((subject) => subject.id === id)?.name || id;

  for (const item of managed?.contentItems || []) {
    if (item.deletedAt || item.status !== "published") continue;
    const name = subjectName(item.subjectId);
    const titleScore = scoreText(item.title, tokens) * 3;
    const bodyScore = scoreText(`${name} ${item.type} ${item.content}`, tokens);
    const score = titleScore + bodyScore;
    if (score > 0) {
      hits.push({
        type: item.type || "content",
        title: item.title,
        subject: name,
        detail: clip(item.content),
        score,
      });
    }
  }

  for (const item of managed?.concepts || []) {
    const titleScore = scoreText(item.title, tokens) * 3;
    const bodyScore = scoreText(`${item.subject || ""} ${item.summary || ""}`, tokens);
    const score = titleScore + bodyScore;
    if (score > 0) {
      hits.push({
        type: "concept",
        title: item.title,
        subject: item.subject || "AP",
        detail: clip(item.summary || ""),
        score,
      });
    }
  }

  for (const item of managed?.formulas || []) {
    const titleScore = scoreText(item.name, tokens) * 3;
    const bodyScore = scoreText(`${item.subject || ""} ${item.content || ""}`, tokens);
    const score = titleScore + bodyScore;
    if (score > 0) {
      hits.push({
        type: "formula",
        title: item.name,
        subject: item.subject || "AP",
        detail: clip(item.content || ""),
        score,
      });
    }
  }

  for (const item of managed?.documents || []) {
    const titleScore = scoreText(item.title, tokens) * 2;
    const bodyScore = scoreText(item.content || "", tokens);
    const score = titleScore + bodyScore;
    if (score > 0) {
      hits.push({
        type: "document",
        title: item.title,
        subject: item.area || "site",
        detail: clip(item.content || ""),
        score,
      });
    }
  }

  return hits.sort((a, b) => b.score - a.score).slice(0, Math.max(1, Math.min(limit, 8)));
}

export function formatAiSiteSearchContext(hits: AiSiteSearchHit[]): string {
  if (hits.length === 0) return "";
  const lines = hits.map(
    (hit, index) =>
      `${index + 1}. [${hit.type}] ${hit.title} (${hit.subject})\n${hit.detail}`
  );
  return `Knowledge Explorer site search results (use only if relevant; prefer teaching over copying):\n${lines.join("\n\n")}`;
}

export function appendAiSiteContext(userPrompt: string, context: string): string {
  const trimmed = context.trim();
  if (!trimmed) return userPrompt;
  return `${userPrompt}\n\n${trimmed}`;
}
