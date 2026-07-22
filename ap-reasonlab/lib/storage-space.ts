/** Per-folder storage keys: each area + space is an isolated bucket. */

export const ROOT_SPACE = "_root";

export function normalizeSpace(space?: string | null): string {
  const s = (space || "").trim();
  return s || ROOT_SPACE;
}

export function folderSpaceId(folderId: string): string {
  return `folder:${folderId}`;
}

export function isFolderSpace(space: string): boolean {
  return space.startsWith("folder:");
}

export function parseFolderId(space: string): string | null {
  if (!isFolderSpace(space)) return null;
  return space.slice("folder:".length) || null;
}

/** Build navigation URL for a storage space under a page base path. */
export function spaceHref(
  basePath: string,
  space: string,
  extra?: Record<string, string>
): string {
  const params = new URLSearchParams(extra);
  if (space === ROOT_SPACE) {
    // clear subject/folder
  } else if (isFolderSpace(space)) {
    const id = parseFolderId(space);
    if (id) params.set("folder", id);
  } else {
    params.set("subject", space);
  }
  const q = params.toString();
  return q ? `${basePath}?${q}` : basePath;
}

export function spaceFromSearchParams(params: {
  subject?: string | null;
  folder?: string | null;
}): string {
  if (params.folder?.trim()) return folderSpaceId(params.folder.trim());
  if (params.subject?.trim()) return params.subject.trim();
  return ROOT_SPACE;
}

export function matchesSpace(
  item: { area?: string; space?: string },
  area: string,
  space: string
): boolean {
  const itemArea = item.area || "";
  const itemSpace = normalizeSpace(item.space);
  if (!item.area && !item.space) {
    // Legacy unscoped rows: only show in materials root to avoid leaking everywhere
    return area === "materials" && space === ROOT_SPACE;
  }
  return itemArea === area && itemSpace === space;
}

export function spaceLabel(space: string, folderTitle?: string): string {
  if (space === ROOT_SPACE) return "This area (root)";
  if (isFolderSpace(space)) return folderTitle || "Custom folder";
  return space;
}
