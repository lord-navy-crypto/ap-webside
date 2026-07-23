import { readFile, writeFile } from "fs/promises";
import path from "path";
import type { Concept, Formula, Questionnaire } from "@/lib/types";
import { subjectSlug } from "@/data/ap-catalog";

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

/** Lightweight topic stub shown in Concepts (also stored as a concept). */
export type ManagedTopic = {
  id: string;
  title: string;
  subject: string;
  summary?: string;
  createdAt: number;
  area?: string;
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
  /** Managed subject catalog entries (+ Add subject / Manage UI) */
  subjects: ManagedSubject[];
  units: ManagedUnit[];
  contentItems: ManagedContentItem[];
  forumPosts: ManagedForumPost[];
  /** AI-generated questionnaire sets added from Practice UI */
  questionnaires: Questionnaire[];
  /** Optional topic index (mirrors concepts created via + Add topic) */
  topics: ManagedTopic[];
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
  questionnaires: [],
  topics: [],
  updatedAt: 0,
});

/** Coerce legacy string[] subjects and incomplete objects into ManagedSubject[]. */
export function normalizeSubjects(raw: unknown): ManagedSubject[] {
  if (!Array.isArray(raw)) return [];
  const out: ManagedSubject[] = [];
  raw.forEach((entry, index) => {
    if (typeof entry === "string") {
      const name = entry.trim();
      if (!name) return;
      out.push({
        id: `subject-legacy-${index}-${subjectSlug(name)}`,
        slug: subjectSlug(name),
        name,
        shortName: name.replace(/^AP\s+/, ""),
        order: index,
        enabled: true,
        createdAt: 0,
      });
      return;
    }
    if (!entry || typeof entry !== "object") return;
    const s = entry as Partial<ManagedSubject>;
    const name = String(s.name || "").trim();
    if (!name) return;
    out.push({
      id: String(s.id || `subject-${index}-${subjectSlug(name)}`),
      slug: String(s.slug || subjectSlug(name)),
      name,
      shortName: s.shortName ? String(s.shortName) : name.replace(/^AP\s+/, ""),
      description: s.description ? String(s.description) : undefined,
      icon: s.icon ? String(s.icon) : undefined,
      color: s.color ? String(s.color) : undefined,
      order: Number.isFinite(Number(s.order)) ? Number(s.order) : index,
      enabled: s.enabled !== false,
      createdAt: typeof s.createdAt === "number" ? s.createdAt : 0,
    });
  });
  return out;
}

/** Display names for folder grids (Concepts / Formulas / Practice). */
export function managedSubjectNames(subjects: ManagedSubject[] | unknown): string[] {
  return normalizeSubjects(subjects).map((s) => s.name);
}

/** Ensure newer fields exist on older managed-content.json files. */
export function normalizeManagedContent(raw: Partial<ManagedContent> | null | undefined): ManagedContent {
  const base = emptyContent();
  if (!raw) return base;
  return {
    concepts: Array.isArray(raw.concepts) ? raw.concepts : [],
    formulas: Array.isArray(raw.formulas) ? raw.formulas : [],
    documents: Array.isArray(raw.documents) ? raw.documents : [],
    files: Array.isArray(raw.files) ? raw.files : [],
    members: Array.isArray(raw.members) ? raw.members : [],
    folders: Array.isArray(raw.folders) ? raw.folders : [],
    subjects: normalizeSubjects(raw.subjects),
    units: Array.isArray(raw.units) ? raw.units : [],
    contentItems: Array.isArray(raw.contentItems) ? raw.contentItems : [],
    forumPosts: Array.isArray(raw.forumPosts) ? raw.forumPosts : [],
    questionnaires: Array.isArray(raw.questionnaires) ? raw.questionnaires : [],
    topics: Array.isArray(raw.topics) ? raw.topics : [],
    updatedAt: typeof raw.updatedAt === "number" ? raw.updatedAt : 0,
  };
}

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
 * Repo Save / publish tokens ONLY.
 *
 * Owner setup:
 * - GITHUB_TOKEN = real GitHub PAT for writing managed-content.json to the repo
 * - CONTENT_GITHUB_TOKEN = GitHub Models AI key (see lib/ai-client.ts) — NOT used here
 */
export function githubAuthCandidates(override?: string | null): string[] {
  const fromClient = sanitizeGithubToken(override);
  const envOnes = [process.env.GITHUB_TOKEN, process.env.GH_TOKEN].map(sanitizeGithubToken);

  const ordered: string[] = [];
  const push = (t: string) => {
    if (t && !ordered.includes(t)) ordered.push(t);
  };

  if (fromClient && looksLikeGithubPat(fromClient)) push(fromClient);
  for (const t of envOnes) {
    if (t && looksLikeGithubPat(t)) push(t);
  }
  for (const t of envOnes) {
    if (t) push(t);
  }
  return ordered;
}

/** First usable write token (UI override → GITHUB_TOKEN → GH_TOKEN). */
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
        "No GitHub write token. Set GITHUB_TOKEN on Vercel to your real repo-write PAT (ghp_ / github_pat_), Redeploy, leave the optional GitHub field empty. CONTENT_GITHUB_TOKEN is for GitHub Models AI only — it is not used for Save.",
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
      " Bad credentials: GITHUB_TOKEN on Vercel is wrong/expired/revoked. Put your real repo-write PAT into GITHUB_TOKEN, Redeploy. CONTENT_GITHUB_TOKEN is for GitHub Models AI (not Save). Do not paste the content change code into the GitHub token field.";
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
      return normalizeManagedContent(JSON.parse(fromGh.text) as ManagedContent);
    } catch {
      // fall through
    }
  }
  return normalizeManagedContent(await readJsonFile(CONTENT_PATH, emptyContent()));
}

export async function saveManagedContent(
  data: ManagedContent,
  token?: string
): Promise<{ mode: "github" | "local" }> {
  const next = { ...normalizeManagedContent(data), updatedAt: Date.now() };
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
