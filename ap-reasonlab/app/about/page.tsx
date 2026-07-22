import Link from "next/link";
import EthicsBanner from "@/components/EthicsBanner";
import { brand, collaborators } from "@/data/brand";

export default function AboutPage() {
  return (
    <div className="space-y-6">
      <section className="card space-y-4">
        <h1 className="text-3xl font-bold">About {brand.name}</h1>
        <p className="text-slate-600">{brand.description}</p>
        <p className="text-slate-600">
          No login. Every page has a <strong>+</strong> button. Saving asks for a change code.
        </p>
      </section>

      <EthicsBanner />

      <section className="card space-y-3">
        <h2 className="text-lg font-semibold">Change codes</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
          <li>
            <strong>Content code</strong> — add/edit content and upload files. Cannot add members.
          </li>
          <li>
            <strong>Master code</strong> — can do everything, including members on Partners.
          </li>
        </ul>
        <p className="text-sm text-slate-600">
          Ask a site admin for the current codes. They are not published on this page.
        </p>
        <p className="text-xs text-slate-500">
          Admins set them on Vercel with <code>CONTENT_CHANGE_CODE</code> and{" "}
          <code>MASTER_CHANGE_CODE</code>. Also set <code>GITHUB_TOKEN</code> so saves publish.
        </p>
      </section>

      <section className="card space-y-3">
        <h2 className="text-lg font-semibold">GitHub collaborators</h2>
        <ul className="space-y-2 text-sm text-slate-700">
          {collaborators.map((c) => (
            <li key={c.name}>
              <a
                href={c.github}
                className="font-medium text-brand-700 hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                {c.name}
              </a>{" "}
              — {c.role}
            </li>
          ))}
        </ul>
        <Link href="/partners" className="btn-primary inline-flex">
          Partners page
        </Link>
      </section>
    </div>
  );
}
