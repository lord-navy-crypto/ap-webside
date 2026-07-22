import { readFile, writeFile } from "fs/promises";
import path from "path";
import type { Concept, Formula } from "@/lib/types";

export type ManagedDocument = {
  id: string;
  title: string;
  content: string;
  category: string;
  updatedAt: number;
  /** Page area: concepts | formulas | practice | … */
  area?: string;
  /** Isolated folder space: subject name, folder:{id}, or _root */
  space?: string;
};

export type ManagedFile = {
  id: string;
  name: string;
  mime: string;
  dataUrl?: string;
  note?: string;
  uploadedAt: number;
  uploadedBy?: string;
  area?: string;
  space?: string;
};

export type ManagedFolder = {
  id: string;
  title: string;
  /** Which area this folder belongs to, e.g. concepts | formulas | code | academic */
  area: string;
  note?: string;
  createdAt: number;
  /** Parent storage space where this folder appears */
  space?: string;
};

export type ManagedSubject = {
  id: string;
  slug: string;
  name: string;
  shortName?: string;
  description?: string;
  icon?: string;
  color?: string;
  order: number;
  enabled: boolean;
  createdAt: number;
};

export type ManagedUnit = {
  id: string;
  subjectId: string;
  title: string;
  description?: string;
  order: number;
  enabled: boolean;
  createdAt: number;
};

export type ManagedContentItem = {
  id: string;
  subjectId: string;
  unitId?: string;
  type: "concept" | "formula" | "practice" | "document" | "file" | "folder";
  title: string;
  content: string;
  tags: string[];
  difficulty?: "intro" | "standard" | "challenge";
  source?: string;
  status: "draft" | "published";
  order: number;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
};

export type ManagedForumReply = {
  id: string;
  author: string;
  body: string;
  createdAt: number;
};

export type ManagedForumPost = {
  id: string;
  title: string;
  body: string;
  author: string;
  createdAt: number;
  replies: ManagedForumReply[];
};

export type ManagedContent = {
  concepts: Concept[];
  formulas: Formula[];
  documents: ManagedDocument[];
  files: ManagedFile[];
  members: { id: string; name: string; note?: string; addedAt: number }[];
  folders: ManagedFolder[];
  subjects: ManagedSubject[];
  units: ManagedUnit[];
  contentItems: ManagedContentItem[];
  forumPosts: ManagedForumPost[];
  updatedAt: number;
};

export type StoredUser = {
  id: string;
  name: string;
  passwordHash: string;
  role: "user" | "partner" | "admin";
  createdAt: number;
};

export type UsersFile = {
  users: StoredUser[];
  updatedAt: number;
};

const CONTENT_PATH = path.join(process.cwd(), "data", "managed-content.json");
const USERS_PATH = path.join(process.cwd(), "data", "users.json");

const emptyContent = (): ManagedContent => ({
  concepts: [],
  formulas: [],
  documents: [],
  files: [],
  members: [],
  folders: [],
  subjects: [],
  units: [],
  contentItems: [],
  forumPosts: [],
  updatedAt: 0,
});

const emptyUsers = (): UsersFile => ({ users: [], updatedAt: 0 });

/** Strip paste/env accidents that cause GitHub "Bad credentials" (401). */
export function sanitizeGithubToken(raw?: string | null): string {
  if (!raw) return "";
  let t = String(raw).trim();
  // Common Vercel/UI mistakes: wrapping quotes or accidental Bearer prefix
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    t = t.slice(1, -1).trim();
  }
  if (/^bearer\s+/i.test(t)) t = t.replace(/^bearer\s+/i, "").trim();
  return t;
}

/** True when the string looks like a GitHub PAT (not a content change code). */
export function looksLikeGithubPat(raw?: string | null): boolean {
  const t = sanitizeGithubToken(raw);
  return /^(ghp_|github_pat_|gho_|ghu_|ghs_|ghr_)/.test(t);
}

/**
 * CONTENT_GITHUB_TOKEN is NOT an AI key.
 * It is the GitHub Personal Access Token used to publish site content
 * (managed-content.json) to the repo. AI uses GROQ_API_KEY / OPENROUTER_API_KEY / etc.
 *
 * Why the name: "token for publishing CONTENT to GitHub" — not "GitHub Models AI".
 * Vercel often reserves GITHUB_TOKEN, so we prefer CONTENT_GITHUB_TOKEN, but we still
 * try GITHUB_TOKEN / GH_TOKEN if the first one fails with 401.
 */
export function githubAuthCandidates(override?: string | null): string[] {
  const fromClient = sanitizeGithubToken(override);
  const envOnes = [
    process.env.CONTENT_GITHUB_TOKEN,
    process.env.GITHUB_TOKEN,
    process.env.GH_TOKEN,
  ].map(sanitizeGithubToken);

  const ordered: string[] = [];
  const push = (t: string) => {
    if (!t) return;
    // Prefer real PATs; skip obvious non-tokens (change codes, AI keys without ghp_ prefix)
    if (!looksLikeGithubPat(t) && fromClient !== t) {
      // Still allow env values that don't match prefix (some enterprise tokens), but deprioritize
    }
    if (!ordered.includes(t)) ordered.push(t);
  };

  if (fromClient && looksLikeGithubPat(fromClient)) push(fromClient);
  for (const t of envOnes) {
    if (t && looksLikeGithubPat(t)) push(t);
  }
  // Last resort: non-PAT-shaped env values (legacy), after real PATs
  for (const t of envOnes) {
    if (t) push(t);
  }
  return ordered;
}

/** First usable GitHub auth token (UI override → CONTENT_GITHUB_TOKEN → GITHUB_TOKEN → GH_TOKEN). */
export function resolveGithubAuth(override?: string | null): string {
  return githubAuthCandidates(override)[0] || "";
}

function repoSettings() {
  return {
    token: resolveGithubAuth(),
    repo: process.env.GITHUB_REPO || "lord-navy-crypto/ap-webside",
    branch: process.env.GITHUB_BRANCH || "main",
  };
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJsonFile(filePath: string, data: unknown): Promise<void> {
  await writeFile(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

async function githubGet(
  filePathInRepo: string,
  token?: string
): Promise<{ text: string; sha: string } | null> {
  const { repo, branch } = repoSettings();
  const candidates = githubAuthCandidates(token);
  if (candidates.length === 0) return null;

  const apiPath = filePathInRepo.replace(/^\/+/, "");
  const url = `https://api.github.com/repos/${repo}/contents/${apiPath}?ref=${encodeURIComponent(branch)}`;

  for (const auth of candidates) {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${auth}`,
        Accept: "application/vnd.github+json",
      },
      cache: "no-store",
    });
    if (!res.ok) continue;
    const body = await res.json();
    if (!body.content || !body.sha) continue;
    const text = Buffer.from(body.content.replace(/\n/g, ""), "base64").toString("utf8");
    return { text, sha: body.sha };
  }
  return null;
}

async function githubWrite(
  filePathInRepo: string,
  content: string,
  message: string,
  token?: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { repo, branch } = repoSettings();
  const candidates = githubAuthCandidates(token);
  if (candidates.length === 0) {
    return {
      ok: false,
      error:
        "No GitHub write token. Set CONTENT_GITHUB_TOKEN or GITHUB_TOKEN on Vercel to a GitHub PAT (ghp_ / github_pat_), Redeploy, leave the optional GitHub field empty. AI keys (GROQ/OPENROUTER/…) are separate and do not publish content.",
    };
  }

  const apiPath = filePathInRepo.replace(/^\/+/, "");
  const url = `https://api.github.com/repos/${repo}/contents/${apiPath}`;

  let lastStatus = 0;
  let lastText = "";

  for (const auth of candidates) {
    const existing = await githubGet(apiPath, auth);
    const putRes = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${auth}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        content: Buffer.from(content, "utf8").toString("base64"),
        branch,
        sha: existing?.sha,
      }),
    });
    if (putRes.ok) return { ok: true };
    lastStatus = putRes.status;
    lastText = await putRes.text();
    // Try next candidate on bad credentials; stop on other errors (403/422/…)
    if (putRes.status !== 401) break;
  }

  let hint = "";
  if (lastStatus === 401) {
    hint =
      " Bad credentials: none of CONTENT_GITHUB_TOKEN / GITHUB_TOKEN worked. Put your real GitHub PAT (for repo write) into CONTENT_GITHUB_TOKEN OR GITHUB_TOKEN on Vercel, Redeploy. Do NOT put AI keys (OpenRouter/Groq/DeepSeek) or the content change code into those variables. AI and GitHub write are different.";
  } else if (lastStatus === 403) {
    hint =
      " Token was accepted but lacks write access. Fine-grained PAT: repo ap-webside + Contents: Read and write. Classic PAT: repo scope.";
  }
  return {
    ok: false,
    error: `GitHub write failed (${lastStatus}): ${lastText.slice(0, 300)}${hint}`,
  };
}

export async function loadManagedContent(token?: string): Promise<ManagedContent> {
  const fromGh = await githubGet("ap-reasonlab/data/managed-content.json", token);
  if (fromGh) {
    try {
      const parsed = JSON.parse(fromGh.text) as ManagedContent;
      if (!parsed.members) parsed.members = [];
      if (!parsed.concepts) parsed.concepts = [];
      if (!parsed.formulas) parsed.formulas = [];
      if (!parsed.documents) parsed.documents = [];
      if (!parsed.files) parsed.files = [];
      if (!parsed.folders) parsed.folders = [];
      if (!parsed.subjects) parsed.subjects = [];
      if (!parsed.units) parsed.units = [];
      if (!parsed.contentItems) parsed.contentItems = [];
      if (!parsed.forumPosts) parsed.forumPosts = [];
      return parsed;
    } catch {
      // fall through
    }
  }
  const local = await readJsonFile(CONTENT_PATH, emptyContent());
  if (!local.members) local.members = [];
  if (!local.folders) local.folders = [];
  if (!local.subjects) local.subjects = [];
  if (!local.units) local.units = [];
  if (!local.contentItems) local.contentItems = [];
  if (!local.forumPosts) local.forumPosts = [];
  return local;
}

export async function saveManagedContent(
  data: ManagedContent,
  token?: string
): Promise<{ mode: "github" | "local" }> {
  const next = { ...data, updatedAt: Date.now() };
  const text = JSON.stringify(next, null, 2) + "\n";
  const repoPath = "ap-reasonlab/data/managed-content.json";
  const viaGithub = await githubWrite(
    repoPath,
    text,
    "chore: update managed content via Admin UI",
    token
  );
  if (viaGithub.ok) return { mode: "github" };

  // Local/dev fallback — fails on Vercel read-only FS.
  try {
    await writeJsonFile(CONTENT_PATH, next);
    return { mode: "local" };
  } catch {
    throw new Error(viaGithub.error);
  }
}

export async function loadUsers(token?: string): Promise<UsersFile> {
  const fromGh = await githubGet("ap-reasonlab/data/users.json", token);
  if (fromGh) {
    try {
      return JSON.parse(fromGh.text) as UsersFile;
    } catch {
      // fall through
    }
  }
  return readJsonFile(USERS_PATH, emptyUsers());
}

export async function saveUsers(
  data: UsersFile,
  token?: string
): Promise<{ mode: "github" | "local" }> {
  const next = { ...data, updatedAt: Date.now() };
  const text = JSON.stringify(next, null, 2) + "\n";
  const repoPath = "ap-reasonlab/data/users.json";
  const viaGithub = await githubWrite(repoPath, text, "chore: update users via Admin UI", token);
  if (viaGithub.ok) return { mode: "github" };
  try {
    await writeJsonFile(USERS_PATH, next);
    return { mode: "local" };
  } catch {
    throw new Error(viaGithub.error);
  }
}

export function uid(prefix = "id"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
