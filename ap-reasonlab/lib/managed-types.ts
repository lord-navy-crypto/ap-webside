/**
 * Client-safe managed-content types + pure helpers.
 * Do NOT import fs/node APIs here — used by "use client" components.
 */
import type { Concept, Formula, Questionnaire } from "@/lib/types";
import { AP_CATALOG, subjectSlug } from "@/data/ap-catalog";

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

/** Site-wide knobs controlled from Manage (persisted in managed-content.json). */
export type ManagedSiteSettings = {
  /**
   * When true, Default website API uses the same mid-tier (Advanced) models as BYOK.
   * When false, Default website API stays Instant / lowest.
   */
  advancedDefault: boolean;
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
  /** Soft-deleted items recoverable from Macintosh HD Recycle Bin */
  recycleBin: ManagedRecycleEntry[];
  settings: ManagedSiteSettings;
  updatedAt: number;
};

/** Snapshot of a deleted file/concept/etc for Macintosh HD restore. */
export type ManagedRecycleEntry = {
  id: string;
  target:
    | "file"
    | "document"
    | "folder"
    | "concept"
    | "topic"
    | "formula"
    | "questionnaire"
    | "content_item"
    | "member";
  label: string;
  deletedAt: number;
  payload: unknown;
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

export function emptySiteSettings(): ManagedSiteSettings {
  return { advancedDefault: false };
}

export function normalizeSiteSettings(raw: unknown): ManagedSiteSettings {
  const base = emptySiteSettings();
  if (!raw || typeof raw !== "object") return base;
  const s = raw as Partial<ManagedSiteSettings>;
  return {
    advancedDefault: Boolean(s.advancedDefault),
  };
}

export function emptyManagedContent(): ManagedContent {
  return {
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
    recycleBin: [],
    settings: emptySiteSettings(),
    updatedAt: 0,
  };
}

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

/** Merge built-in AP catalog into managed subjects so hubs/Manage never look empty. */
export function mergeBuiltinSubjects(subjects: ManagedSubject[]): ManagedSubject[] {
  const bySlug = new Map<string, ManagedSubject>();
  AP_CATALOG.forEach((builtIn, index) => {
    bySlug.set(builtIn.slug, {
      id: builtIn.id.startsWith("subject-") ? builtIn.id : `subject-${builtIn.slug}`,
      slug: builtIn.slug,
      name: builtIn.name,
      shortName: builtIn.shortName,
      description: builtIn.description,
      icon: builtIn.icon,
      color: builtIn.color,
      order: builtIn.order ?? index,
      enabled: true,
      createdAt: 0,
    });
  });
  normalizeSubjects(subjects).forEach((subject) => {
    const existing = bySlug.get(subject.slug);
    if (!existing) {
      bySlug.set(subject.slug, subject);
      return;
    }
    bySlug.set(subject.slug, {
      ...existing,
      id: subject.id || existing.id,
      name: subject.name || existing.name,
      shortName: subject.shortName || existing.shortName,
      description: subject.description || existing.description,
      icon: subject.icon || existing.icon,
      color: subject.color || existing.color,
      order: Number.isFinite(subject.order) ? subject.order : existing.order,
      enabled: subject.enabled !== false,
      createdAt: subject.createdAt || existing.createdAt,
    });
  });
  return [...bySlug.values()].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

/** Ensure newer fields exist on older managed-content.json files. */
export function normalizeManagedContent(
  raw: Partial<ManagedContent> | null | undefined
): ManagedContent {
  const base = emptyManagedContent();
  if (!raw) {
    return { ...base, subjects: mergeBuiltinSubjects([]) };
  }
  return {
    concepts: Array.isArray(raw.concepts) ? raw.concepts : [],
    formulas: Array.isArray(raw.formulas) ? raw.formulas : [],
    documents: Array.isArray(raw.documents) ? raw.documents : [],
    files: Array.isArray(raw.files) ? raw.files : [],
    members: Array.isArray(raw.members) ? raw.members : [],
    folders: Array.isArray(raw.folders) ? raw.folders : [],
    subjects: mergeBuiltinSubjects(normalizeSubjects(raw.subjects)),
    units: Array.isArray(raw.units) ? raw.units : [],
    contentItems: Array.isArray(raw.contentItems) ? raw.contentItems : [],
    forumPosts: Array.isArray(raw.forumPosts) ? raw.forumPosts : [],
    questionnaires: Array.isArray(raw.questionnaires) ? raw.questionnaires : [],
    topics: Array.isArray(raw.topics) ? raw.topics : [],
    recycleBin: Array.isArray((raw as Partial<ManagedContent>).recycleBin)
      ? ((raw as Partial<ManagedContent>).recycleBin as ManagedRecycleEntry[])
      : [],
    settings: normalizeSiteSettings(raw.settings),
    updatedAt: typeof raw.updatedAt === "number" ? raw.updatedAt : 0,
  };
}

export function uid(prefix = "id"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
