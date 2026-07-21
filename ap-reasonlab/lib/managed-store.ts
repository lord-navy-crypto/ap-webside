import { readFile, writeFile } from "fs/promises";
import path from "path";
import type { Concept, Formula } from "@/lib/types";

export type ManagedDocument = {
  id: string;
  title: string;
  content: string;
  category: string;
  updatedAt: number;
};

export type ManagedFile = {
  id: string;
  name: string;
  mime: string;
  /** Small text/base64 payload for simple uploads (keep under ~1MB). */
  dataUrl?: string;
  note?: string;
  uploadedAt: number;
  uploadedBy?: string;
};

export type ManagedContent = {
  concepts: Concept[];
  formulas: Formula[];
  documents: ManagedDocument[];
  files: ManagedFile[];
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
  updatedAt: 0,
});

const emptyUsers = (): UsersFile => ({ users: [], updatedAt: 0 });

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

async function githubWrite(filePathInRepo: string, content: string, message: string): Promise<boolean> {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const repo = process.env.GITHUB_REPO || "lord-navy-crypto/ap-webside";
  const branch = process.env.GITHUB_BRANCH || "main";
  if (!token) return false;

  const apiPath = filePathInRepo.replace(/^\/+/, "");
  const url = `https://api.github.com/repos/${repo}/contents/${apiPath}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
  };

  let sha: string | undefined;
  const getRes = await fetch(`${url}?ref=${encodeURIComponent(branch)}`, { headers });
  if (getRes.ok) {
    const body = await getRes.json();
    sha = body.sha;
  }

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

  return putRes.ok;
}

export async function loadManagedContent(): Promise<ManagedContent> {
  return readJsonFile(CONTENT_PATH, emptyContent());
}

export async function saveManagedContent(data: ManagedContent): Promise<{ mode: "github" | "local" }> {
  const next = { ...data, updatedAt: Date.now() };
  const text = JSON.stringify(next, null, 2) + "\n";
  const repoPath = "ap-reasonlab/data/managed-content.json";
  const viaGithub = await githubWrite(repoPath, text, "chore: update managed content via Admin UI");
  if (viaGithub) return { mode: "github" };
  await writeJsonFile(CONTENT_PATH, next);
  return { mode: "local" };
}

export async function loadUsers(): Promise<UsersFile> {
  return readJsonFile(USERS_PATH, emptyUsers());
}

export async function saveUsers(data: UsersFile): Promise<{ mode: "github" | "local" }> {
  const next = { ...data, updatedAt: Date.now() };
  const text = JSON.stringify(next, null, 2) + "\n";
  const repoPath = "ap-reasonlab/data/users.json";
  const viaGithub = await githubWrite(repoPath, text, "chore: update users via Admin UI");
  if (viaGithub) return { mode: "github" };
  await writeJsonFile(USERS_PATH, next);
  return { mode: "local" };
}

export function uid(prefix = "id"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
