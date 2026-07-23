import Link from "next/link";

/**
 * Editing help + links. Full content console lives at /manage; unlock at /login.
 */
export default function AdminRedirectPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-3xl font-bold">How editing works now</h1>
      <div className="card space-y-3 text-sm text-slate-700">
        <p>
          Prefer unlocking once at <Link href="/login" className="font-medium text-brand-700 underline">/login</Link>, then use +
          buttons on each page. The full console is at{" "}
          <Link href="/manage" className="font-medium text-brand-700 underline">/manage</Link>.
        </p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            Go to <strong>AP Area</strong> → Concepts / Formulas / Practice (or open a subject
            folder).
          </li>
          <li>
            Use the matching <strong>+</strong> button:
            <ul className="mt-1 list-disc pl-5">
              <li>
                <strong>+ Add subject folder</strong> — Concepts / Formulas / Practice roots
              </li>
              <li>
                <strong>+ Add topic</strong> — inside a Concepts subject
              </li>
              <li>
                <strong>+ Add formula</strong> — inside a Formulas subject
              </li>
              <li>
                <strong>+ Add generated practice set</strong> — inside Practice (e.g. AP Statistics)
              </li>
            </ul>
          </li>
          <li>
            Fill the form, then enter a <strong>change code</strong> (or use your unlocked session) to
            save.
          </li>
        </ol>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Content code</strong> — can change content and upload files; cannot add members.
          </li>
          <li>
            <strong>Master code</strong> — can do everything, including partners/members.
          </li>
        </ul>
        <p className="text-xs text-slate-500">
          Codes are set in Vercel as <code>CONTENT_CHANGE_CODE</code> and{" "}
          <code>MASTER_CHANGE_CODE</code> (see project docs / About). On Vercel you still need{" "}
          <code>GITHUB_TOKEN</code> so saves can publish.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href="/ap" className="btn-primary">
          Open AP Area
        </Link>
        <Link href="/manage" className="btn-secondary">
          Manage console
        </Link>
        <Link href="/practice?subject=AP%20Statistics" className="btn-secondary">
          AP Statistics practice
        </Link>
        <Link href="/concepts?subject=AP%20Statistics" className="btn-secondary">
          AP Statistics topics
        </Link>
        <Link href="/partners" className="btn-ghost">
          Partners / members
        </Link>
      </div>
    </div>
  );
}
