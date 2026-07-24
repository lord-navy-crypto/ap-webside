import { NextRequest, NextResponse } from "next/server";
import {
  canEditContent,
  resolveChangeLevel,
} from "@/lib/change-codes";
import { getContentEditorLevel, getGithubTokenFromCookie, setGithubTokenCookie } from "@/lib/auth";
import {
  loadManagedContent,
  saveManagedContent,
  looksLikeGithubPat,
  sanitizeGithubToken,
  normalizeManagedContent,
  uid,
  type ManagedContent,
} from "@/lib/managed-store";
import { subjectSlug } from "@/data/ap-catalog";
import type { QuestionFormat, QuestionnaireItem } from "@/lib/types";
import { normalizeAuthoredText } from "@/lib/unicode-math";

const forumWriteTimes = new Map<string, number>();

function forumRateLimited(req: NextRequest): boolean {
  const client = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const previous = forumWriteTimes.get(client) || 0;
  forumWriteTimes.set(client, now);
  return now - previous < 8_000;
}

async function tokenFrom(body: { githubToken?: string }) {
  const t = sanitizeGithubToken(body.githubToken);
  if (t) {
    if (!looksLikeGithubPat(t)) {
      // Ignore content-change-code / junk pasted into the GitHub token field.
      return undefined;
    }
    await setGithubTokenCookie(t);
    return t;
  }
  const fromCookie = await getGithubTokenFromCookie();
  if (fromCookie && looksLikeGithubPat(fromCookie)) return fromCookie;
  return undefined;
}

export async function GET(req: NextRequest) {
  const token = await getGithubTokenFromCookie();
  const content = await loadManagedContent(token);
  const area = req.nextUrl.searchParams.get("area")?.trim() || "";
  const space = req.nextUrl.searchParams.get("space")?.trim() || "";

  // Optional scope: return only one area+folder bucket so panels stay separate.
  if (area) {
    const spaceKey = space || "_root";
    const inBucket = (item: { area?: string; space?: string }) => {
      if (!item.area && !item.space) {
        // Legacy unscoped rows only surface under materials/_root
        return area === "materials" && spaceKey === "_root";
      }
      return item.area === area && (item.space || "_root") === spaceKey;
    };

    return NextResponse.json({
      concepts:
        spaceKey === "_root"
          ? (content.concepts || []).filter((c) => !c.subject || c.subject === "_root")
          : spaceKey.startsWith("folder:")
            ? (content.concepts || []).filter(
                (c) => c.subject === spaceKey || c.subject === space
              )
            : (content.concepts || []).filter((c) => c.subject === spaceKey),
      formulas:
        spaceKey === "_root"
          ? []
          : (content.formulas || []).filter((f) => f.subject === spaceKey),
      documents: (content.documents || []).filter(inBucket),
      files: (content.files || []).filter(inBucket),
      folders: (content.folders || []).filter(
        (f) => f.area === area && (f.space || "_root") === spaceKey
      ),
      topics: (content.topics || []).filter((t) => {
        if (spaceKey === "_root") return !t.subject || t.subject === "_root";
        return t.subject === spaceKey || t.space === spaceKey;
      }),
      questionnaires:
        spaceKey === "_root"
          ? content.questionnaires || []
          : (content.questionnaires || []).filter((q) => q.subject === spaceKey),
      subjects: content.subjects || [],
      members: content.members || [],
      forumPosts: area === "forum" ? content.forumPosts || [] : undefined,
      updatedAt: content.updatedAt,
      scoped: { area, space: spaceKey },
    });
  }

  return NextResponse.json(content);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body.action || "");
    const item = body.item || {};
    const publicMaterialsContribution =
      body.publicContribution === true &&
      ["add_document", "add_file", "add_folder"].includes(action) &&
      String(item.area || "") === "materials";
    const publicForumContribution = ["add_forum_post", "add_forum_reply"].includes(action);
    if (publicForumContribution && forumRateLimited(req)) {
      return NextResponse.json({ error: "Please wait a few seconds before posting again" }, { status: 429 });
    }
    const levelFromCode = resolveChangeLevel(body.changeCode);
    const levelFromSession = await getContentEditorLevel();
    const level = levelFromCode || levelFromSession;
    if (!publicMaterialsContribution && !publicForumContribution && !canEditContent(level)) {
      return NextResponse.json(
        {
          error:
            "Editor not unlocked. Open /login and enter the content change code once, then save again.",
        },
        { status: 401 }
      );
    }

    const token = await tokenFrom(body);
    const current: ManagedContent = normalizeManagedContent(await loadManagedContent(token));

    if (action === "add_forum_post") {
      const author = String(item.author || "").trim();
      const title = String(item.title || "").trim();
      const postBody = String(item.body || "").trim();
      if (author.length < 2 || author.length > 40) {
        return NextResponse.json({ error: "Display name must be 2–40 characters" }, { status: 400 });
      }
      if (!title || title.length > 120) {
        return NextResponse.json({ error: "Title must be 1–120 characters" }, { status: 400 });
      }
      if (!postBody || postBody.length > 8_000) {
        return NextResponse.json({ error: "Post must be 1–8,000 characters" }, { status: 400 });
      }
      current.forumPosts.unshift({
        id: uid("forum-post"),
        author,
        title,
        body: postBody,
        createdAt: Date.now(),
        replies: [],
      });
    } else if (action === "add_forum_reply") {
      const author = String(item.author || "").trim();
      const replyBody = String(item.body || "").trim();
      const post = current.forumPosts.find((entry) => entry.id === String(item.postId || ""));
      if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
      if (author.length < 2 || author.length > 40) {
        return NextResponse.json({ error: "Display name must be 2–40 characters" }, { status: 400 });
      }
      if (!replyBody || replyBody.length > 4_000) {
        return NextResponse.json({ error: "Reply must be 1–4,000 characters" }, { status: 400 });
      }
      if (!Array.isArray(post.replies)) post.replies = [];
      post.replies.push({ id: uid("forum-reply"), author, body: replyBody, createdAt: Date.now() });
    } else if (action === "add_subject") {
      const item = body.item || {};
      const name = String(item.title || item.name || item.subject || "").trim();
      if (!name) return NextResponse.json({ error: "subject name required" }, { status: 400 });
      const slug = subjectSlug(String(item.slug || name));
      if (current.subjects.some((subject) => subject.slug === slug || subject.name === name)) {
        // Idempotent for folder UX: already exists is OK
        // still return success below
      } else {
        current.subjects.push({
          id: uid("subject"),
          slug,
          name,
          shortName: String(item.shortName || name.replace(/^AP /, "")),
          description: String(item.description || ""),
          icon: String(item.icon || "◇"),
          color: String(item.color || "blue"),
          order: Number.isFinite(Number(item.order)) ? Number(item.order) : current.subjects.length,
          enabled: item.enabled !== false,
          createdAt: Date.now(),
        });
      }
    } else if (action === "add_unit") {
      const item = body.item || {};
      if (!item.subjectId || !item.title) {
        return NextResponse.json({ error: "subject and unit title required" }, { status: 400 });
      }
      current.units.push({
        id: uid("unit"),
        subjectId: String(item.subjectId),
        title: String(item.title),
        description: item.description ? String(item.description) : undefined,
        order: Number.isFinite(Number(item.order)) ? Number(item.order) : current.units.length,
        enabled: item.enabled !== false,
        createdAt: Date.now(),
      });
    } else if (action === "add_content_item") {
      const item = body.item || {};
      if (!item.subjectId || !item.title || !item.type) {
        return NextResponse.json({ error: "subject, type, and title required" }, { status: 400 });
      }
      const allowedTypes = ["concept", "formula", "practice", "document", "file", "folder"];
      if (!allowedTypes.includes(String(item.type))) {
        return NextResponse.json({ error: "Unknown content type" }, { status: 400 });
      }
      current.contentItems.unshift({
        id: uid("content"),
        subjectId: String(item.subjectId),
        unitId: item.unitId ? String(item.unitId) : undefined,
        type: String(item.type) as "concept" | "formula" | "practice" | "document" | "file" | "folder",
        title: String(item.title),
        content: normalizeAuthoredText(String(item.content || "")).slice(0, 200_000),
        tags: Array.isArray(item.tags)
          ? item.tags.map(String)
          : String(item.tags || "").split(",").map((tag) => tag.trim()).filter(Boolean),
        difficulty: ["intro", "standard", "challenge"].includes(String(item.difficulty))
          ? item.difficulty
          : "standard",
        source: item.source ? String(item.source) : undefined,
        status: item.status === "draft" ? "draft" : "published",
        order: Number.isFinite(Number(item.order)) ? Number(item.order) : 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    } else if (action === "update") {
      const target = String(body.target || "");
      const id = String(body.id || "");
      const update = body.item || {};
      const text = (value: unknown, limit = 200_000) =>
        normalizeAuthoredText(String(value ?? "")).slice(0, limit);
      if (!id) return NextResponse.json({ error: "Item id required" }, { status: 400 });

      if (target === "content_item") {
        const found = current.contentItems.find((entry) => entry.id === id);
        if (!found) return NextResponse.json({ error: "Content item not found" }, { status: 404 });
        if (update.title !== undefined) found.title = text(update.title, 160);
        if (update.content !== undefined) found.content = text(update.content);
        found.updatedAt = Date.now();
      } else if (target === "concept" || target === "topic") {
        const found = current.concepts.find((entry) => entry.id === id);
        if (!found) return NextResponse.json({ error: "Concept not found" }, { status: 404 });
        if (update.title !== undefined) found.title = text(update.title, 160);
        if (update.summary !== undefined) found.summary = text(update.summary);
        const topic = current.topics.find((entry) => entry.id === id);
        if (topic) {
          topic.title = found.title;
          topic.summary = found.summary;
        }
      } else if (target === "formula") {
        const found = current.formulas.find((entry) => entry.id === id);
        if (!found) return NextResponse.json({ error: "Formula not found" }, { status: 404 });
        if (update.name !== undefined || update.title !== undefined) found.name = text(update.name ?? update.title, 160);
        if (update.content !== undefined) found.content = text(update.content);
      } else if (target === "document") {
        const found = current.documents.find((entry) => entry.id === id);
        if (!found) return NextResponse.json({ error: "Document not found" }, { status: 404 });
        if (update.title !== undefined) found.title = text(update.title, 160);
        if (update.content !== undefined) found.content = text(update.content);
        if (update.category !== undefined) found.category = text(update.category, 80);
        if (update.area !== undefined) found.area = String(update.area).slice(0, 80) || undefined;
        if (update.space !== undefined) found.space = String(update.space).slice(0, 160) || undefined;
        found.updatedAt = Date.now();
      } else if (target === "file") {
        const found = current.files.find((entry) => entry.id === id);
        if (!found) return NextResponse.json({ error: "File not found" }, { status: 404 });
        if (update.name !== undefined) found.name = text(update.name, 200);
        if (update.note !== undefined) found.note = text(update.note, 2_000);
        if (update.area !== undefined) found.area = String(update.area).slice(0, 80) || undefined;
        if (update.space !== undefined) found.space = String(update.space).slice(0, 160) || undefined;
        if (update.dataUrl !== undefined) {
          if (String(update.dataUrl).length > 1_500_000) return NextResponse.json({ error: "Replacement file is too large" }, { status: 400 });
          found.dataUrl = String(update.dataUrl);
          found.mime = text(update.mime || "application/octet-stream", 120);
          found.uploadedAt = Date.now();
        }
      } else if (target === "folder") {
        const found = current.folders.find((entry) => entry.id === id);
        if (!found) return NextResponse.json({ error: "Folder not found" }, { status: 404 });
        if (update.title !== undefined) found.title = text(update.title, 160);
        if (update.note !== undefined) found.note = text(update.note, 2_000);
      } else if (target === "questionnaire") {
        const found = current.questionnaires.find((entry) => entry.id === id);
        if (!found) return NextResponse.json({ error: "Practice set not found" }, { status: 404 });
        if (update.title !== undefined) found.title = text(update.title, 160);
        if (update.description !== undefined) found.description = text(update.description, 20_000);
      } else if (target === "subject") {
        const found = current.subjects.find((entry) => entry.id === id);
        if (!found) return NextResponse.json({ error: "Subject not found" }, { status: 404 });
        if (update.name !== undefined || update.title !== undefined) found.name = text(update.name ?? update.title, 160);
        if (update.description !== undefined) found.description = text(update.description, 2_000);
      } else if (target === "member") {
        const found = current.members.find((entry) => entry.id === id);
        if (!found) return NextResponse.json({ error: "Member not found" }, { status: 404 });
        if (update.name !== undefined || update.title !== undefined) found.name = text(update.name ?? update.title, 160);
        if (update.note !== undefined) found.note = text(update.note, 2_000);
      } else {
        return NextResponse.json({ error: "Unknown update target" }, { status: 400 });
      }
    } else if (action === "set_content_status") {
      const target = current.contentItems.find((item) => item.id === String(body.id || ""));
      if (!target) return NextResponse.json({ error: "Content item not found" }, { status: 404 });
      target.status = body.status === "draft" ? "draft" : "published";
      target.updatedAt = Date.now();
    } else if (action === "restore_content_item") {
      const target = current.contentItems.find((item) => item.id === String(body.id || ""));
      if (!target) return NextResponse.json({ error: "Content item not found" }, { status: 404 });
      delete target.deletedAt;
      target.updatedAt = Date.now();
    } else if (action === "restore_recycle") {
      const entryId = String(body.id || "");
      const entry = (current.recycleBin || []).find((item) => item.id === entryId);
      if (!entry) return NextResponse.json({ error: "Recycle item not found" }, { status: 404 });
      const payload = entry.payload as Record<string, unknown>;
      if (entry.target === "file") current.files.unshift(payload as never);
      else if (entry.target === "document") current.documents.unshift(payload as never);
      else if (entry.target === "folder") current.folders.unshift(payload as never);
      else if (entry.target === "concept" || entry.target === "topic") {
        current.concepts.unshift(payload as never);
        if (entry.target === "topic") {
          current.topics.unshift({
            id: String(payload.id),
            title: String(payload.title || ""),
            subject: String(payload.subject || ""),
            summary: String(payload.summary || ""),
            createdAt: Date.now(),
          });
        }
      } else if (entry.target === "formula") current.formulas.unshift(payload as never);
      else if (entry.target === "questionnaire") current.questionnaires.unshift(payload as never);
      else if (entry.target === "member") current.members.unshift(payload as never);
      else if (entry.target === "content_item") {
        const item = current.contentItems.find((c) => c.id === String(payload.id || ""));
        if (item) delete item.deletedAt;
        else current.contentItems.unshift(payload as never);
      }
      current.recycleBin = (current.recycleBin || []).filter((item) => item.id !== entryId);
    } else if (action === "purge_recycle") {
      const entryId = String(body.id || "");
      if (!entryId) {
        current.recycleBin = [];
      } else {
        current.recycleBin = (current.recycleBin || []).filter((item) => item.id !== entryId);
      }
    } else if (action === "purge_content_item") {
      const id = String(body.id || "");
      current.contentItems = current.contentItems.filter((item) => item.id !== id);
      current.recycleBin = (current.recycleBin || []).filter((entry) => {
        const payload = entry.payload as { id?: string };
        return !(entry.target === "content_item" && payload?.id === id);
      });
    } else if (action === "move_content_item") {
      const target = current.contentItems.find((item) => item.id === String(body.id || ""));
      if (!target) return NextResponse.json({ error: "Content item not found" }, { status: 404 });
      target.order = Number(body.order || 0);
      target.updatedAt = Date.now();
    } else if (action === "add_files") {
      const files = Array.isArray(body.items) ? body.items : [];
      if (files.length === 0 || files.length > 10) {
        return NextResponse.json({ error: "Choose between 1 and 10 files" }, { status: 400 });
      }
      for (const item of files) {
        if (!item.name || !item.dataUrl || String(item.dataUrl).length > 1_500_000) {
          return NextResponse.json({ error: "Each file needs a name and must stay under ~1MB" }, { status: 400 });
        }
        current.files.unshift({
          id: uid("m-file"),
          name: String(item.name),
          mime: String(item.mime || "application/octet-stream"),
          dataUrl: String(item.dataUrl),
          note: item.note ? String(item.note) : undefined,
          uploadedAt: Date.now(),
          uploadedBy: "change-code",
          area: item.area ? String(item.area) : undefined,
          space: item.space ? String(item.space) : undefined,
        });
      }
    } else if (action === "add_concept" || action === "add_topic") {
      const item = body.item || {};
      if (!item.title || !item.subject) {
        return NextResponse.json({ error: "title and subject required" }, { status: 400 });
      }
      const conceptId = uid(action === "add_topic" ? "m-topic" : "m-concept");
      current.concepts.push({
        id: conceptId,
        title: String(item.title),
        subject: String(item.subject),
        summary: normalizeAuthoredText(String(item.summary || "")),
        keyPoints: Array.isArray(item.keyPoints) ? item.keyPoints.map(String) : [],
        commonMistakes: Array.isArray(item.commonMistakes) ? item.commonMistakes.map(String) : [],
        example: String(item.example || ""),
      });
      if (action === "add_topic") {
        current.topics.push({
          id: conceptId,
          title: String(item.title),
          subject: String(item.subject),
          summary: normalizeAuthoredText(String(item.summary || "")),
          createdAt: Date.now(),
          area: item.area ? String(item.area) : undefined,
          space: item.space ? String(item.space) : undefined,
        });
      }
    } else if (action === "add_questionnaire") {
      const item = body.item || {};
      if (!item.title || !item.subject) {
        return NextResponse.json({ error: "title and subject required" }, { status: 400 });
      }
      const setId = uid("m-quiz");
      const firstPrompt = normalizeAuthoredText(String(item.firstPrompt || item.prompt || "")).trim();
      const items: QuestionnaireItem[] = [];
      if (firstPrompt) {
        items.push({
          id: uid("m-item"),
          format: (String(item.format || "concept_check") as QuestionFormat) || "concept_check",
          prompt: firstPrompt,
          hints: Array.isArray(item.hints)
            ? item.hints.map((h: unknown) => normalizeAuthoredText(String(h)))
            : [normalizeAuthoredText(String(item.hint || "Attempt before asking AI for more hints."))],
          visibleSteps: Array.isArray(item.visibleSteps)
            ? item.visibleSteps.map((s: unknown) => normalizeAuthoredText(String(s)))
            : undefined,
          blankSteps: Array.isArray(item.blankSteps)
            ? item.blankSteps.map((s: unknown) => normalizeAuthoredText(String(s)))
            : undefined,
          choices: Array.isArray(item.choices) ? item.choices.map(String) : undefined,
          conceptIntro: item.conceptIntro
            ? normalizeAuthoredText(String(item.conceptIntro))
            : undefined,
        });
      }
      current.questionnaires.push({
        id: setId,
        title: String(item.title),
        subject: String(item.subject),
        kind: "generated",
        description: normalizeAuthoredText(
          String(item.description || "AI-generated practice set added from the UI.")
        ),
        generationNote: String(
          item.generationNote || `Added via change-code UI · ${new Date().toISOString().slice(0, 10)}`
        ),
        estimatedMinutes: Number(item.estimatedMinutes) || 20,
        tags: Array.isArray(item.tags) ? item.tags.map(String) : ["generated", "managed"],
        items,
      });
    } else if (action === "add_questionnaire_item") {
      const setId = String(body.setId || body.id || "");
      const item = body.item || {};
      const quiz = current.questionnaires.find((q) => q.id === setId);
      if (!quiz) {
        return NextResponse.json({ error: "questionnaire set not found" }, { status: 404 });
      }
      if (!item.prompt) {
        return NextResponse.json({ error: "item prompt required" }, { status: 400 });
      }
      quiz.items.push({
        id: uid("m-item"),
        format: (String(item.format || "concept_check") as QuestionFormat) || "concept_check",
        prompt: normalizeAuthoredText(String(item.prompt)),
        hints: Array.isArray(item.hints)
          ? item.hints.map((h: unknown) => normalizeAuthoredText(String(h)))
          : [normalizeAuthoredText(String(item.hint || "Try yourself first."))],
        visibleSteps: Array.isArray(item.visibleSteps)
          ? item.visibleSteps.map((s: unknown) => normalizeAuthoredText(String(s)))
          : undefined,
        blankSteps: Array.isArray(item.blankSteps)
          ? item.blankSteps.map((s: unknown) => normalizeAuthoredText(String(s)))
          : undefined,
        choices: Array.isArray(item.choices) ? item.choices.map(String) : undefined,
        conceptIntro: item.conceptIntro
          ? normalizeAuthoredText(String(item.conceptIntro))
          : undefined,
      });
    } else if (action === "add_formula") {
      const item = body.item || {};
      if (!item.name || (!item.content && !item.expression) || !item.subject) {
        return NextResponse.json({ error: "name, content, and subject required" }, { status: 400 });
      }
      current.formulas.push({
        id: uid("m-formula"),
        subject: String(item.subject),
        unit: String(item.unit || "Managed"),
        name: String(item.name),
        expression: String(item.expression || ""),
        content: item.content
          ? normalizeAuthoredText(String(item.content)).slice(0, 200_000)
          : undefined,
        variables: String(item.variables || ""),
        whenToUse: String(item.whenToUse || ""),
        sourceNote: "Added via change-code edit",
      });
    } else if (action === "add_document") {
      const item = body.item || {};
      if (!item.title || !item.content) {
        return NextResponse.json({ error: "title and content required" }, { status: 400 });
      }
      if (publicMaterialsContribution && String(item.content).length > 50_000) {
        return NextResponse.json({ error: "Public documents must stay under 50,000 characters" }, { status: 400 });
      }
      current.documents.push({
        id: uid("m-doc"),
        title: String(item.title).slice(0, 160),
        content: normalizeAuthoredText(String(item.content)).slice(0, 200_000),
        category: String(item.category || "Uploaded").slice(0, 80),
        updatedAt: Date.now(),
        area: item.area ? String(item.area) : undefined,
        space: item.space ? String(item.space) : undefined,
      });
    } else if (action === "add_file") {
      const item = body.item || {};
      if (!item.name || !item.dataUrl) {
        return NextResponse.json({ error: "file name and data required" }, { status: 400 });
      }
      const publicFileLimit = publicMaterialsContribution ? 1_000_000 : 1_500_000;
      if (String(item.dataUrl).length > publicFileLimit) {
        return NextResponse.json({ error: "File too large (keep under ~1MB)" }, { status: 400 });
      }
      current.files.unshift({
        id: uid("m-file"),
        name: String(item.name).slice(0, 200),
        mime: String(item.mime || "application/octet-stream"),
        dataUrl: String(item.dataUrl),
        note: item.note ? String(item.note) : undefined,
        uploadedAt: Date.now(),
        uploadedBy: publicMaterialsContribution ? "public-contributor" : "change-code",
        area: item.area ? String(item.area) : undefined,
        space: item.space ? String(item.space) : undefined,
      });
    } else if (action === "add_member") {
      // Content-code editors can add partners; master still works too.
      if (!canEditContent(level)) {
        return NextResponse.json(
          { error: "Unlock with the content change code (or master) to add members." },
          { status: 403 }
        );
      }
      const item = body.item || {};
      if (!item.name) {
        return NextResponse.json({ error: "member name required" }, { status: 400 });
      }
      current.members.push({
        id: uid("member"),
        name: String(item.name),
        note: item.note ? String(item.note) : undefined,
        addedAt: Date.now(),
      });
    } else if (action === "add_folder") {
      const item = body.item || {};
      if (!item.title || !item.area) {
        return NextResponse.json({ error: "folder title and area required" }, { status: 400 });
      }
      current.folders.push({
        id: uid("folder"),
        title: String(item.title).slice(0, 160),
        area: String(item.area),
        note: item.note ? String(item.note).slice(0, 500) : undefined,
        createdAt: Date.now(),
        space: item.space ? String(item.space) : "_root",
      });
    } else if (action === "delete") {
      const target = String(body.target || "");
      const id = String(body.id || "");
      if (target === "member" && !canEditContent(level)) {
        return NextResponse.json(
          { error: "Unlock with the content change code (or master) to remove members." },
          { status: 403 }
        );
      }
      if (!current.recycleBin) current.recycleBin = [];
      const pushRecycle = (entryTarget: typeof current.recycleBin[number]["target"], label: string, payload: unknown) => {
        current.recycleBin.unshift({
          id: uid("recycle"),
          target: entryTarget,
          label,
          deletedAt: Date.now(),
          payload,
        });
      };
      if (target === "content_item") {
        const item = current.contentItems.find((entry) => entry.id === id);
        if (item) {
          item.deletedAt = Date.now();
          item.updatedAt = Date.now();
          pushRecycle("content_item", item.title, { ...item });
        }
      } else if (target === "concept" || target === "topic") {
        const found = current.concepts.find((c) => c.id === id);
        if (found) {
          pushRecycle(target === "topic" ? "topic" : "concept", found.title, found);
          current.concepts = current.concepts.filter((c) => c.id !== id);
          current.topics = current.topics.filter((t) => t.id !== id);
        }
      } else if (target === "formula") {
        const found = current.formulas.find((f) => f.id === id);
        if (found) {
          pushRecycle("formula", found.name, found);
          current.formulas = current.formulas.filter((f) => f.id !== id);
        }
      } else if (target === "document") {
        const found = current.documents.find((d) => d.id === id);
        if (found) {
          pushRecycle("document", found.title, found);
          current.documents = current.documents.filter((d) => d.id !== id);
        }
      } else if (target === "file") {
        const found = current.files.find((f) => f.id === id);
        if (found) {
          pushRecycle("file", found.name, found);
          current.files = current.files.filter((f) => f.id !== id);
        }
      } else if (target === "member") {
        const found = current.members.find((m) => m.id === id);
        if (found) {
          pushRecycle("member", found.name, found);
          current.members = current.members.filter((m) => m.id !== id);
        }
      } else if (target === "folder") {
        const found = current.folders.find((f) => f.id === id);
        if (found) {
          pushRecycle("folder", found.title, found);
          current.folders = current.folders.filter((f) => f.id !== id);
        }
      } else if (target === "subject") {
        current.subjects = current.subjects.filter((s) => s.id !== id && s.name !== id && s.slug !== id);
      } else if (target === "questionnaire") {
        const found = current.questionnaires.find((q) => q.id === id);
        if (found) {
          pushRecycle("questionnaire", found.title, found);
          current.questionnaires = current.questionnaires.filter((q) => q.id !== id);
        }
      } else if (target === "forum_post") current.forumPosts = current.forumPosts.filter((post) => post.id !== id);
      else if (target === "forum_reply") {
        const post = current.forumPosts.find((entry) => entry.id === String(body.postId || ""));
        if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
        post.replies = (post.replies || []).filter((reply) => reply.id !== id);
      }
      else return NextResponse.json({ error: "Unknown delete target" }, { status: 400 });
    } else if (action === "set_advanced_default") {
      const enabled = Boolean(body.advancedDefault ?? body.enabled);
      current.settings = {
        ...(current.settings || { advancedDefault: false }),
        advancedDefault: enabled,
      };
    } else if (action === "set_github_token") {
      const t = String(body.githubToken || "").trim();
      if (!t) return NextResponse.json({ error: "githubToken required" }, { status: 400 });
      await setGithubTokenCookie(t);
      return NextResponse.json({ ok: true, note: "GitHub publish token saved for this browser." });
    } else {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    const result = await saveManagedContent(current, token);
    if (action === "set_advanced_default") {
      const { invalidateSiteAiTierCache } = await import("@/lib/ai-tiers-managed");
      invalidateSiteAiTierCache();
    }
    return NextResponse.json({
      ok: true,
      mode: result.mode,
      level,
      content: current,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Save failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
