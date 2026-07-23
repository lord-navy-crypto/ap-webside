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
          A public display area where everyone can add documents, downloadable files, and folders without a change code.
        </p>
        <p className="mt-2 text-sm text-amber-800">
          Public uploads are visible to everyone. Do not share private information or material you do not have permission to publish. Deletion remains protected by a change code.
        </p>
      </div>

      <UploadAndShow
        alsoShow={["document", "folder"]}
        folderArea="materials"
        spaceKey="_root"
        spaceBasePath="/academic/materials"
        title="Materials storage"
        allowPublicContributions
      />
    </div>
  );
}
