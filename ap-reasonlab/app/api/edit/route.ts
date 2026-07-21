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
  type ManagedContent,
} from "@/lib/managed-store";

async function tokenFrom(body: { githubToken?: string }) {
  const t = body.githubToken?.trim();
  if (t) {
    await setGithubTokenCookie(t);
    return t;
  }
  return getGithubTokenFromCookie();
}

export async function GET() {
  const token = await getGithubTokenFromCookie();
  const content = await loadManagedContent(token);
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
    const current: ManagedContent = await loadManagedContent(token);
    if (!current.members) current.members = [];

    if (action === "add_concept") {
      const item = body.item || {};
      if (!item.title || !item.subject) {
        return NextResponse.json({ error: "title and subject required" }, { status: 400 });
      }
      current.concepts.push({
        id: uid("m-concept"),
        title: String(item.title),
        subject: String(item.subject),
        summary: String(item.summary || ""),
        keyPoints: Array.isArray(item.keyPoints) ? item.keyPoints.map(String) : [],
        commonMistakes: Array.isArray(item.commonMistakes) ? item.commonMistakes.map(String) : [],
        example: String(item.example || ""),
      });
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
    } else if (action === "delete") {
      const target = String(body.target || "");
      const id = String(body.id || "");
      if (target === "member" && !canManageMembers(level)) {
        return NextResponse.json(
          { error: "Only the master change code can remove members." },
          { status: 403 }
        );
      }
      if (target === "concept") current.concepts = current.concepts.filter((c) => c.id !== id);
      else if (target === "formula") current.formulas = current.formulas.filter((f) => f.id !== id);
      else if (target === "document") current.documents = current.documents.filter((d) => d.id !== id);
      else if (target === "file") current.files = current.files.filter((f) => f.id !== id);
      else if (target === "member") current.members = current.members.filter((m) => m.id !== id);
      else return NextResponse.json({ error: "Unknown delete target" }, { status: 400 });
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
