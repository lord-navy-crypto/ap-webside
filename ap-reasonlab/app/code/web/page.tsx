import Link from "next/link";

export default function CodeWebPage() {
  return (
    <div className="space-y-6">
      <Link href="/code" className="text-sm text-brand-600 hover:underline">
        ← Back to Code Resource
      </Link>
      <div>
        <h1 className="text-3xl font-bold">Web / HTML</h1>
        <p className="mt-2 text-slate-600">
          Web demos and embeds. You can iframe another site here if it allows embedding.
        </p>
      </div>
      <div className="card text-sm text-slate-600">
        No embeds configured yet. Paste a URL later and we can add a safe iframe panel.
      </div>
    </div>
  );
}
