import { NextResponse } from "next/server";
import { clearContentEditorCookie } from "@/lib/auth";

export async function POST() {
  await clearContentEditorCookie();
  return NextResponse.json({ ok: true });
}
