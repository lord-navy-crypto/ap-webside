import { NextRequest, NextResponse } from "next/server";
import { getContentEditorLevel, getGithubTokenFromCookie } from "@/lib/auth";
import { canEditContent } from "@/lib/change-codes";
import {
  listManagedContentHistory,
  loadManagedContentAtRef,
  saveManagedContent,
} from "@/lib/managed-store";

async function requireEditor() {
  return canEditContent(await getContentEditorLevel());
}

export async function GET() {
  if (!(await requireEditor())) {
    return NextResponse.json(
      { error: "Unlock with the content change code first." },
      { status: 403 }
    );
  }
  const token = await getGithubTokenFromCookie();
  const history = await listManagedContentHistory(token, 30);
  return NextResponse.json({
    history,
    note:
      history.length > 0
        ? "History is backed by GitHub versions of managed-content.json."
        : "No GitHub-backed history is available. Check the repository token or try again.",
  });
}

export async function POST(req: NextRequest) {
  try {
    if (!(await requireEditor())) {
      return NextResponse.json(
        { error: "Unlock with the content change code first." },
        { status: 403 }
      );
    }
    const body = await req.json();
    const sha = String(body.sha || "");
    if (!/^[a-f0-9]{40}$/i.test(sha)) {
      return NextResponse.json({ error: "Choose a valid history version." }, { status: 400 });
    }

    const token = await getGithubTokenFromCookie();
    const history = await listManagedContentHistory(token, 50);
    if (!history.some((entry) => entry.sha === sha)) {
      return NextResponse.json(
        { error: "That version is not in the managed-content history." },
        { status: 400 }
      );
    }
    const restored = await loadManagedContentAtRef(sha, token);
    if (!restored) {
      return NextResponse.json({ error: "Could not read the selected version." }, { status: 404 });
    }

    const saved = await saveManagedContent(
      restored,
      token,
      `undo: restore managed content from ${sha.slice(0, 7)}`
    );
    return NextResponse.json({
      ok: true,
      mode: saved.mode,
      content: restored,
      restoredFrom: sha,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Undo failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
