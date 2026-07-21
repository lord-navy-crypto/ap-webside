import Link from "next/link";

/**
 * Accounts/login removed. Editing is done with + buttons on each page + a change code.
 */
export default function AdminRedirectPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-3xl font-bold">How editing works now</h1>
      <div className="card space-y-3 text-sm text-slate-700">
        <p>No login or account needed.</p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>On any page, click the <strong>+</strong> button to add content or upload a file.</li>
          <li>Fill the form in the same format as that page.</li>
          <li>When you save, enter a <strong>change code</strong>.</li>
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
        <Link href="/concepts" className="btn-primary">
          Open Concepts
        </Link>
        <Link href="/partners" className="btn-secondary">
          Partners / members
        </Link>
      </div>
    </div>
  );
}
