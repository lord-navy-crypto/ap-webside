"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

type SectionId = "start" | "ai" | "deploy" | "collab" | "faq";

const sections: { id: SectionId; label: string; icon: string }[] = [
  { id: "start", label: "Quick Start", icon: "⚡" },
  { id: "ai", label: "AI Workflow", icon: "✨" },
  { id: "deploy", label: "Deploy", icon: "🚀" },
  { id: "collab", label: "Collaborate", icon: "👥" },
  { id: "faq", label: "FAQ", icon: "💬" },
];

const PROMPT_TEMPLATE = `You are an AP Physics 1 question writer.

I will give you TOPIC and SAMPLE PROBLEMS for style reference only.
Create 5 ORIGINAL practice questions. Do NOT copy wording from samples or any real AP exam.

Requirements:
- formats mix: frq_half, mcq, concept_check
- each item: prompt, conceptIntro, visibleSteps (if frq_half), blankSteps, hints (no final answers)
- no answer keys, no final numeric solutions
- output valid JSON array only

TOPIC: Kinematics, 1D motion with constant acceleration

SAMPLE PROBLEMS (reference only):
1) [paste problem A]
2) [paste problem B]`;

const JSON_SNIPPET = `{
  id: "phys1-gen-energy-01",
  title: "Physics 1 — Energy Generated Set",
  subject: "AP Physics 1",
  kind: "generated",
  description: "Short description",
  generationNote: "Claude 2026-07-21; style reference only",
  estimatedMinutes: 20,
  tags: ["energy", "generated"],
  items: [
    {
      id: "phys1-gen-e1",
      format: "frq_half",
      conceptId: "kinematics-basics",
      conceptIntro: "Key concept: …",
      prompt: "Your question…",
      visibleSteps: ["Step 1", "Step 2"],
      blankSteps: ["Answer: ______"],
      hints: ["L1: …", "L2: …"],
    },
  ],
}`;

function CodeBlock({
  label,
  code,
  language = "bash",
}: {
  label?: string;
  code: string;
  language?: string;
}) {
  const [copied, setCopied] = useState(false);

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard permission denied or unavailable — silently ignore.
    }
  }, [code]);

  return (
    <div className="guide-code-block group">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
          {label ?? language}
        </span>
        <button
          type="button"
          onClick={onCopy}
          className="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-400 transition hover:bg-white/10 hover:text-white"
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed text-slate-200">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function StepCard({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="guide-step">
      <div className="guide-step-num">{n}</div>
      <div className="guide-step-body">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <div className="mt-2 space-y-3 text-sm leading-relaxed text-slate-600">
          {children}
        </div>
      </div>
    </div>
  );
}

function InfoPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-sm">
      {children}
    </span>
  );
}

export default function GuideHub() {
  const [active, setActive] = useState<SectionId>("start");

  return (
    <div className="guide-hub space-y-10">
      {/* Hero */}
      <section className="guide-hero relative overflow-hidden rounded-3xl px-6 py-10 shadow-2xl md:px-10 md:py-14">
        <div className="guide-hero-grid pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative z-10 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200/80">
            Unified Setup & AI Guide
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white md:text-5xl">
            Everything in one place
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-blue-100/90">
            Local setup, AI question generation, deploy to Vercel, and team workflow —
            one concise hub. Generated questions only. Hints, never answer keys.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <InfoPill>5 min local setup</InfoPill>
            <InfoPill>No model training</InfoPill>
            <InfoPill>Auto-deploy on push</InfoPill>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setActive("start")}
              className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-brand-800 shadow-lg transition hover:bg-blue-50"
            >
              Start here
            </button>
            <Link
              href="/questionnaires"
              className="rounded-xl border border-white/30 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Browse sets →
            </Link>
          </div>
        </div>
      </section>

      {/* Ethics strip */}
      <div className="guide-ethics flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200/60 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4 text-sm text-amber-950">
        <span className="text-lg" aria-hidden>
          ⚖️
        </span>
        <p>
          <strong>Learning only.</strong> Feed topics to AI for original practice — never
          paste College Board exam text. Final answers stay hidden by design.
        </p>
      </div>

      {/* Layout: nav + content */}
      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <nav className="lg:sticky lg:top-24 lg:self-start">
          <div className="guide-nav rounded-2xl border border-slate-200/80 bg-white/80 p-2 shadow-sm backdrop-blur-md">
            {sections.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActive(s.id)}
                className={`guide-nav-item w-full ${active === s.id ? "guide-nav-item-active" : ""}`}
              >
                <span aria-hidden>{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>
          <p className="mt-4 hidden text-xs leading-relaxed text-slate-500 lg:block">
            本地设置 + AI 生成 + 上线部署，全部在这一页。
          </p>
        </nav>

        <div className="min-w-0 space-y-6">
          {active === "start" && (
            <div className="guide-panel space-y-6">
              <header>
                <h2 className="section-title">Quick Start</h2>
                <p className="mt-2 text-slate-600">
                  Install once, run locally, edit content files — no structural code changes
                  needed for most updates.
                </p>
              </header>

              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { label: "Install Node LTS", sub: "nodejs.org" },
                  { label: "npm install", sub: "One-time deps" },
                  { label: "npm run dev", sub: "localhost:3000" },
                ].map((item) => (
                  <div key={item.label} className="guide-stat-card">
                    <p className="font-semibold text-slate-900">{item.label}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.sub}</p>
                  </div>
                ))}
              </div>

              <StepCard n="1" title="Install Node.js (LTS)">
                <p>
                  Download from{" "}
                  <a
                    href="https://nodejs.org"
                    className="font-medium text-brand-600 hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    nodejs.org
                  </a>
                  . Verify in terminal:
                </p>
                <CodeBlock code={"node -v\nnpm -v"} />
              </StepCard>

              <StepCard n="2" title="Install dependencies & run">
                <CodeBlock
                  label="Terminal"
                  code={`cd "/Users/jason/未命名/ap-reasonlab"\nnpm install\nnpm run dev`}
                />
                <p>
                  Open{" "}
                  <a href="http://localhost:3000" className="font-medium text-brand-600">
                    http://localhost:3000
                  </a>{" "}
                  — hot reload as you edit.
                </p>
              </StepCard>

              <StepCard n="3" title="Optional — Gemini Hint Coach">
                <ol className="list-decimal space-y-2 pl-5">
                  <li>
                    Get a free key at{" "}
                    <a
                      href="https://aistudio.google.com/apikey"
                      className="font-medium text-brand-600 hover:underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Google AI Studio
                    </a>
                  </li>
                  <li>
                    Create <code className="rounded bg-slate-100 px-1.5 py-0.5">.env.local</code>{" "}
                    with <code className="rounded bg-slate-100 px-1.5 py-0.5">GEMINI_API_KEY=…</code>
                  </li>
                  <li>Restart dev server → test at /hints</li>
                </ol>
                <p className="text-xs text-slate-500">
                  Without a key, mock hints still work for demos.
                </p>
              </StepCard>

              <div className="guide-panel-inner">
                <h3 className="font-semibold text-slate-900">Files you edit most</h3>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {[
                    ["data/content.ts", "Concepts + practice"],
                    ["data/formulas.ts", "Formula reference"],
                    ["data/questionnaires.ts", "Generated sets"],
                    ["data/checklist.ts", "Project checklist"],
                  ].map(([file, desc]) => (
                    <div
                      key={file}
                      className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3"
                    >
                      <code className="text-xs font-semibold text-brand-700">{file}</code>
                      <p className="mt-1 text-xs text-slate-500">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {active === "ai" && (
            <div className="guide-panel space-y-6">
              <header>
                <h2 className="section-title">AI Workflow</h2>
                <p className="mt-2 text-slate-600">
                  No fine-tuning. Prompt Claude or ChatGPT → paste into the site. Question
                  generation does not need an API key.
                </p>
              </header>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { title: "Prompt", desc: "Topic + style samples" },
                  { title: "Review", desc: "Original, no answers" },
                  { title: "Embed", desc: "Paste into data file" },
                ].map((item, i) => (
                  <div key={item.title} className="guide-flow-card">
                    <span className="text-xs font-bold text-brand-600">0{i + 1}</span>
                    <p className="mt-1 font-semibold">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                ))}
              </div>

              <StepCard n="1" title="Prepare your input">
                <ul className="list-disc space-y-1 pl-5">
                  <li>Subject + unit (e.g. AP Physics 1 — Kinematics)</li>
                  <li>2–3 sample problems as <strong>style reference only</strong></li>
                  <li>Require new contexts, new numbers, new wording</li>
                </ul>
              </StepCard>

              <StepCard n="2" title="Copy this prompt">
                <CodeBlock label="Claude / ChatGPT" code={PROMPT_TEMPLATE} language="prompt" />
              </StepCard>

              <StepCard n="3" title="Embed in questionnaires.ts">
                <p>
                  Append a new object to{" "}
                  <code className="rounded bg-slate-100 px-1.5">data/questionnaires.ts</code> with{" "}
                  <code className="rounded bg-slate-100 px-1.5">kind: &quot;generated&quot;</code>:
                </p>
                <CodeBlock label="TypeScript" code={JSON_SNIPPET} language="typescript" />
              </StepCard>

              <div className="guide-panel-inner border-brand-100 bg-brand-50/40">
                <h3 className="font-semibold text-brand-900">Do you need to train AI?</h3>
                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  <p className="text-emerald-800">✓ Prompting + static embed</p>
                  <p className="text-emerald-800">✓ Optional Gemini for Hint Coach</p>
                  <p className="text-slate-500">✗ Fine-tuning (later)</p>
                  <p className="text-slate-500">✗ RAG knowledge base (later)</p>
                </div>
              </div>
            </div>
          )}

          {active === "deploy" && (
            <div className="guide-panel space-y-6">
              <header>
                <h2 className="section-title">Deploy to production</h2>
                <p className="mt-2 text-slate-600">
                  localhost is only you. Push to GitHub → Vercel builds automatically → live
                  URL for everyone.
                </p>
              </header>

              <div className="guide-timeline rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6">
                <div className="flex flex-wrap items-center justify-center gap-2 text-sm font-medium text-slate-700">
                  <span className="rounded-lg bg-white px-3 py-1.5 shadow-sm">Local edit</span>
                  <span className="text-slate-300">→</span>
                  <span className="rounded-lg bg-white px-3 py-1.5 shadow-sm">git push</span>
                  <span className="text-slate-300">→</span>
                  <span className="rounded-lg bg-white px-3 py-1.5 shadow-sm">Vercel build</span>
                  <span className="text-slate-300">→</span>
                  <span className="rounded-lg bg-brand-600 px-3 py-1.5 text-white shadow-sm">
                    Live site
                  </span>
                </div>
                <p className="mt-4 text-center text-xs text-slate-500">
                  Live:{" "}
                  <a
                    href="https://ap-webside.vercel.app"
                    className="font-medium text-brand-600 hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    ap-webside.vercel.app
                  </a>
                </p>
              </div>

              <StepCard n="1" title="Verify build locally">
                <CodeBlock code={"npm run build"} />
              </StepCard>

              <StepCard n="2" title="Push to GitHub">
                <CodeBlock
                  code={`cd "/Users/jason/未命名"\ngit add ap-reasonlab\ngit commit -m "Update content"\ngit push`}
                />
              </StepCard>

              <StepCard n="3" title="Vercel settings">
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    Root Directory: <strong>ap-reasonlab</strong>
                  </li>
                  <li>
                    Env var <code className="rounded bg-slate-100 px-1">GEMINI_API_KEY</code> for
                    production Hint Coach
                  </li>
                  <li>Wait ~1–2 min after push, then hard-refresh the live site</li>
                </ul>
              </StepCard>

              <Link href="/checklist" className="btn-primary inline-flex">
                View full project checklist →
              </Link>
            </div>
          )}

          {active === "collab" && (
            <div className="guide-panel space-y-6">
              <header>
                <h2 className="section-title">Collaborate with teammates</h2>
                <p className="mt-2 text-slate-600">
                  GitHub does not sync by itself — coworkers push changes. Vercel deploys when{" "}
                  <code className="rounded bg-slate-100 px-1">main</code> updates.
                </p>
              </header>

              <StepCard n="1" title="Invite on GitHub">
                <p>
                  Repo → Settings → Collaborators → Add people (Write access for PRs and
                  pushes).
                </p>
              </StepCard>

              <StepCard n="2" title="Recommended: branch + Pull Request">
                <CodeBlock
                  code={`git clone https://github.com/lord-navy-crypto/ap-webside.git\ncd ap-webside/ap-reasonlab\nnpm install\ngit checkout -b feature/my-update\n# edit data/*.ts\ngit add ap-reasonlab && git commit -m "Add content"\ngit push -u origin feature/my-update`}
                />
                <p>Open a Pull Request on GitHub → review → merge to main → auto-deploy.</p>
              </StepCard>

              <StepCard n="3" title="What auto-updates?">
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-4 py-2">Action</th>
                        <th className="px-4 py-2">Live site updates?</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="px-4 py-2">Merge to main</td>
                        <td className="px-4 py-2 text-emerald-600 font-medium">Yes (~1–2 min)</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2">Open PR only</td>
                        <td className="px-4 py-2 text-slate-500">No</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2">Local edits only</td>
                        <td className="px-4 py-2 text-slate-500">No</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </StepCard>
            </div>
          )}

          {active === "faq" && (
            <div className="guide-panel space-y-4">
              <header>
                <h2 className="section-title">FAQ & troubleshooting</h2>
              </header>

              {[
                {
                  q: "node: command not found",
                  a: "Install Node.js LTS from nodejs.org, then restart Terminal.",
                },
                {
                  q: "npm install is slow",
                  a: "Wait or try a different network. First install downloads many packages.",
                },
                {
                  q: "Hint Coach errors",
                  a: "Without GEMINI_API_KEY, mock hints run — that's normal for demos.",
                },
                {
                  q: "Port 3000 in use",
                  a: "Run npm run dev -- -p 3001 and open localhost:3001.",
                },
                {
                  q: "Live site didn't change",
                  a: "Confirm git push succeeded, wait 1–2 min, hard-refresh (Cmd+Shift+R).",
                },
                {
                  q: "Three difficulty tiers?",
                  a: "Use tags: intro / standard / challenge until UI filters ship.",
                },
              ].map((item) => (
                <details key={item.q} className="guide-faq group">
                  <summary className="cursor-pointer font-medium text-slate-900">
                    {item.q}
                  </summary>
                  <p className="mt-2 text-sm text-slate-600">{item.a}</p>
                </details>
              ))}

              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/hints" className="btn-secondary">
                  Test Hint Coach
                </Link>
                <Link href="/about" className="btn-ghost">
                  Content policy
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
