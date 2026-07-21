import Link from "next/link";
import { collaborators } from "@/data/brand";

export default function PartnersPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 px-6 py-8 text-white shadow-lg">
        <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
          PARTNERS OPEN
        </span>
        <h1 className="mt-3 text-3xl font-bold">Partners</h1>
        <p className="mt-2 max-w-2xl text-brand-100">
          Collaborators can help manage Results. Partners can use the Manager UI to upload
          concepts, formulas, and documents. Full admin can promote registered users to partner.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
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
      </section>

      <section className="card space-y-3 text-sm text-slate-700">
        <h2 className="text-lg font-semibold text-slate-900">How partners get access</h2>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            Partner registers at{" "}
            <Link href="/register" className="text-brand-600 hover:underline">
              /register
            </Link>{" "}
            with their name + password.
          </li>
          <li>
            Admin opens{" "}
            <Link href="/admin" className="text-brand-600 hover:underline">
              Manager UI
            </Link>{" "}
            → Users / Partners → set role to <strong>partner</strong>.
          </li>
          <li>
            Or use the shared partner password (env <code>PARTNER_PASSWORD</code>, default{" "}
            <code>results-partner</code> until you change it on Vercel).
          </li>
          <li>
            GitHub write collaborator{" "}
            <a
              href="https://github.com/shulai-ui"
              className="text-brand-600 hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              shulai-ui
            </a>{" "}
            is already open on the repo.
          </li>
        </ol>
        <Link href="/admin" className="btn-primary inline-flex">
          Open Manager UI
        </Link>
      </section>
    </div>
  );
}
