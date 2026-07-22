import { readFile, writeFile } from "fs/promises";
import path from "path";
import type { Concept, Formula, Questionnaire } from "@/lib/types";

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

export type ManagedContent = {
  concepts: Concept[];
  formulas: Formula[];
  documents: ManagedDocument[];
  files: ManagedFile[];
  members: { id: string; name: string; note?: string; addedAt: number }[];
  folders: ManagedFolder[];
  /** Extra subject folders created from the UI (+ Add subject) */
  subjects: string[];
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
  questionnaires: [],
  topics: [],
  updatedAt: 0,
});

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
    subjects: Array.isArray(raw.subjects) ? raw.subjects.map(String) : [],
    questionnaires: Array.isArray(raw.questionnaires) ? raw.questionnaires : [],
    topics: Array.isArray(raw.topics) ? raw.topics : [],
    updatedAt: typeof raw.updatedAt === "number" ? raw.updatedAt : 0,
  };
}

const emptyUsers = (): UsersFile => ({ users: [], updatedAt: 0 });

function repoSettings() {
  return {
    token: process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "",
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
  const { token: envToken, repo, branch } = repoSettings();
  const auth = token || envToken;
  if (!auth) return null;

  const apiPath = filePathInRepo.replace(/^\/+/, "");
  const url = `https://api.github.com/repos/${repo}/contents/${apiPath}?ref=${encodeURIComponent(branch)}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${auth}`,
      Accept: "application/vnd.github+json",
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const body = await res.json();
  if (!body.content || !body.sha) return null;
  const text = Buffer.from(body.content.replace(/\n/g, ""), "base64").toString("utf8");
  return { text, sha: body.sha };
}

async function githubWrite(
  filePathInRepo: string,
  content: string,
  message: string,
  token?: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { token: envToken, repo, branch } = repoSettings();
  const auth = token || envToken;
  if (!auth) {
    return {
      ok: false,
      error:
        "No GitHub token. On Vercel the disk is read-only, so Manager saves need GITHUB_TOKEN (env) or a token pasted in Manager UI.",
    };
  }

  const apiPath = filePathInRepo.replace(/^\/+/, "");
  const url = `https://api.github.com/repos/${repo}/contents/${apiPath}`;
  const headers = {
    Authorization: `Bearer ${auth}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
  };

  let sha: string | undefined;
  const existing = await githubGet(apiPath, auth);
  if (existing) sha = existing.sha;

  const putRes = await fetch(url, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      message,
      content: Buffer.from(content, "utf8").toString("base64"),
      branch,
      sha,
    }),
  });

  if (!putRes.ok) {
    const errText = await putRes.text();
    return {
      ok: false,
      error: `GitHub write failed (${putRes.status}): ${errText.slice(0, 300)}`,
    };
  }
  return { ok: true };
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
