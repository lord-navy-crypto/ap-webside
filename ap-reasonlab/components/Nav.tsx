import Link from "next/link";
import { brand } from "@/data/brand";

const links = [
  { href: "/", label: "Home" },
  { href: "/ap", label: "AP" },
  { href: "/academic", label: "Academic Platform" },
  { href: "/code", label: "Code" },
  { href: "/forum", label: "Forum" },
  { href: "/about", label: "About" },
];

export default function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
            R
          </span>
          <span className="text-lg font-bold text-slate-900">{brand.name}</span>
        </Link>
        <nav className="flex flex-wrap gap-1">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="btn-ghost">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
