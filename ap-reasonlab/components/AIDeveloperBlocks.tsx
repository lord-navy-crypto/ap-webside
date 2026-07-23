"use client";

import { useRef, useState } from "react";
import LocalAIControls from "@/components/LocalAIControls";
import { useLocalAI } from "@/components/LocalAIProvider";
import RichContent from "@/components/RichContent";

type DeveloperAction = "rewrite" | "summarize" | "title" | "description" | "tone" | "faq";

const ACTIONS: Array<{ value: DeveloperAction; label: string; instruction: string }> = [
  {
    value: "rewrite",
    label: "Rewrite selected text",
    instruction: "Rewrite for clarity while preserving all facts, Markdown, and LaTeX.",
  },
  {
    value: "summarize",
    label: "Summarize article",
    instruction: "Produce a concise study summary with the most important points.",
  },
  {
    value: "title",
    label: "Generate title",
    instruction: "Return one clear, specific page title only.",
  },
  {
    value: "description",
    label: "Generate page description",
    instruction: "Write a concise page description suitable for navigation and search previews.",
  },
  {
    value: "tone",
    label: "Improve learning tone",
    instruction: "Make the writing clear, supportive, and appropriate for students.",
  },
  {
    value: "faq",
    label: "Extract FAQ",
    instruction: "Create a short Markdown FAQ using only information contained in the source.",
  },
];

export default function AIDeveloperBlocks() {
  const localAI = useLocalAI();
  const sourceRef = useRef<HTMLTextAreaElement>(null);
  const [action, setAction] = useState<DeveloperAction>("rewrite");
  const [source, setSource] = useState("");
  const [customInstruction, setCustomInstruction] = useState("");
  const [preview, setPreview] = useState("");
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");

  async function generatePreview() {
    if (!localAI.ready) {
      setMessage("Enable local AI before generating a developer preview.");
      return;
    }
    const textarea = sourceRef.current;
    const start = textarea?.selectionStart ?? 0;
    const end = textarea?.selectionEnd ?? 0;
    const selectedText = start !== end ? source.slice(start, end) : source;
    if (!selectedText.trim()) {
      setMessage("Paste content first, then optionally select the exact part to edit.");
      return;
    }

    const selectedAction = ACTIONS.find((item) => item.value === action) || ACTIONS[0];
    setWorking(true);
    setPreview("");
    setMessage("");
    try {
      await localAI.complete(
        [
          {
            role: "system",
            content:
              "You are the Results local developer assistant. Edit content only. Preserve valid Markdown and LaTeX. Never output secrets, authentication changes, deployment commands, API keys, database migrations, or arbitrary server code. Return only the proposed replacement text.",
          },
          {
            role: "user",
            content: `${selectedAction.instruction}\n${
              customInstruction.trim()
                ? `Additional instruction: ${customInstruction.trim()}\n`
                : ""
            }\nSOURCE:\n${selectedText}`,
          },
        ],
        (_token, fullText) => setPreview(fullText)
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Developer preview failed.");
    } finally {
      setWorking(false);
    }
  }

  function applyPreview() {
    if (!preview.trim()) return;
    const textarea = sourceRef.current;
    const start = textarea?.selectionStart ?? 0;
    const end = textarea?.selectionEnd ?? 0;
    if (start !== end) {
      setSource(`${source.slice(0, start)}${preview}${source.slice(end)}`);
    } else {
      setSource(preview);
    }
    setMessage("Preview applied to the draft box. It has not been saved to the website.");
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-violet-700">
          Master-only workspace
        </p>
        <h1 className="mt-1 text-3xl font-bold">AI Developer Blocks</h1>
        <p className="mt-2 max-w-3xl text-slate-600">
          Draft and review website content with local AI. Every change stays a preview until you
          apply it to the draft; this page never edits authentication, keys, deployment, or server
          files.
        </p>
      </header>

      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        Master session verified. This navigation item and route are unavailable to ordinary visitors
        and content-only editors.
      </div>

      <LocalAIControls />

      <section className="card space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">Developer operation</label>
            <select
              className="input"
              value={action}
              onChange={(event) => setAction(event.target.value as DeveloperAction)}
            >
              {ACTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">
              Additional instruction (optional)
            </label>
            <input
              className="input"
              value={customInstruction}
              onChange={(event) => setCustomInstruction(event.target.value)}
              placeholder="e.g. Keep the AP Physics terminology unchanged"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Original content</label>
          <textarea
            ref={sourceRef}
            className="textarea min-h-[260px] resize-y font-mono text-sm"
            value={source}
            onChange={(event) => setSource(event.target.value)}
            placeholder="Paste Markdown or page text here. Select part of it to change only that part; with no selection, the whole draft is used."
          />
        </div>

        <button
          type="button"
          className="btn-primary"
          disabled={working || !source.trim() || !localAI.ready}
          onClick={() => void generatePreview()}
        >
          {working ? "Generating preview…" : "Generate change preview"}
        </button>
        {message && <p className="text-sm text-slate-600">{message}</p>}
      </section>

      {preview && (
        <section className="space-y-4" aria-live="polite">
          <h2 className="text-xl font-semibold">Review before applying</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="card min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Original draft
              </p>
              <pre className="mt-3 max-h-[420px] overflow-auto whitespace-pre-wrap break-words text-sm text-slate-700">
                {source}
              </pre>
            </div>
            <div className="card min-w-0 border-violet-200">
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
                AI proposal
              </p>
              <div className="mt-3 max-h-[420px] overflow-auto">
                <RichContent className="text-sm text-slate-800">{preview}</RichContent>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-secondary" onClick={() => setPreview("")}>
              Reject
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => void navigator.clipboard.writeText(preview)}
            >
              Copy proposal
            </button>
            <button type="button" className="btn-primary" onClick={applyPreview}>
              Apply to draft
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Applying updates only this draft box. Use the normal Results content editor to review and
            save it.
          </p>
        </section>
      )}
    </div>
  );
}
