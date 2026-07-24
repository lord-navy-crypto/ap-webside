"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";
import FloatingMediaWindow from "@/components/FloatingMediaWindow";
import { resolvePageMediaContext } from "@/lib/site-media-map";

function HostInner() {
  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();

  const ctx = useMemo(
    () => resolvePageMediaContext(pathname, searchParams),
    [pathname, searchParams]
  );

  // Manage uses the full Mac Finder backend instead of the corner window.
  if (!ctx) return null;

  return (
    <FloatingMediaWindow
      folderArea={ctx.folderArea}
      spaceKey={ctx.spaceKey}
      title={ctx.title}
      alsoShow={[...ctx.alsoShow]}
      defaultSubject={ctx.defaultSubject}
      spaceBasePath={ctx.spaceBasePath}
    />
  );
}

/** Top-right file display box on every basic site page. */
export default function FloatingMediaWindowHost() {
  return (
    <Suspense fallback={null}>
      <HostInner />
    </Suspense>
  );
}
