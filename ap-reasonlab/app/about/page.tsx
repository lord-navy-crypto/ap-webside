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
          AP is one box inside Results. Academic Platform, Code Resource, and Forum are
          separate so the product can grow into A-Level, IB, and other areas without
          cluttering AP.
        </p>
      </section>

      <EthicsBanner />

      <section className="card space-y-3">
        <h2 className="text-lg font-semibold">GitHub collaborators</h2>
        <ul className="space-y-2 text-sm text-slate-700">
          {collaborators.map((c) => (
            <li key={c.name}>
              <a href={c.github} className="font-medium text-brand-700 hover:underline" target="_blank" rel="noreferrer">
                {c.name}
              </a>{" "}
              — {c.role}
            </li>
          ))}
        </ul>
      </section>

      <section className="card space-y-3">
        <h2 className="text-lg font-semibold">Content policy</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
          <li>
            <strong>Generated only</strong> — questions come from Claude/ChatGPT prompts,
            then are embedded as original practice.
          </li>
          <li>No College Board exam text copied onto this site.</li>
          <li>No final answer keys displayed by default.</li>
          <li>AI may be wrong — always verify with your teacher or textbook.</li>
        </ul>
        <Link href="/guide" className="btn-primary inline-flex">
          Read AI Guide
        </Link>
      </section>
    </div>
  );
}
