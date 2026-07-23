"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEditorMode } from "@/components/EditorModeProvider";

const moreGroups = [
  {
    label: "Explore",
    links: [
      { href: "/", label: "Home" },
      { href: "/academic", label: "Academic" },
      { href: "/code", label: "Code" },
      { href: "/search", label: "Search" },
      { href: "/hints", label: "AI Toolbox" },
      { href: "/forum", label: "Forum" },
    ],
  },
  {
    label: "Admin & developer",
    links: [
      { href: "/manage", label: "Manage content" },
      { href: "/admin", label: "Admin guide" },
      { href: "/partners", label: "Partners" },
      { href: "/about", label: "About" },
    ],
  },
] as const;

export default function MobileActionBar() {
  const pathname = usePathname();
  const { editor } = useEditorMode();
  const [moreOpen, setMoreOpen] = useState(false);
  const visibleMoreGroups = moreGroups.map((group) =>
    group.label === "Admin & developer" && editor?.level === "master"
      ? {
          ...group,
          links: [...group.links, { href: "/ai-developer", label: "AI Developer" }],
        }
      : group
  );
  const moreActive = visibleMoreGroups.some((group) =>
    group.links.some(
      (link) => pathname === link.href || (link.href !== "/" && pathname.startsWith(`${link.href}/`))
    )
  );

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!moreOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMoreOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [moreOpen]);

  return (
    <>
      {moreOpen && (
        <>
          <button
            type="button"
            aria-label="Close More menu"
            className="fixed inset-0 z-40 bg-slate-950/25 md:hidden"
            onClick={() => setMoreOpen(false)}
          />
          <section
            id="mobile-more-menu"
            aria-label="More navigation"
            className="fixed inset-x-3 z-50 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl md:hidden"
            style={{ bottom: "calc(env(safe-area-inset-bottom) + 4.75rem)" }}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">More</h2>
              <button
                type="button"
                className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
                onClick={() => setMoreOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {visibleMoreGroups.map((group) => (
                <div key={group.label}>
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {group.label}
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    {group.links.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      <nav
        aria-label="Mobile shortcuts"
        className="fixed inset-x-3 z-50 grid grid-cols-3 rounded-2xl border border-slate-200 bg-white/95 p-1.5 shadow-xl backdrop-blur md:hidden"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}
      >
        {[
          { href: "/ap", label: "AP" },
          { href: "/english", label: "English" },
        ].map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                active
                  ? "rounded-xl bg-brand-600 px-3 py-2 text-center text-xs font-semibold text-white"
                  : "rounded-xl px-3 py-2 text-center text-xs font-semibold text-slate-700"
              }
              aria-current={active ? "page" : undefined}
            >
              {item.label}
            </Link>
          );
        })}
        <button
          type="button"
          className={
            moreOpen || moreActive
              ? "rounded-xl bg-brand-600 px-3 py-2 text-center text-xs font-semibold text-white"
              : "rounded-xl px-3 py-2 text-center text-xs font-semibold text-slate-700"
          }
          aria-expanded={moreOpen}
          aria-controls="mobile-more-menu"
          onClick={() => setMoreOpen((value) => !value)}
        >
          More
        </button>
      </nav>
    </>
  );
}
