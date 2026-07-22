import { NextRequest, NextResponse } from "next/server";
import { resolveChangeLevel } from "@/lib/change-codes";
import { setContentEditorCookie } from "@/lib/auth";

/**
 * One-time content-code login. Sets an httpOnly cookie so later saves
 * do not need to re-enter the content change code.
 * Master code still works if provided, but the product UI focuses on content code.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const changeCode = String(body.changeCode || body.contentCode || "").trim();
    const level = resolveChangeLevel(changeCode);
    if (level !== "content" && level !== "master") {
      return NextResponse.json(
        { error: "Wrong content code. Ask an admin for the current content change code." },
        { status: 401 }
      );
    }
    await setContentEditorCookie(level);
    return NextResponse.json({
      ok: true,
      level,
      note:
        level === "content"
          ? "Content editor unlocked for this browser. You can save without re-entering the code."
          : "Editor unlocked (master). You can save without re-entering the code.",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
