/**
 * Client-side persistence using IndexedDB.
 * Used by /picture, /image-gen, and /learning-box pages.
 * All data stays in the user's browser — nothing is uploaded to a server.
 */

const DB_NAME = "ap-reasonlab";
const DB_VERSION = 2;

export type ImageKind = "uploaded" | "generated";

export interface StoredImage {
  id: string;
  kind: ImageKind;
  name: string;
  dataUrl: string;
  note?: string;
  tags: string[];
  createdAt: number;
}

export interface StoredDocument {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface LearningBoxItem {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB not available"));
  }
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("images")) {
        const store = db.createObjectStore("images", { keyPath: "id" });
        store.createIndex("kind", "kind", { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
      if (!db.objectStoreNames.contains("documents")) {
        const store = db.createObjectStore("documents", { keyPath: "id" });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
      if (!db.objectStoreNames.contains("learningBox")) {
        const store = db.createObjectStore("learningBox", { keyPath: "id" });
        store.createIndex("category", "category", { unique: false });
      }
      // Keep empty private* stores if created in v2 so existing browsers don't break.
      if (!db.objectStoreNames.contains("privateFiles")) {
        db.createObjectStore("privateFiles", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("privateDocs")) {
        db.createObjectStore("privateDocs", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("privateFolders")) {
        db.createObjectStore("privateFolders", { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(store, mode);
        const req = fn(transaction.objectStore(store));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      })
  );
}

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// ── Images ──
export async function saveImage(image: Omit<StoredImage, "id" | "createdAt">): Promise<StoredImage> {
  const record: StoredImage = { ...image, id: uid(), createdAt: Date.now() };
  await tx("images", "readwrite", (s) => s.add(record));
  return record;
}

export async function getImages(kind?: ImageKind): Promise<StoredImage[]> {
  const all = await tx<StoredImage[]>("images", "readonly", (s) => s.getAll());
  return all
    .filter((img) => !kind || img.kind === kind)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function deleteImage(id: string): Promise<void> {
  await tx("images", "readwrite", (s) => s.delete(id));
}

// ── Documents ──
export async function saveDocument(doc: Omit<StoredDocument, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<StoredDocument> {
  const now = Date.now();
  if (doc.id) {
    const existing = await tx<StoredDocument | undefined>("documents", "readonly", (s) => s.get(doc.id!));
    if (existing) {
      const updated: StoredDocument = { ...existing, ...doc, id: doc.id, updatedAt: now };
      await tx("documents", "readwrite", (s) => s.put(updated));
      return updated;
    }
  }
  const record: StoredDocument = {
    id: doc.id ?? uid(),
    title: doc.title,
    content: doc.content,
    tags: doc.tags,
    createdAt: now,
    updatedAt: now,
  };
  await tx("documents", "readwrite", (s) => s.add(record));
  return record;
}

export async function getDocuments(): Promise<StoredDocument[]> {
  const all = await tx<StoredDocument[]>("documents", "readonly", (s) => s.getAll());
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function deleteDocument(id: string): Promise<void> {
  await tx("documents", "readwrite", (s) => s.delete(id));
}

// ── Learning Box ──
export async function saveLearningItem(item: Omit<LearningBoxItem, "id" | "createdAt"> & { id?: string }): Promise<LearningBoxItem> {
  if (item.id) {
    const existing = await tx<LearningBoxItem | undefined>("learningBox", "readonly", (s) => s.get(item.id!));
    if (existing) {
      const updated: LearningBoxItem = { ...existing, ...item, id: item.id };
      await tx("learningBox", "readwrite", (s) => s.put(updated));
      return updated;
    }
  }
  const record: LearningBoxItem = {
    id: item.id ?? uid(),
    title: item.title,
    content: item.content,
    category: item.category,
    createdAt: Date.now(),
  };
  await tx("learningBox", "readwrite", (s) => s.add(record));
  return record;
}

export async function getLearningItems(): Promise<LearningBoxItem[]> {
  const all = await tx<LearningBoxItem[]>("learningBox", "readonly", (s) => s.getAll());
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

export async function deleteLearningItem(id: string): Promise<void> {
  await tx("learningBox", "readwrite", (s) => s.delete(id));
}

export async function getRandomLearningItem(excludeId?: string): Promise<LearningBoxItem | null> {
  const all = await getLearningItems();
  const pool = excludeId ? all.filter((i) => i.id !== excludeId) : all;
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}
