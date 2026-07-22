"use client";

import { useEffect, useState } from "react";
import UploadAndShow from "@/components/UploadAndShow";

type Member = { id: string; name: string; note?: string; addedAt: number };

export default function PartnersPage() {
  const [members, setMembers] = useState<Member[]>([]);

  async function refresh() {
    try {
      const data = await fetch("/api/edit", { cache: "no-store" }).then((r) => r.json());
      setMembers(data.members || []);
    } catch {
      setMembers([]);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 px-6 py-8 text-white shadow-lg">
        <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
          PARTNERS
        </span>
        <h1 className="mt-3 text-3xl font-bold">Partners & members</h1>
        <p className="mt-2 max-w-2xl text-brand-100">
          Add members yourself with the master change code. Put a GitHub username in the note
          (example: github:shulai-ui) to keep them linked to repo collaborators.
        </p>
      </section>

      <UploadAndShow
        alsoShow={["member", "document", "folder"]}
        folderArea="partners"
        spaceKey="_root"
        spaceBasePath="/partners"
        title="Files, docs & folders"
      />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Members ({members.length})</h2>
          <button type="button" onClick={refresh} className="text-xs text-brand-600 hover:underline">
            Refresh list
          </button>
        </div>
        {members.length === 0 ? (
          <div className="card text-sm text-slate-500">
            No members yet. Use + Add member (master code). Note field can hold github:username.
          </div>
        ) : (
          <ul className="grid max-h-80 gap-3 overflow-y-auto sm:grid-cols-2">
            {members.map((m) => (
              <li key={m.id} className="card">
                <p className="font-semibold">{m.name}</p>
                {m.note && <p className="mt-1 text-sm text-slate-600">{m.note}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
