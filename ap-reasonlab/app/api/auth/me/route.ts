import { NextResponse } from "next/server";
import { getContentEditorSession, getSession } from "@/lib/auth";

export async function GET() {
  const user = await getSession();
  const contentEditor = await getContentEditorSession();
  return NextResponse.json({
    user,
    contentEditor,
    canEditContent: Boolean(contentEditor),
  });
}
