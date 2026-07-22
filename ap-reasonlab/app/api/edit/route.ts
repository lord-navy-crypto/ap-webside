import { NextRequest, NextResponse } from "next/server";
import {
  canEditContent,
  canManageMembers,
  resolveChangeLevel,
} from "@/lib/change-codes";
import { getGithubTokenFromCookie, setGithubTokenCookie } from "@/lib/auth";
import {
  loadManagedContent,
  saveManagedContent,
  uid,
  normalizeManagedContent,
  type ManagedContent,
} from "@/lib/managed-store";
import type { QuestionFormat, QuestionnaireItem } from "@/lib/types";

async function tokenFrom(body: { githubToken?: string }) {
  const t = body.githubToken?.trim();
  if (t) {
    await setGithubTokenCookie(t);
    return t;
  }
  return getGithubTokenFromCookie();
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
      updatedAt: content.updatedAt,
      scoped: { area, space: spaceKey },
    });
  }

  return NextResponse.json(content);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const level = resolveChangeLevel(body.changeCode);
    if (!canEditContent(level)) {
      return NextResponse.json(
        { error: "Wrong or missing change code. Enter the content code or master code to save." },
        { status: 401 }
      );
    }

    const action = String(body.action || "");
    const token = await tokenFrom(body);
    const current: ManagedContent = normalizeManagedContent(await loadManagedContent(token));

    if (action === "add_concept" || action === "add_topic") {
      const item = body.item || {};
      if (!item.title || !item.subject) {
        return NextResponse.json({ error: "title and subject required" }, { status: 400 });
      }
      const conceptId = uid(action === "add_topic" ? "m-topic" : "m-concept");
      current.concepts.push({
        id: conceptId,
        title: String(item.title),
        subject: String(item.subject),
        summary: String(item.summary || ""),
        keyPoints: Array.isArray(item.keyPoints) ? item.keyPoints.map(String) : [],
        commonMistakes: Array.isArray(item.commonMistakes)
          ? item.commonMistakes.map(String)
          : [],
        example: String(item.example || ""),
      });
      if (action === "add_topic") {
        current.topics.push({
          id: conceptId,
          title: String(item.title),
          subject: String(item.subject),
          summary: String(item.summary || ""),
          createdAt: Date.now(),
          area: item.area ? String(item.area) : undefined,
          space: item.space ? String(item.space) : undefined,
        });
      }
    } else if (action === "add_formula") {
      const item = body.item || {};
      if (!item.name || !item.expression || !item.subject) {
        return NextResponse.json({ error: "name, expression, subject required" }, { status: 400 });
      }
      current.formulas.push({
        id: uid("m-formula"),
        subject: String(item.subject),
        unit: String(item.unit || "Managed"),
        name: String(item.name),
        expression: String(item.expression),
        variables: String(item.variables || ""),
        whenToUse: String(item.whenToUse || ""),
        sourceNote: "Added via change-code edit",
      });
    } else if (action === "add_document") {
      const item = body.item || {};
      if (!item.title || !item.content) {
        return NextResponse.json({ error: "title and content required" }, { status: 400 });
      }
      current.documents.push({
        id: uid("m-doc"),
        title: String(item.title),
        content: String(item.content).slice(0, 200_000),
        category: String(item.category || "Uploaded"),
        updatedAt: Date.now(),
        area: item.area ? String(item.area) : undefined,
        space: item.space ? String(item.space) : undefined,
      });
    } else if (action === "add_file") {
      const item = body.item || {};
      if (!item.name || !item.dataUrl) {
        return NextResponse.json({ error: "file name and data required" }, { status: 400 });
      }
      if (String(item.dataUrl).length > 1_500_000) {
        return NextResponse.json({ error: "File too large (keep under ~1MB)" }, { status: 400 });
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
    } else if (action === "add_member") {
      if (!canManageMembers(level)) {
        return NextResponse.json(
          { error: "Only the master change code can add members." },
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
        title: String(item.title),
        area: String(item.area),
        note: item.note ? String(item.note) : undefined,
        createdAt: Date.now(),
        space: item.space ? String(item.space) : "_root",
      });
    } else if (action === "add_subject") {
      const item = body.item || {};
      const name = String(item.title || item.name || item.subject || "").trim();
      if (!name) {
        return NextResponse.json({ error: "subject name required" }, { status: 400 });
      }
      if (!current.subjects.includes(name)) {
        current.subjects.push(name);
        current.subjects.sort((a, b) => a.localeCompare(b));
      }
    } else if (action === "add_questionnaire") {
      const item = body.item || {};
      if (!item.title || !item.subject) {
        return NextResponse.json({ error: "title and subject required" }, { status: 400 });
      }
      const setId = uid("m-quiz");
      const firstPrompt = String(item.firstPrompt || item.prompt || "").trim();
      const items: QuestionnaireItem[] = [];
      if (firstPrompt) {
        items.push({
          id: uid("m-item"),
          format: (String(item.format || "concept_check") as QuestionFormat) || "concept_check",
          prompt: firstPrompt,
          hints: Array.isArray(item.hints)
            ? item.hints.map(String)
            : [String(item.hint || "Attempt before asking AI for more hints.")],
          visibleSteps: Array.isArray(item.visibleSteps)
            ? item.visibleSteps.map(String)
            : undefined,
          blankSteps: Array.isArray(item.blankSteps) ? item.blankSteps.map(String) : undefined,
          choices: Array.isArray(item.choices) ? item.choices.map(String) : undefined,
          conceptIntro: item.conceptIntro ? String(item.conceptIntro) : undefined,
        });
      }
      current.questionnaires.push({
        id: setId,
        title: String(item.title),
        subject: String(item.subject),
        kind: "generated",
        description: String(item.description || "AI-generated practice set added from the UI."),
        generationNote: String(
          item.generationNote || `Added via change-code UI · ${new Date().toISOString().slice(0, 10)}`
        ),
        estimatedMinutes: Number(item.estimatedMinutes) || 20,
        tags: Array.isArray(item.tags)
          ? item.tags.map(String)
          : ["generated", "managed"],
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
        prompt: String(item.prompt),
        hints: Array.isArray(item.hints)
          ? item.hints.map(String)
          : [String(item.hint || "Try yourself first.")],
        visibleSteps: Array.isArray(item.visibleSteps)
          ? item.visibleSteps.map(String)
          : undefined,
        blankSteps: Array.isArray(item.blankSteps) ? item.blankSteps.map(String) : undefined,
        choices: Array.isArray(item.choices) ? item.choices.map(String) : undefined,
        conceptIntro: item.conceptIntro ? String(item.conceptIntro) : undefined,
      });
    } else if (action === "delete") {
      const target = String(body.target || "");
      const id = String(body.id || "");
      if (target === "member" && !canManageMembers(level)) {
        return NextResponse.json(
          { error: "Only the master change code can remove members." },
          { status: 403 }
        );
      }
      if (target === "concept") {
        current.concepts = current.concepts.filter((c) => c.id !== id);
        current.topics = current.topics.filter((t) => t.id !== id);
      } else if (target === "topic") {
        current.topics = current.topics.filter((t) => t.id !== id);
        current.concepts = current.concepts.filter((c) => c.id !== id);
      } else if (target === "formula") {
        current.formulas = current.formulas.filter((f) => f.id !== id);
      } else if (target === "document") {
        current.documents = current.documents.filter((d) => d.id !== id);
      } else if (target === "file") {
        current.files = current.files.filter((f) => f.id !== id);
      } else if (target === "member") {
        current.members = current.members.filter((m) => m.id !== id);
      } else if (target === "folder") {
        current.folders = current.folders.filter((f) => f.id !== id);
      } else if (target === "subject") {
        current.subjects = current.subjects.filter((s) => s !== id);
      } else if (target === "questionnaire") {
        current.questionnaires = current.questionnaires.filter((q) => q.id !== id);
      } else {
        return NextResponse.json({ error: "Unknown delete target" }, { status: 400 });
      }
    } else if (action === "set_github_token") {
      const t = String(body.githubToken || "").trim();
      if (!t) return NextResponse.json({ error: "githubToken required" }, { status: 400 });
      await setGithubTokenCookie(t);
      return NextResponse.json({ ok: true, note: "GitHub publish token saved for this browser." });
    } else {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    const result = await saveManagedContent(current, token);
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
