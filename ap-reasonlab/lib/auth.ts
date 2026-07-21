import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export type Role = "user" | "partner" | "admin";

export type SessionUser = {
  id: string;
  name: string;
  role: Role;
};

const COOKIE = "results_session";

function authSecret(): string {
  return (
    process.env.AUTH_SECRET ||
    process.env.ADMIN_PASSWORD ||
    process.env.PARTNER_PASSWORD ||
    "results-dev-secret-change-me"
  );
}

export function hashPassword(password: string, salt?: string): string {
  const s = salt || randomBytes(16).toString("hex");
  const hash = scryptSync(password, s, 64).toString("hex");
  return `${s}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const next = scryptSync(password, salt, 64);
  const prev = Buffer.from(hash, "hex");
  if (prev.length !== next.length) return false;
  return timingSafeEqual(prev, next);
}

export function signSession(user: SessionUser): string {
  const payload = Buffer.from(JSON.stringify(user), "utf8").toString("base64url");
  const sig = createHmac("sha256", authSecret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function readSessionToken(token: string | undefined): SessionUser | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = createHmac("sha256", authSecret()).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SessionUser;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  return readSessionToken(jar.get(COOKIE)?.value);
}

export async function setSessionCookie(user: SessionUser) {
  const jar = await cookies();
  jar.set(COOKIE, signSession(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export function canManageContent(role: Role): boolean {
  return role === "admin" || role === "partner";
}

export function isFullAdmin(role: Role): boolean {
  return role === "admin";
}

/** Env-based bootstrap logins (no DB required). */
export function tryEnvLogin(password: string): SessionUser | null {
  const admin = process.env.ADMIN_PASSWORD;
  const partner = process.env.PARTNER_PASSWORD;
  if (admin && password === admin) {
    return { id: "env-admin", name: "Admin", role: "admin" };
  }
  if (partner && password === partner) {
    return { id: "env-partner", name: "Partner", role: "partner" };
  }
  // Dev-friendly defaults so the manager UI works before env is set.
  // Change these on Vercel for production.
  if (!admin && password === "results-admin") {
    return { id: "dev-admin", name: "Admin", role: "admin" };
  }
  if (!partner && password === "results-partner") {
    return { id: "dev-partner", name: "Partner", role: "partner" };
  }
  return null;
}
