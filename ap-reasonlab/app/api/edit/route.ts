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
import { subjectSlug } from "@/data/ap-catalog";

const forumWriteTimes = new Map<string, number>();

function forumRateLimited(req: NextRequest): boolean {
  const client = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const previous = forumWriteTimes.get(client) || 0;
  forumWriteTimes.set(client, now);
  return now - previous < 8_000;
}

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
    const level = resolveChangeLevel(body.changeCode);
    if (!publicMaterialsContribution && !publicForumContribution && !canEditContent(level)) {
      return NextResponse.json(
        { error: "Wrong or missing change code. Enter the content code or master code to save." },
        { status: 401 }
      );
    }

    const token = await tokenFrom(body);
    const current: ManagedContent = await loadManagedContent(token);
    if (!current.members) current.members = [];
    if (!current.folders) current.folders = [];
    if (!current.subjects) current.subjects = [];
    if (!current.units) current.units = [];
    if (!current.contentItems) current.contentItems = [];
    if (!current.forumPosts) current.forumPosts = [];

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
      const name = String(item.name || "").trim();
      if (!name) return NextResponse.json({ error: "subject name required" }, { status: 400 });
      const slug = subjectSlug(String(item.slug || name));
      if (current.subjects.some((subject) => subject.slug === slug)) {
        return NextResponse.json({ error: "A subject with this URL already exists" }, { status: 409 });
      }
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
        content: String(item.content || "").slice(0, 200_000),
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
    } else if (action === "add_concept") {
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
      if (publicMaterialsContribution && String(item.content).length > 50_000) {
        return NextResponse.json({ error: "Public documents must stay under 50,000 characters" }, { status: 400 });
      }
      current.documents.push({
        id: uid("m-doc"),
        title: String(item.title).slice(0, 160),
        content: String(item.content).slice(0, 200_000),
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
        title: String(item.title).slice(0, 160),
        area: String(item.area),
        note: item.note ? String(item.note).slice(0, 500) : undefined,
        createdAt: Date.now(),
        space: item.space ? String(item.space) : "_root",
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
      if (target === "content_item") {
        const item = current.contentItems.find((entry) => entry.id === id);
        if (item) {
          item.deletedAt = Date.now();
          item.updatedAt = Date.now();
        }
      }
      else if (target === "concept") current.concepts = current.concepts.filter((c) => c.id !== id);
      else if (target === "formula") current.formulas = current.formulas.filter((f) => f.id !== id);
      else if (target === "document") current.documents = current.documents.filter((d) => d.id !== id);
      else if (target === "file") current.files = current.files.filter((f) => f.id !== id);
      else if (target === "member") current.members = current.members.filter((m) => m.id !== id);
      else if (target === "folder") current.folders = current.folders.filter((f) => f.id !== id);
      else if (target === "forum_post") current.forumPosts = current.forumPosts.filter((post) => post.id !== id);
      else if (target === "forum_reply") {
        const post = current.forumPosts.find((entry) => entry.id === String(body.postId || ""));
        if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
        post.replies = (post.replies || []).filter((reply) => reply.id !== id);
      }
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
