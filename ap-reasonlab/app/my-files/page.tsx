"use client";

import Link from "next/link";
import PrivateFileManager from "@/components/PrivateFileManager";

export default function MyFilesPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/academic" className="text-sm text-brand-600 hover:underline">
          ← Academic Platform
        </Link>
        <h1 className="mt-2 text-3xl font-bold">My Files</h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Your own private file manager. Everything here stays in this browser — not listed on the
          public site, and not visible to other visitors. Use change-code publish only when you
          intentionally want something shared.
        </p>
      </div>

      <PrivateFileManager title="Private library" />
    </div>
  );
}
