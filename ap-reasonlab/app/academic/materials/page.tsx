"use client";

import Link from "next/link";
import UploadAndShow from "@/components/UploadAndShow";

export default function ManagedMaterialsPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/academic" className="text-sm text-brand-600 hover:underline">
          ← Academic Platform
        </Link>
        <h1 className="mt-2 text-3xl font-bold">Shared learning materials</h1>
        <p className="mt-2 text-slate-600">
          Upload on the left. Files and documents appear on the right right after a successful save.
        </p>
      </div>

      <UploadAndShow alsoShow={["document", "folder"]} folderArea="materials" title="All shared files & documents" />
    </div>
  );
}
