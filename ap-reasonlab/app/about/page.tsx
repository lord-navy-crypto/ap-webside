import Link from "next/link";
import EthicsBanner from "@/components/EthicsBanner";

export default function AboutPage() {
  return (
    <div className="space-y-6">
      <section className="card space-y-4">
        <h1 className="text-3xl font-bold">About AP ReasonLab</h1>
        <p className="text-slate-600">
          AP ReasonLab is an open learning project for AP students. We teach
          reasoning through <strong>AI-generated practice</strong> — not pasted
          exam keys or commercial problem banks.
        </p>
      </section>

      <EthicsBanner />

      <section className="card space-y-3">
        <h2 className="text-lg font-semibold">Content policy</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
          <li>
            <strong>Generated only</strong> — questions come from Claude/ChatGPT
            prompts, then are embedded as original practice.
          </li>
          <li>No College Board exam text copied onto this site.</li>
          <li>No final answer keys displayed by default.</li>
          <li>AI may be wrong — always verify with your teacher or textbook.</li>
        </ul>
      </section>

      <section className="card space-y-3">
        <h2 className="text-lg font-semibold">How content gets here</h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-700">
          <li>You pick an AP topic.</li>
          <li>You prompt Claude or ChatGPT to create new questions.</li>
          <li>You paste JSON into <code>data/questionnaires.ts</code>.</li>
          <li>The site displays them under Generated Sets.</li>
        </ol>
        <Link href="/guide" className="btn-primary inline-flex">
          Read AI Guide
        </Link>
      </section>
    </div>
  );
}
