/**
 * Two change codes (no accounts / no login):
 * - Content code: edit/add content + files. Cannot manage members or codes.
 * - Master code: can do everything (content + members).
 *
 * Override on Vercel with CONTENT_CHANGE_CODE and MASTER_CHANGE_CODE.
 * Defaults below are the project bootstrap codes — change them in production.
 */

export type ChangeLevel = "content" | "master" | null;

/** Content-only change code (cannot add members / change permissions). */
export const DEFAULT_CONTENT_CODE = "C-43620D98";

/** Master change code (can do anything). */
export const DEFAULT_MASTER_CODE = "M-B67DDB61";

export function resolveChangeLevel(code: string | undefined | null): ChangeLevel {
  const c = String(code || "").trim();
  if (!c) return null;
  const content = process.env.CONTENT_CHANGE_CODE || DEFAULT_CONTENT_CODE;
  const master = process.env.MASTER_CHANGE_CODE || DEFAULT_MASTER_CODE;
  if (c === master) return "master";
  if (c === content) return "content";
  return null;
}

export function canEditContent(level: ChangeLevel): boolean {
  return level === "content" || level === "master";
}

export function canManageMembers(level: ChangeLevel): boolean {
  return level === "master";
}
