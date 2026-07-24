import { NextRequest, NextResponse } from "next/server";
import {
  parseAiProvider,
  parseSiteModelChoice,
  runChatJson,
} from "@/lib/ai-client";
import { appendAiSiteContext, buildServerAiSiteContext } from "@/lib/ai-site-context-server";
import { getContentEditorLevel, getGithubTokenFromCookie } from "@/lib/auth";
import { canEditContent } from "@/lib/change-codes";
import {
  loadManagedContent,
  normalizeManagedContent,
  saveManagedContent,
  type ManagedContent,
} from "@/lib/managed-store";
import { normalizeAuthoredText } from "@/lib/unicode-math";

type EditableTarget =
  | "content_item"
  | "concept"
  | "formula"
  | "document"
  | "folder"
  | "subject";

const TARGET_FIELDS: Record<EditableTarget, readonly string[]> = {
  content_item: ["title", "content"],
  concept: ["title", "summary"],
  formula: ["name", "content"],
  document: ["title", "content"],
  folder: ["title", "note"],
  subject: ["name", "description"],
};

function isEditableTarget(value: string): value is EditableTarget {
  return Object.prototype.hasOwnProperty.call(TARGET_FIELDS, value);
}

function findTarget(content: ManagedContent, target: EditableTarget, id: string) {
  if (target === "content_item") return content.contentItems.find((item) => item.id === id);
  if (target === "concept") return content.concepts.find((item) => item.id === id);
  if (target === "formula") return content.formulas.find((item) => item.id === id);
  if (target === "document") return content.documents.find((item) => item.id === id);
  if (target === "folder") return content.folders.find((item) => item.id === id);
  return content.subjects.find((item) => item.id === id);
}

export async function POST(req: NextRequest) {
  try {
    if (!canEditContent(await getContentEditorLevel())) {
      return NextResponse.json(
        { error: "Unlock with the content change code first." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const operation = String(body.operation || "generate");

    if (operation === "generate") {
      const source = String(body.source || "").trim();
      const action = String(body.action || "rewrite").slice(0, 80);
      const instruction = String(body.instruction || "").trim().slice(0, 2_000);
      if (!source || source.length > 60_000) {
        return NextResponse.json(
          { error: "Source must contain 1–60,000 characters." },
          { status: 400 }
        );
      }

      const result = await runChatJson({
        system:
          "You are Knowledge Explorer AI Developer, a content-only website manager assistant. Preserve facts, valid Markdown, Unicode, and LaTeX. Never propose or output secrets, authentication changes, API keys, payment code, database migrations, deployment configuration, or arbitrary server-file edits. Return JSON with proposal and summary. The proposal must contain only the replacement content, not commentary.",
        user: appendAiSiteContext(
          `Operation: ${action}
Additional instruction: ${instruction || "(none)"}

SOURCE:
${source}

Return {"proposal":"...","summary":"one short description of the proposed change"}.`,
          await buildServerAiSiteContext(
            `${action}\n${instruction}\n${source.slice(0, 2_000)}`,
            body.siteSearch !== false
          )
        ),
        maxTokens: 1_200,
        userApiKey: String(body.userApiKey || "").trim() || undefined,
        provider: parseAiProvider(body.provider),
        siteModel: parseSiteModelChoice(body.siteModel),
      });

      const proposal = String(result.data.proposal || result.data.raw || "").trim();
      if (!proposal) {
        return NextResponse.json({ error: "The selected AI returned no proposal." }, { status: 502 });
      }
      return NextResponse.json({
        proposal,
        summary: String(result.data.summary || "AI-generated content proposal."),
        provider: result.provider,
        model: result.model,
        note: result.note,
      });
    }

    if (operation === "apply") {
      const target = String(body.target || "");
      const id = String(body.id || "");
      const field = String(body.field || "");
      const original = String(body.original ?? "");
      const proposal = normalizeAuthoredText(String(body.proposal || "")).slice(0, 200_000);
      const action = String(body.action || "edit").replace(/[^a-z0-9 _-]/gi, "").slice(0, 50);

      if (!isEditableTarget(target) || !TARGET_FIELDS[target].includes(field)) {
        return NextResponse.json({ error: "That website field is not AI-editable." }, { status: 400 });
      }
      if (!id || !proposal.trim()) {
        return NextResponse.json({ error: "Target and proposal are required." }, { status: 400 });
      }

      const token = await getGithubTokenFromCookie();
      const current = normalizeManagedContent(await loadManagedContent(token));
      const item = findTarget(current, target, id) as Record<string, unknown> | undefined;
      if (!item) return NextResponse.json({ error: "Selected website item no longer exists." }, { status: 404 });

      const liveValue = String(item[field] ?? "");
      if (liveValue !== original) {
        return NextResponse.json(
          {
            error:
              "This content changed after the AI preview was generated. Reload it before applying so a newer edit is not overwritten.",
          },
          { status: 409 }
        );
      }

      item[field] = proposal;
      if ("updatedAt" in item) item.updatedAt = Date.now();
      if (target === "concept") {
        const topic = current.topics.find((entry) => entry.id === id);
        if (topic) {
          if (field === "title") topic.title = proposal.slice(0, 160);
          if (field === "summary") topic.summary = proposal;
        }
      }

      const saved = await saveManagedContent(
        current,
        token,
        `AI Developer: ${action || "edit"} ${target} ${id}`.slice(0, 180)
      );
      return NextResponse.json({ ok: true, mode: saved.mode, content: current });
    }

    return NextResponse.json({ error: "Unknown AI Developer operation." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI Developer request failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
