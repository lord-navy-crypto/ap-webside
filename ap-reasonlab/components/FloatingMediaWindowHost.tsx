"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";
import FloatingMediaWindow from "@/components/FloatingMediaWindow";
import {
  ROOT_SPACE,
  folderSpaceId,
  spaceFromSearchParams,
} from "@/lib/storage-space";

function resolveContext(pathname: string, search: URLSearchParams) {
  const subject = search.get("subject");
  const folder = search.get("folder");
  const spaceFromQuery = spaceFromSearchParams({ subject, folder });

  if (pathname.startsWith("/manage")) {
    return null;
  }

  if (pathname.startsWith("/learning-box") || pathname.startsWith("/picture")) {
    return {
      folderArea: "learning",
      spaceKey: ROOT_SPACE,
      title: "Learning Media",
      alsoShow: ["document", "folder"] as const,
      enablePrivateImages: true,
    };
  }

  if (pathname.startsWith("/hints") || pathname.startsWith("/image-gen")) {
    return {
      folderArea: "hints",
      spaceKey: ROOT_SPACE,
      title: "Toolbox Media",
      alsoShow: ["document", "folder"] as const,
      enablePrivateImages: true,
    };
  }

  if (pathname.startsWith("/concepts")) {
    return {
      folderArea: "concepts",
      spaceKey: spaceFromQuery,
      title: "Concepts Media",
      alsoShow: ["topic", "concept", "document", "folder", "subject"] as const,
      spaceBasePath: "/concepts",
      defaultSubject: subject || undefined,
      enablePrivateImages: true,
    };
  }

  if (pathname.startsWith("/formulas")) {
    return {
      folderArea: "formulas",
      spaceKey: spaceFromQuery,
      title: "Formulas Media",
      alsoShow: ["formula", "document", "folder"] as const,
      spaceBasePath: "/formulas",
      defaultSubject: subject || undefined,
      enablePrivateImages: true,
    };
  }

  if (pathname.startsWith("/practice") || pathname.startsWith("/questionnaires")) {
    return {
      folderArea: "practice",
      spaceKey: spaceFromQuery,
      title: "Practice Media",
      alsoShow: ["questionnaire", "document", "folder"] as const,
      spaceBasePath: "/practice",
      defaultSubject: subject || undefined,
      enablePrivateImages: true,
    };
  }

  if (pathname.startsWith("/academic/materials")) {
    return {
      folderArea: "materials",
      spaceKey: ROOT_SPACE,
      title: "Materials Media",
      alsoShow: ["document", "folder"] as const,
      enablePrivateImages: true,
    };
  }

  if (pathname.startsWith("/academic")) {
    return {
      folderArea: "academic",
      spaceKey: ROOT_SPACE,
      title: "Academic Media",
      alsoShow: ["document", "folder"] as const,
      enablePrivateImages: true,
    };
  }

  if (pathname.startsWith("/partners")) {
    return {
      folderArea: "partners",
      spaceKey: ROOT_SPACE,
      title: "Partners Media",
      alsoShow: ["member", "document"] as const,
      enablePrivateImages: false,
    };
  }

  if (pathname.startsWith("/code/web")) {
    return {
      folderArea: "code-web",
      spaceKey: ROOT_SPACE,
      title: "Web Code Media",
      alsoShow: ["document", "folder"] as const,
      enablePrivateImages: true,
    };
  }
  if (pathname.startsWith("/code/python")) {
    return {
      folderArea: "code-python",
      spaceKey: ROOT_SPACE,
      title: "Python Media",
      alsoShow: ["document", "folder"] as const,
      enablePrivateImages: true,
    };
  }
  if (pathname.startsWith("/code/java")) {
    return {
      folderArea: "code-java",
      spaceKey: ROOT_SPACE,
      title: "Java Media",
      alsoShow: ["document", "folder"] as const,
      enablePrivateImages: true,
    };
  }
  if (pathname.startsWith("/code")) {
    return {
      folderArea: "code",
      spaceKey: ROOT_SPACE,
      title: "Code Media",
      alsoShow: ["document", "folder"] as const,
      enablePrivateImages: true,
    };
  }

  if (pathname.startsWith("/ap/")) {
    const parts = pathname.split("/").filter(Boolean);
    // /ap/[subject] or /ap/[subject]/...
    if (parts.length >= 2) {
      const slug = parts[1]!;
      return {
        folderArea: "ap-subject",
        spaceKey: slug,
        title: `AP · ${slug}`,
        alsoShow: ["document", "folder"] as const,
        defaultSubject: slug,
        enablePrivateImages: true,
      };
    }
  }

  if (pathname.startsWith("/ap")) {
    return {
      folderArea: "ap",
      spaceKey: ROOT_SPACE,
      title: "AP Hub Media",
      alsoShow: ["document", "folder"] as const,
      enablePrivateImages: true,
    };
  }

  if (pathname === "/" || pathname.startsWith("/home")) {
    return {
      folderArea: "site",
      spaceKey: "home",
      title: "Home Media",
      alsoShow: ["document", "folder"] as const,
      enablePrivateImages: true,
    };
  }

  // Fallback for any other page
  return {
    folderArea: "site",
    spaceKey: folder ? folderSpaceId(folder) : ROOT_SPACE,
    title: "Page Media",
    alsoShow: ["document", "folder"] as const,
    enablePrivateImages: true,
  };
}

function HostInner() {
  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();

  const ctx = useMemo(
    () => resolveContext(pathname, searchParams),
    [pathname, searchParams]
  );

  if (!ctx) return null;

  return (
    <FloatingMediaWindow
      folderArea={ctx.folderArea}
      spaceKey={ctx.spaceKey}
      title={ctx.title}
      alsoShow={[...ctx.alsoShow]}
      defaultSubject={"defaultSubject" in ctx ? ctx.defaultSubject : undefined}
      spaceBasePath={"spaceBasePath" in ctx ? ctx.spaceBasePath : undefined}
      enablePrivateImages={ctx.enablePrivateImages}
    />
  );
}

/** Top-right Mac-style media window on every page (Manage uses full Finder instead). */
export default function FloatingMediaWindowHost() {
  return (
    <Suspense fallback={null}>
      <HostInner />
    </Suspense>
  );
}
