"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { brand } from "@/data/brand";

const primaryLinks = [
  { href: "/ap", label: "AP" },
  { href: "/academic", label: "Academic" },
  { href: "/code", label: "Code" },
  { href: "/forum", label: "Forum" },
  { href: "/search", label: "Search" },
];

const moreGroups = [
  {
    label: "General",
    links: [
      { href: "/", label: "Home" },
      { href: "/about", label: "About" },
    ],
  },
  {
    label: "Admin & developer",
    links: [
      { href: "/manage", label: "Manage content" },
      { href: "/admin", label: "Admin guide" },
      { href: "/partners", label: "Partners" },
    ],
  },
] as const;

const moreLinks: ReadonlyArray<{ href: string; label: string }> = moreGroups.reduce<
  Array<{ href: string; label: string }>
>((links, group) => [...links, ...group.links], []);

function linkIsActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Nav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!moreOpen) return;
    function onPointerDown(event: MouseEvent) {
      if (!moreRef.current?.contains(event.target as Node)) {
        setMoreOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMoreOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [moreOpen]);

  const moreActive = moreLinks.some((link) => linkIsActive(pathname, link.href));

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
            R
          </span>
          <span className="text-lg font-bold text-slate-900">{brand.name}</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {primaryLinks.map((link) => {
            const active = linkIsActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  active
                    ? "inline-flex items-center justify-center rounded-xl bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-700"
                    : "btn-ghost px-3"
                }
                aria-current={active ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}

          <div className="relative" ref={moreRef}>
            <button
              type="button"
              className={
                moreOpen || moreActive
                  ? "inline-flex items-center justify-center rounded-xl bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-700"
                  : "btn-ghost px-3"
              }
              aria-expanded={moreOpen}
              aria-haspopup="menu"
              onClick={() => setMoreOpen((value) => !value)}
            >
              More
            </button>
            {moreOpen && (
              <div
                role="menu"
                className="absolute right-0 z-50 mt-2 min-w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
              >
                {moreGroups.map((group, index) => (
                  <div
                    key={group.label}
                    className={index > 0 ? "mt-2 border-t border-slate-100 pt-2" : undefined}
                  >
                    <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      {group.label}
                    </p>
                    {group.links.map((link) => {
                      const active = linkIsActive(pathname, link.href);
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          role="menuitem"
                          className={
                            active
                              ? "block rounded-lg bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-700"
                              : "block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                          }
                          aria-current={active ? "page" : undefined}
                          onClick={() => setMoreOpen(false)}
                        >
                          {link.label}
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
