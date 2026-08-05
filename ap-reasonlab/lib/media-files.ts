/**
 * Shared helpers for managed media files (images vs other uploads).
 * List APIs strip dataUrl — hydrate via GET /api/edit?fileId= when needed.
 */
import type { ManagedFile } from "@/lib/managed-types";
import { readResponseJson } from "@/lib/safe-json";

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|bmp|svg|heic|avif)$/i;

/** In-memory cache so list thumbs / sidebars don't refetch the same file. */
const dataUrlCache = new Map<string, string>();

export function isImageFile(file: {
  name?: string;
  mime?: string;
  /** Browser File.type */
  type?: string;
  dataUrl?: string;
}): boolean {
  const mime = file.mime || file.type || "";
  const name = file.name || "";
  return Boolean(
    mime.startsWith("image/") ||
      file.dataUrl?.startsWith("data:image") ||
      IMAGE_EXT.test(name)
  );
}

export async function fetchManagedFileById(fileId: string): Promise<ManagedFile> {
  const res = await fetch(`/api/edit?fileId=${encodeURIComponent(fileId)}`, {
    cache: "no-store",
  });
  const parsed = await readResponseJson<{ file?: ManagedFile; error?: string }>(res);
  if (!parsed.ok) throw new Error(parsed.error);
  if (!res.ok || !parsed.data.file) {
    throw new Error(parsed.data.error || "File unavailable");
  }
  const file = parsed.data.file;
  if (file.dataUrl) dataUrlCache.set(fileId, file.dataUrl);
  return file;
}

export async function fetchManagedFileDataUrl(fileId: string): Promise<string> {
  const cached = dataUrlCache.get(fileId);
  if (cached) return cached;
  const file = await fetchManagedFileById(fileId);
  if (!file.dataUrl) throw new Error("Preview unavailable");
  return file.dataUrl;
}

export function rememberManagedFileDataUrl(fileId: string, dataUrl: string): void {
  if (fileId && dataUrl.startsWith("data:")) dataUrlCache.set(fileId, dataUrl);
}
