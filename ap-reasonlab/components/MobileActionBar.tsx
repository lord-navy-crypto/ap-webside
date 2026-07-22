"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/ap", label: "AP" },
  { href: "/search", label: "Search" },
  { href: "/forum", label: "Forum" },
] as const;

export default function MobileActionBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile shortcuts"
      className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-3 rounded-2xl border border-slate-200 bg-white/95 p-1.5 shadow-xl backdrop-blur md:hidden"
    >
      {items.map((item) => {
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
    </nav>
  );
}
