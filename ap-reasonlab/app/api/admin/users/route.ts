import { NextRequest, NextResponse } from "next/server";
import { getSession, isFullAdmin } from "@/lib/auth";
import { loadUsers, saveUsers } from "@/lib/managed-store";

export async function GET() {
  const session = await getSession();
  if (!session || !isFullAdmin(session.role)) {
    return NextResponse.json({ error: "Full admin required" }, { status: 403 });
  }
  const file = await loadUsers();
  return NextResponse.json({
    users: file.users.map((u) => ({
      id: u.id,
      name: u.name,
      role: u.role,
      createdAt: u.createdAt,
    })),
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !isFullAdmin(session.role)) {
    return NextResponse.json({ error: "Full admin required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const userId = String(body.userId || "");
    const role = String(body.role || "user") as "user" | "partner" | "admin";
    if (!["user", "partner", "admin"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    const file = await loadUsers();
    const user = file.users.find((u) => u.id === userId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    user.role = role;
    await saveUsers(file);
    return NextResponse.json({
      ok: true,
      user: { id: user.id, name: user.name, role: user.role },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
  }
}
