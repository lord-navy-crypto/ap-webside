import Link from "next/link";
import EthicsBanner from "@/components/EthicsBanner";
import { brand, trueJetMembers } from "@/data/brand";

export default function AboutPage() {
  return (
    <div className="space-y-6">
      <section className="card space-y-4">
        <h1 className="text-3xl font-bold">About {brand.name}</h1>
        <p className="text-slate-600">{brand.description}</p>
        <p className="text-slate-600">
          Editors unlock once at{" "}
          <Link href="/login" className="font-medium text-brand-700 hover:underline">
            /login
          </Link>{" "}
          or via the <strong>edit circle</strong> on any page with the{" "}
          <strong>content change code</strong>. After that, saving in this browser does not ask for
          the code again.
        </p>
      </section>

      <EthicsBanner />

      <section className="card space-y-3">
        <h2 className="text-lg font-semibold">Content change code</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
          <li>
            <strong>Content code</strong> — unlock editor login, then add/edit content, partners,
            and upload files.
          </li>
          <li>
            <strong>Master code</strong> — still works for the same edits when needed; normal
            monthly page updates only need the content code.
          </li>
        </ul>
        <p className="text-sm text-slate-600">
          Ask a site admin for the content code. It is not published on this page.
        </p>
        <p className="text-xs text-slate-500">
          Admins set <code>CONTENT_CHANGE_CODE</code> on Vercel. Publishing uses{" "}
          <code>CONTENT_GITHUB_TOKEN</code> (GitHub PAT with Contents write on this repo).
        </p>
      </section>

      <section className="card space-y-3">
        <h2 className="text-lg font-semibold">TrueJet members</h2>
        <ul className="space-y-2 text-sm text-slate-700">
          {trueJetMembers.map((c) => (
            <li key={c.name}>
              <a
                href={c.github}
                className="font-medium text-brand-700 hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                {c.name}
              </a>{" "}
              — {c.role} · @{c.github.replace(/^https?:\/\/github\.com\//i, "")}
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
