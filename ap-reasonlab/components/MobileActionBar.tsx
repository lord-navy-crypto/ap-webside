import Link from "next/link";

export default function MobileActionBar() {
  return (
    <nav aria-label="Mobile shortcuts" className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-3 rounded-2xl border border-slate-200 bg-white/95 p-1.5 shadow-xl backdrop-blur md:hidden">
      <Link href="/ap" className="rounded-xl px-3 py-2 text-center text-xs font-semibold text-slate-700">AP</Link>
      <Link href="/search" className="rounded-xl px-3 py-2 text-center text-xs font-semibold text-slate-700">Search</Link>
      <Link href="/manage" className="rounded-xl bg-brand-600 px-3 py-2 text-center text-xs font-semibold text-white">+ Add</Link>
    </nav>
  );
}
