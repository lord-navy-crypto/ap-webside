"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collaborators } from "@/data/brand";
import ChangePanel from "@/components/ChangePanel";

type Member = { id: string; name: string; note?: string; addedAt: number };

export default function PartnersPage() {
  const [members, setMembers] = useState<Member[]>([]);

  async function refresh() {
    try {
      const data = await fetch("/api/edit").then((r) => r.json());
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
          No accounts. Anyone can browse. To add a member, use the + button and the{" "}
          <strong>master change code</strong>. Content edits elsewhere use the content change code.
        </p>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <ChangePanel mode="member" label="+ Add member" onSaved={refresh} />
        <ChangePanel mode="file" label="+ Upload file" onSaved={refresh} />
        <ChangePanel mode="document" label="+ Add partner note" onSaved={refresh} />
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">GitHub collaborators</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {collaborators.map((c) => (
            <a
              key={c.name}
              href={c.github}
              target="_blank"
              rel="noreferrer"
              className="card-hover flex items-center gap-3"
            >
              {c.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.avatar} alt="" className="h-12 w-12 rounded-full" />
              ) : (
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-lg font-bold text-brand-700">
                  +
                </span>
              )}
              <div>
                <p className="font-semibold">{c.name}</p>
                <p className="text-xs text-slate-500">{c.role}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Members added on site ({members.length})</h2>
        {members.length === 0 ? (
          <div className="card text-sm text-slate-500">
            No members yet. Use + Add member with the master change code.
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {members.map((m) => (
              <li key={m.id} className="card">
                <p className="font-semibold">{m.name}</p>
                {m.note && <p className="mt-1 text-sm text-slate-600">{m.note}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-sm text-slate-500">
        Editing tip: every AP / Academic page has a + button. Save always asks for a change code.{" "}
        <Link href="/admin" className="text-brand-600 hover:underline">
          How editing works →
        </Link>
      </p>
    </div>
  );
}
