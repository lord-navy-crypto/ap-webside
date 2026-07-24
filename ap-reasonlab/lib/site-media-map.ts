/**
 * Site-wide media map: big section folders → page folders (each maps to a webpage).
 * Used by the top-right Media window and Manage → Mac Finder.
 */

import { ROOT_SPACE, apSubjectHref } from "@/lib/storage-space";
import { AP_CATALOG, getSubjectBySlug } from "@/data/ap-catalog";

export type MediaAlsoShow = Array<
  "concept" | "topic" | "formula" | "document" | "member" | "folder" | "subject" | "questionnaire"
>;

export type SitePageFolder = {
  /** Storage area key (folderArea) */
  area: string;
  /** Storage space key */
  space: string;
  /** Finder / window label */
  label: string;
  /** Matching site path (for linking) */
  href: string;
};

export type SiteSectionFolder = {
  id: string;
  label: string;
  /** Icon hint for Finder desktop */
  icon: string;
  pages: SitePageFolder[];
};

/** Top-level “Macintosh HD” style sections — each page folder is a real webpage. */
export const SITE_SECTION_FOLDERS: SiteSectionFolder[] = [
  {
    id: "home",
    label: "Home",
    icon: "🏠",
    pages: [{ area: "site", space: "home", label: "Home page", href: "/" }],
  },
  {
    id: "ap",
    label: "AP",
    icon: "📘",
    pages: [
      { area: "ap", space: ROOT_SPACE, label: "AP hub", href: "/ap" },
      { area: "concepts", space: ROOT_SPACE, label: "Concepts", href: "/concepts" },
      { area: "formulas", space: ROOT_SPACE, label: "Formulas", href: "/formulas" },
      { area: "practice", space: ROOT_SPACE, label: "Practice", href: "/practice" },
    ],
  },
  {
    id: "english",
    label: "English",
    icon: "🔤",
    pages: [
      { area: "english", space: ROOT_SPACE, label: "English hub", href: "/english" },
      { area: "english", space: "ai", label: "English AI", href: "/english/ai" },
      { area: "english", space: "toefl", label: "TOEFL", href: "/english/toefl" },
      { area: "english", space: "ielts", label: "IELTS", href: "/english/ielts" },
      { area: "english", space: "sat", label: "SAT", href: "/english/sat" },
      { area: "english", space: "vocabulary", label: "Vocabulary", href: "/english/vocabulary" },
      { area: "english", space: "grammar", label: "Grammar", href: "/english/grammar" },
      { area: "english", space: "writing", label: "Writing", href: "/english/writing" },
    ],
  },
  {
    id: "academic",
    label: "Academic",
    icon: "📁",
    pages: [
      { area: "academic", space: ROOT_SPACE, label: "Academic hub", href: "/academic" },
      { area: "materials", space: ROOT_SPACE, label: "Shared materials", href: "/academic/materials" },
      { area: "learning", space: ROOT_SPACE, label: "Private Learning Box", href: "/learning-box" },
    ],
  },
  {
    id: "tools",
    label: "Tools",
    icon: "🛠",
    pages: [
      { area: "tools", space: ROOT_SPACE, label: "Tools hub", href: "/tools" },
      { area: "hints", space: ROOT_SPACE, label: "AI Toolbox", href: "/hints" },
    ],
  },
  {
    id: "code",
    label: "Code",
    icon: "💻",
    pages: [
      { area: "code", space: ROOT_SPACE, label: "Code hub", href: "/code" },
      { area: "code-python", space: ROOT_SPACE, label: "Python", href: "/code/python" },
      { area: "code-java", space: ROOT_SPACE, label: "Java", href: "/code/java" },
      { area: "code-web", space: ROOT_SPACE, label: "Web", href: "/code/web" },
    ],
  },
  {
    id: "forum",
    label: "Forum",
    icon: "💬",
    pages: [{ area: "forum", space: ROOT_SPACE, label: "Forum", href: "/forum" }],
  },
  {
    id: "partners",
    label: "Partners",
    icon: "🤝",
    pages: [{ area: "partners", space: ROOT_SPACE, label: "Partners", href: "/partners" }],
  },
  {
    id: "site",
    label: "Site pages",
    icon: "🗂",
    pages: [
      { area: "site", space: "about", label: "About", href: "/about" },
      { area: "site", space: "search", label: "Search", href: "/search" },
      { area: "site", space: "guide", label: "Guide", href: "/guide" },
      { area: "site", space: "checklist", label: "Checklist", href: "/checklist" },
    ],
  },
];

export type PageMediaContext = {
  folderArea: string;
  spaceKey: string;
  title: string;
  href?: string;
  alsoShow: MediaAlsoShow;
  spaceBasePath?: string;
  defaultSubject?: string;
};

/** Corner Media window: uploads only (files / pictures / documents). */
const UPLOAD_ONLY: MediaAlsoShow = ["document", "folder"];

/**
 * Resolve the current route to the page folder used by the top-right Media window.
 * Every basic site page gets its own bucket.
 */
export function resolvePageMediaContext(
  pathname: string,
  search: URLSearchParams
): PageMediaContext | null {
  if (pathname.startsWith("/manage")) return null;

  const subject = search.get("subject");
  const folder = search.get("folder");

  // AP subject pages — each subject is its own page folder under AP
  if (pathname.startsWith("/ap/")) {
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length >= 2) {
      const slug = decodeURIComponent(parts[1]!);
      const subject = getSubjectBySlug(slug);
      const spaceKey = subject?.name || slug;
      return {
        folderArea: "ap-subject",
        spaceKey,
        title: `AP · ${subject?.shortName || slug}`,
        href: `/ap/${subject?.slug || slug}`,
        alsoShow: UPLOAD_ONLY,
        defaultSubject: spaceKey,
      };
    }
  }

  // Concepts / Formulas / Practice with subject or folder query
  if (pathname.startsWith("/concepts")) {
    const space = folder
      ? `folder:${folder}`
      : subject?.trim() || ROOT_SPACE;
    return {
      folderArea: "concepts",
      spaceKey: space,
      title: subject ? `Concepts · ${subject}` : "Concepts",
      href: pathname + (search.toString() ? `?${search}` : ""),
      alsoShow: UPLOAD_ONLY,
      spaceBasePath: "/concepts",
      defaultSubject: subject || undefined,
    };
  }
  if (pathname.startsWith("/formulas")) {
    const space = folder ? `folder:${folder}` : subject?.trim() || ROOT_SPACE;
    return {
      folderArea: "formulas",
      spaceKey: space,
      title: subject ? `Formulas · ${subject}` : "Formulas",
      href: pathname,
      alsoShow: UPLOAD_ONLY,
      spaceBasePath: "/formulas",
      defaultSubject: subject || undefined,
    };
  }
  if (pathname.startsWith("/practice") || pathname.startsWith("/questionnaires")) {
    const space = folder ? `folder:${folder}` : subject?.trim() || ROOT_SPACE;
    return {
      folderArea: "practice",
      spaceKey: space,
      title: subject ? `Practice · ${subject}` : "Practice",
      href: pathname,
      alsoShow: UPLOAD_ONLY,
      spaceBasePath: "/practice",
      defaultSubject: subject || undefined,
    };
  }

  // Exact / prefix match against the site map (longest href first)
  const allPages = SITE_SECTION_FOLDERS.flatMap((s) => s.pages);
  const sorted = [...allPages].sort((a, b) => b.href.length - a.href.length);
  for (const page of sorted) {
    if (page.href === "/") {
      if (pathname === "/" || pathname.startsWith("/home")) {
        return {
          folderArea: page.area,
          spaceKey: page.space,
          title: page.label,
          href: page.href,
          alsoShow: UPLOAD_ONLY,
        };
      }
      continue;
    }
    if (pathname === page.href || pathname.startsWith(`${page.href}/`)) {
      return {
        folderArea: page.area,
        spaceKey: page.space,
        title: page.label,
        href: page.href,
        alsoShow: page.area === "partners" ? ["member", "document"] : UPLOAD_ONLY,
      };
    }
  }

  // Past-papers deep link on subject pages handled above via ap-subject

  // Fallback — still show a corner window on any other page
  const slug =
    pathname
      .split("/")
      .filter(Boolean)
      .join("-") || "page";
  return {
    folderArea: "site",
    spaceKey: slug,
    title: "Page Media",
    href: pathname,
    alsoShow: UPLOAD_ONLY,
  };
}

/** Every built-in AP subject as its own page folder under Macintosh HD → AP. */
export function apSubjectPageFolders(): SitePageFolder[] {
  return AP_CATALOG.map((subject) => ({
    area: "ap-subject",
    space: subject.name,
    label: subject.shortName,
    href: `/ap/${subject.slug}`,
  }));
}

/** Dynamic AP subject page folders derived from uploaded content + known areas. */
export function collectDynamicPageFolders(
  files: Array<{ area?: string; space?: string }>,
  documents: Array<{ area?: string; space?: string }>,
  managedFolders: Array<{ area?: string; space?: string; title?: string; id?: string }>
): SitePageFolder[] {
  const known = new Set(
    [
      ...SITE_SECTION_FOLDERS.flatMap((s) => s.pages.map((p) => `${p.area}::${p.space}`)),
      ...apSubjectPageFolders().map((p) => `${p.area}::${p.space}`),
    ]
  );
  const extra: SitePageFolder[] = [];
  const seen = new Set<string>();

  const consider = (area?: string, space?: string, label?: string, href?: string) => {
    const a = area || "general";
    const sp = space || ROOT_SPACE;
    const key = `${a}::${sp}`;
    if (known.has(key) || seen.has(key)) return;
    // Skip root placeholders already covered
    if (a === "ap-subject" && sp !== ROOT_SPACE) {
      // Prefer catalog name/slug aliases so we don't duplicate subject folders
      const hit =
        AP_CATALOG.find((s) => s.name === sp) ||
        AP_CATALOG.find((s) => s.slug === sp) ||
        AP_CATALOG.find((s) => s.shortName === sp);
      if (hit) {
        const catalogKey = `${a}::${hit.name}`;
        if (known.has(catalogKey) || seen.has(catalogKey)) return;
      }
      seen.add(key);
      extra.push({
        area: a,
        space: sp,
        label: label || `AP · ${sp}`,
        href: href || apSubjectHref(sp),
      });
      return;
    }
    if (sp.startsWith("folder:")) {
      seen.add(key);
      const id = sp.slice("folder:".length);
      extra.push({
        area: a,
        space: sp,
        label: label || `Folder ${id.slice(0, 8)}`,
        href: href || `/${a}`,
      });
    }
  };

  for (const f of files) consider(f.area, f.space);
  for (const d of documents) consider(d.area, d.space);
  for (const folder of managedFolders) {
    consider(
      folder.area,
      folder.space,
      folder.title,
      folder.area ? `/${folder.area}` : undefined
    );
  }

  return extra;
}
