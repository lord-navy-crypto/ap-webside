import Link from "next/link";

const resources = [
  {
    id: "python",
    title: "Python",
    description: "Snippets, notebooks, and study scripts. Editor coming — start with saved resources.",
    href: "/code/python",
  },
  {
    id: "java",
    title: "Java",
    description: "Java examples and practice scaffolding. Editor can be embedded later.",
    href: "/code/java",
  },
  {
    id: "web",
    title: "Web / HTML",
    description: "Small web demos and embeds. You can also iframe external labs.",
    href: "/code/web",
  },
];

export default function CodePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Code Resource</h1>
        <p className="mt-2 text-slate-600">
          Programming area under Results — separate from the AP box. Open a language folder
          to browse resources. In-browser editors (Python / Java) can be added as embeds.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {resources.map((r) => (
          <Link key={r.id} href={r.href} className="card-hover group flex items-start gap-3">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-xl">
              📁
            </span>
            <div>
              <h2 className="font-semibold group-hover:text-brand-700">{r.title}</h2>
              <p className="mt-1 text-sm text-slate-600">{r.description}</p>
            </div>
          </Link>
        ))}
      </div>

      <section className="card space-y-2 text-sm text-slate-600">
        <h2 className="text-lg font-semibold text-slate-900">Can we put editors or a website here?</h2>
        <p>
          <strong>Yes.</strong> Common options:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Embed an editor</strong> — Monaco (VS Code–like) or CodeMirror for Python/Java
            text editing in the browser.
          </li>
          <li>
            <strong>Embed a runnable lab</strong> — iframe Replit, StackBlitz, CodeSandbox, or
            JupyterLite so students can run code without leaving Results.
          </li>
          <li>
            <strong>Embed another website</strong> — iframe any public URL (labs, docs) if the
            site allows embedding (some block iframes with X-Frame-Options).
          </li>
        </ul>
        <p className="pt-2">
          Trade-off: embeds are fast to add; full custom runners need more work and may need
          backend compute. Say which stack you want and we can wire it into these folders.
        </p>
      </section>
    </div>
  );
}
