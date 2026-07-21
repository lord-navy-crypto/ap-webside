"use client";

import Link from "next/link";

type Folder = {
  id: string;
  title: string;
  subtitle?: string;
  count?: number;
  href: string;
};

export default function FolderGrid({
  folders,
  emptyText = "No folders yet.",
}: {
  folders: Folder[];
  emptyText?: string;
}) {
  if (folders.length === 0) {
    return <div className="card text-sm text-slate-500">{emptyText}</div>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {folders.map((f) => (
        <Link
          key={f.id}
          href={f.href}
          className="card-hover group flex items-start gap-3"
        >
          <span
            className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-xl"
            aria-hidden
          >
            📁
          </span>
          <div className="min-w-0">
            <h2 className="font-semibold text-slate-900 group-hover:text-brand-700">
              {f.title}
            </h2>
            {f.subtitle && (
              <p className="mt-1 text-sm text-slate-600 line-clamp-2">{f.subtitle}</p>
            )}
            {typeof f.count === "number" && (
              <p className="mt-2 text-xs text-slate-400">{f.count} items</p>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
