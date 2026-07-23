import { NextRequest, NextResponse } from "next/server";
import {
  canManageContent,
  getGithubTokenFromCookie,
  getSession,
  isFullAdmin,
  setGithubTokenCookie,
} from "@/lib/auth";
import { loadManagedContent, saveManagedContent, uid, normalizeManagedContent, type ManagedContent } from "@/lib/managed-store";

async function publishToken(bodyToken?: string) {
  const fromBody = bodyToken?.trim();
  if (fromBody) {
    await setGithubTokenCookie(fromBody);
    return fromBody;
  }
  return getGithubTokenFromCookie();
}

export async function GET() {
  const token = await getGithubTokenFromCookie();
  const content = await loadManagedContent(token);
  return NextResponse.json(content);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !canManageContent(session.role)) {
    return NextResponse.json({ error: "Manager login required" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as Partial<ManagedContent> & {
      replace?: boolean;
      githubToken?: string;
    };
    const token = await publishToken(body.githubToken);
    const current = await loadManagedContent(token);
    const next: ManagedContent = normalizeManagedContent(
      body.replace
        ? {
            concepts: body.concepts || [],
            formulas: body.formulas || [],
            documents: body.documents || [],
            files: body.files || [],
            members: body.members || current.members || [],
            folders: body.folders || current.folders || [],
            subjects: body.subjects || [],
            units: body.units || current.units || [],
            contentItems: body.contentItems || current.contentItems || [],
            forumPosts: body.forumPosts || current.forumPosts || [],
            questionnaires: body.questionnaires || [],
            topics: body.topics || [],
            updatedAt: Date.now(),
          }
        : {
            concepts: body.concepts ?? current.concepts,
            formulas: body.formulas ?? current.formulas,
            documents: body.documents ?? current.documents,
            files: body.files ?? current.files,
            members: body.members ?? current.members ?? [],
            folders: body.folders ?? current.folders ?? [],
            subjects: body.subjects ?? current.subjects ?? [],
            units: body.units ?? current.units ?? [],
            contentItems: body.contentItems ?? current.contentItems ?? [],
            forumPosts: body.forumPosts ?? current.forumPosts ?? [],
            questionnaires: body.questionnaires ?? current.questionnaires ?? [],
            topics: body.topics ?? current.topics ?? [],
            updatedAt: Date.now(),
          }
    );

    if (body.replace && !isFullAdmin(session.role)) {
      return NextResponse.json({ error: "Only full admin can replace all content" }, { status: 403 });
    }

    const result = await saveManagedContent(next, token);
    return NextResponse.json({ ok: true, mode: result.mode, content: next, savedBy: session.name });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save content";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || !canManageContent(session.role)) {
    return NextResponse.json({ error: "Manager login required" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const kind = String(body.kind || "");
    const token = await publishToken(body.githubToken);
    const current = await loadManagedContent(token);

    if (kind === "concept") {
      const concept = body.item;
      if (!concept?.title || !concept?.subject) {
        return NextResponse.json({ error: "title and subject required" }, { status: 400 });
      }
      const item = {
        id: concept.id || uid("m-concept"),
        title: String(concept.title),
        subject: String(concept.subject),
        summary: String(concept.summary || ""),
        keyPoints: Array.isArray(concept.keyPoints) ? concept.keyPoints.map(String) : [],
        commonMistakes: Array.isArray(concept.commonMistakes)
          ? concept.commonMistakes.map(String)
          : [],
        example: String(concept.example || ""),
      };
      const idx = current.concepts.findIndex((c) => c.id === item.id);
      if (idx >= 0) current.concepts[idx] = item;
      else current.concepts.push(item);
    } else if (kind === "formula") {
      const formula = body.item;
      if (!formula?.name || !formula?.expression || !formula?.subject) {
        return NextResponse.json({ error: "name, expression, subject required" }, { status: 400 });
      }
      const item = {
        id: formula.id || uid("m-formula"),
        subject: String(formula.subject),
        unit: String(formula.unit || "Managed"),
        name: String(formula.name),
        expression: String(formula.expression),
        variables: String(formula.variables || ""),
        whenToUse: String(formula.whenToUse || ""),
        relatedConceptId: formula.relatedConceptId ? String(formula.relatedConceptId) : undefined,
        sourceNote: String(formula.sourceNote || "Added via Results Admin UI"),
      };
      const idx = current.formulas.findIndex((f) => f.id === item.id);
      if (idx >= 0) current.formulas[idx] = item;
      else current.formulas.push(item);
    } else if (kind === "document") {
      const doc = body.item;
      if (!doc?.title || !doc?.content) {
        return NextResponse.json({ error: "title and content required" }, { status: 400 });
      }
      const item = {
        id: doc.id || uid("m-doc"),
        title: String(doc.title),
        content: String(doc.content).slice(0, 200_000),
        category: String(doc.category || "Uploaded"),
        updatedAt: Date.now(),
      };
      const idx = current.documents.findIndex((d) => d.id === item.id);
      if (idx >= 0) current.documents[idx] = item;
      else current.documents.push(item);
    } else if (kind === "file") {
      const file = body.item;
      if (!file?.name || !file?.dataUrl) {
        return NextResponse.json({ error: "name and dataUrl required" }, { status: 400 });
      }
      if (String(file.dataUrl).length > 1_500_000) {
        return NextResponse.json({ error: "File too large (keep under ~1MB)" }, { status: 400 });
      }
      const item = {
        id: file.id || uid("m-file"),
        name: String(file.name),
        mime: String(file.mime || "application/octet-stream"),
        dataUrl: String(file.dataUrl),
        note: file.note ? String(file.note) : undefined,
        uploadedAt: Date.now(),
        uploadedBy: session.name,
      };
      current.files.unshift(item);
    } else if (kind === "delete") {
      const target = String(body.target || "");
      const id = String(body.id || "");
      if (target === "concept") current.concepts = current.concepts.filter((c) => c.id !== id);
      else if (target === "formula") current.formulas = current.formulas.filter((f) => f.id !== id);
      else if (target === "document") current.documents = current.documents.filter((d) => d.id !== id);
      else if (target === "file") current.files = current.files.filter((f) => f.id !== id);
      else return NextResponse.json({ error: "Unknown delete target" }, { status: 400 });
    } else if (kind === "set_github_token") {
      const t = String(body.githubToken || "").trim();
      if (!t) return NextResponse.json({ error: "githubToken required" }, { status: 400 });
      await setGithubTokenCookie(t);
      return NextResponse.json({ ok: true, note: "GitHub token saved for this browser session." });
    } else {
      return NextResponse.json({ error: "Unknown kind" }, { status: 400 });
    }

    const result = await saveManagedContent(current, token);
    return NextResponse.json({ ok: true, mode: result.mode, content: current });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
