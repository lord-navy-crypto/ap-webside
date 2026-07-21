import { NextRequest, NextResponse } from "next/server";
import {
  hashPassword,
  setSessionCookie,
  tryEnvLogin,
  verifyPassword,
} from "@/lib/auth";
import { loadUsers, saveUsers, uid } from "@/lib/managed-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body.action || "login");
    const name = String(body.name || "").trim();
    const password = String(body.password || "");

    if (action === "register") {
      if (!name || name.length < 2) {
        return NextResponse.json({ error: "Name must be at least 2 characters" }, { status: 400 });
      }
      if (!password || password.length < 4) {
        return NextResponse.json({ error: "Password must be at least 4 characters" }, { status: 400 });
      }
      const file = await loadUsers();
      if (file.users.some((u) => u.name.toLowerCase() === name.toLowerCase())) {
        return NextResponse.json({ error: "Name already registered" }, { status: 409 });
      }
      const user = {
        id: uid("user"),
        name,
        passwordHash: hashPassword(password),
        role: "user" as const,
        createdAt: Date.now(),
      };
      file.users.push(user);
      try {
        await saveUsers(file);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Could not save user. Set GITHUB_TOKEN on Vercel for registration.";
        return NextResponse.json({ error: message }, { status: 500 });
      }
      await setSessionCookie({ id: user.id, name: user.name, role: user.role });
      return NextResponse.json({ user: { id: user.id, name: user.name, role: user.role } });
    }

    // login
    if (!password) {
      return NextResponse.json({ error: "Password required" }, { status: 400 });
    }

    const envUser = tryEnvLogin(password);
    if (envUser) {
      await setSessionCookie(envUser);
      return NextResponse.json({ user: envUser });
    }

    if (!name) {
      return NextResponse.json(
        { error: "Enter your registered name + password, or use the admin/partner manager password." },
        { status: 400 }
      );
    }

    const file = await loadUsers();
    const found = file.users.find((u) => u.name.toLowerCase() === name.toLowerCase());
    if (!found || !verifyPassword(password, found.passwordHash)) {
      return NextResponse.json({ error: "Invalid name or password" }, { status: 401 });
    }

    const session = { id: found.id, name: found.name, role: found.role };
    await setSessionCookie(session);
    return NextResponse.json({ user: session });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Auth failed" }, { status: 500 });
  }
}
