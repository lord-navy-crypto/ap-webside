"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AiApiChannel, { type ApiChannel } from "@/components/AiApiChannel";
import LocalAIControls from "@/components/LocalAIControls";
import { useLocalAI } from "@/components/LocalAIProvider";
import RichContent from "@/components/RichContent";
import { handleRichPaste } from "@/lib/rich-paste";
import type { AiProvider, SiteModelChoice } from "@/lib/ai-client";
import type { ManagedContent } from "@/lib/managed-types";

type DeveloperAction =
  | "rewrite"
  | "summarize"
  | "title"
  | "description"
  | "tone"
  | "faq"
  | "latex"
  | "site_advice";

type EditableTarget = {
  key: string;
  target: "content_item" | "concept" | "formula" | "document" | "folder" | "subject";
  id: string;
  field: string;
  label: string;
  value: string;
};

const ACTIONS: Array<{ value: DeveloperAction; label: string; instruction: string }> = [
  {
    value: "rewrite",
    label: "Rewrite selected text",
    instruction: "Rewrite for clarity while preserving every fact, Markdown, and LaTeX.",
  },
  {
    value: "summarize",
    label: "Summarize article",
    instruction: "Produce a concise study summary containing the most important points.",
  },
  {
    value: "title",
    label: "Generate title",
    instruction: "Return one clear and specific title only.",
  },
  {
    value: "description",
    label: "Generate page description",
    instruction: "Write a concise description suitable for navigation and search previews.",
  },
  {
    value: "tone",
    label: "Improve learning tone",
    instruction: "Make the writing clear, supportive, and appropriate for students.",
  },
  {
    value: "faq",
    label: "Extract FAQ",
    instruction: "Create a short Markdown FAQ using only information in the source.",
  },
  {
    value: "latex",
    label: "Repair Markdown / LaTeX",
    instruction:
      "Repair broken Markdown and LaTeX delimiters without changing the mathematical meaning.",
  },
  {
    value: "site_advice",
    label: "Suggest website improvements",
    instruction:
      "Give specific, prioritized website-content or usability recommendations based on the source.",
  },
];

function editableTargets(data: Partial<ManagedContent>): EditableTarget[] {
  const rows: EditableTarget[] = [];
  const add = (
    target: EditableTarget["target"],
    id: string,
    field: string,
    label: string,
    value: unknown
  ) => {
    rows.push({
      key: `${target}|${id}|${field}`,
      target,
      id,
      field,
      label,
      value: String(value ?? ""),
    });
  };

  (data.contentItems || [])
    .filter((item) => !item.deletedAt)
    .forEach((item) => {
      add("content_item", item.id, "content", `Content · ${item.title} · body`, item.content);
      add("content_item", item.id, "title", `Content · ${item.title} · title`, item.title);
    });
  (data.concepts || []).forEach((item) => {
    add("concept", item.id, "summary", `Concept · ${item.title} · body`, item.summary);
    add("concept", item.id, "title", `Concept · ${item.title} · title`, item.title);
  });
  (data.formulas || []).forEach((item) => {
    add("formula", item.id, "content", `Formula · ${item.name} · body`, item.content || "");
    add("formula", item.id, "name", `Formula · ${item.name} · title`, item.name);
  });
  (data.documents || []).forEach((item) => {
    add("document", item.id, "content", `Document · ${item.title} · body`, item.content);
    add("document", item.id, "title", `Document · ${item.title} · title`, item.title);
  });
  (data.folders || []).forEach((item) => {
    add("folder", item.id, "note", `Folder · ${item.title} · note`, item.note || "");
    add("folder", item.id, "title", `Folder · ${item.title} · title`, item.title);
  });
  (data.subjects || []).forEach((item) => {
    add("subject", item.id, "description", `Subject · ${item.name} · description`, item.description || "");
    add("subject", item.id, "name", `Subject · ${item.name} · name`, item.name);
  });
  return rows;
}

export default function AIDeveloperBlocks({
  embedded = false,
  onWebsiteChanged,
}: {
  embedded?: boolean;
  onWebsiteChanged?: (content: ManagedContent) => void;
}) {
  const localAI = useLocalAI();
  const sourceRef = useRef<HTMLTextAreaElement>(null);
  const [data, setData] = useState<Partial<ManagedContent>>({});
  const [selectedTargetKey, setSelectedTargetKey] = useState("");
  const [liveOriginal, setLiveOriginal] = useState("");
  const [action, setAction] = useState<DeveloperAction>("rewrite");
  const [source, setSource] = useState("");
  const [customInstruction, setCustomInstruction] = useState("");
  const [preview, setPreview] = useState("");
  const [proposalSummary, setProposalSummary] = useState("");
  const [working, setWorking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [confirmApply, setConfirmApply] = useState(false);
  const [apiChannel, setApiChannel] = useState<ApiChannel>("site");
  const [siteModel, setSiteModel] = useState<SiteModelChoice>("auto");
  const [provider, setProvider] = useState<AiProvider>("groq");
  const [userKey, setUserKey] = useState("");

  useEffect(() => {
    fetch("/api/edit", { cache: "no-store" })
      .then((response) => response.json())
      .then(setData)
      .catch(() => setMessage("Could not load website content."));
  }, []);

  const targets = useMemo(() => editableTargets(data), [data]);
  const selectedTarget = targets.find((item) => item.key === selectedTargetKey);
  const useLocal =
    localAI.mode === "local" || (localAI.mode === "auto" && localAI.ready);
  const canGenerate = Boolean(source.trim()) && (!useLocal || localAI.ready);

  function chooseTarget(key: string) {
    setSelectedTargetKey(key);
    setPreview("");
    setProposalSummary("");
    setMessage("");
    const next = targets.find((item) => item.key === key);
    const value = next?.value || "";
    setSource(value);
    setLiveOriginal(value);
  }

  function buildFinalDraft(replacement: string, start: number, end: number) {
    return start !== end
      ? `${source.slice(0, start)}${replacement}${source.slice(end)}`
      : replacement;
  }

  async function generatePreview() {
    const textarea = sourceRef.current;
    const start = textarea?.selectionStart ?? 0;
    const end = textarea?.selectionEnd ?? 0;
    const selectedText = start !== end ? source.slice(start, end) : source;
    if (!selectedText.trim()) {
      setMessage("Choose website content or paste a draft first.");
      return;
    }
    if (useLocal && !localAI.ready) {
      setMessage("Load a local model first, or switch AI mode to Cloud.");
      return;
    }

    const selectedAction = ACTIONS.find((item) => item.value === action) || ACTIONS[0];
    const instruction = `${selectedAction.instruction}${
      customInstruction.trim() ? ` Additional instruction: ${customInstruction.trim()}` : ""
    }`;
    setWorking(true);
    setPreview("");
    setProposalSummary("");
    setMessage("");

    try {
      if (useLocal) {
        await localAI.complete(
          [
            {
              role: "system",
              content:
                "You are Knowledge Explorer AI Developer. Edit website content only. Preserve facts, Markdown, Unicode, and LaTeX. Never output secrets, authentication changes, API keys, payment code, database migrations, deployment configuration, or arbitrary server-file edits. Return only replacement content.",
            },
            {
              role: "user",
              content: `${instruction}\n\nSOURCE:\n${selectedText}`,
            },
          ],
          (_token, fullText) => setPreview(buildFinalDraft(fullText, start, end))
        );
        setProposalSummary(`Local AI · ${selectedAction.label}`);
      } else {
        const response = await fetch("/api/ai/developer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            operation: "generate",
            action,
            instruction,
            source: selectedText,
            siteModel,
            provider,
            userApiKey: apiChannel === "byok" ? userKey : undefined,
          }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Cloud AI preview failed.");
        setPreview(buildFinalDraft(String(result.proposal || ""), start, end));
        setProposalSummary(
          `${String(result.summary || "Cloud AI proposal")} · ${String(result.model || result.provider || "cloud")}`
        );
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Developer preview failed.");
    } finally {
      setWorking(false);
    }
  }

  function applyPreviewToDraft() {
    if (!preview.trim()) return;
    setSource(preview);
    setPreview("");
    setMessage("Proposal copied into the draft. The live website has not changed.");
  }

  async function applyToWebsite() {
    if (!selectedTarget || !preview.trim()) return;
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/ai/developer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "apply",
          target: selectedTarget.target,
          id: selectedTarget.id,
          field: selectedTarget.field,
          original: liveOriginal,
          proposal: preview,
          action,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not apply the proposal.");
      const nextContent = result.content as ManagedContent;
      setData(nextContent);
      setSource(preview);
      setLiveOriginal(preview);
      setPreview("");
      setConfirmApply(false);
      setMessage("Applied to the website. A restorable history version was created.");
      onWebsiteChanged?.(nextContent);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not apply the proposal.");
      setConfirmApply(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {!embedded && (
        <header>
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-700">
            Editor workspace
          </p>
          <h1 className="mt-1 text-3xl font-bold">AI Developer</h1>
          <p className="mt-2 max-w-3xl text-slate-600">
            Select managed website content, generate a local or cloud AI proposal, review it, then
            explicitly apply it. Every applied change can be restored from History &amp; Undo.
          </p>
        </header>
      )}

      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        Content-code editor unlocked. Use AI Developer from the ✎ menu or the top edit bar on any
        page.
      </div>

      <LocalAIControls />

      {!useLocal && (
        <AiApiChannel
          channel={apiChannel}
          onChannelChange={setApiChannel}
          siteModel={siteModel}
          onSiteModelChange={setSiteModel}
          provider={provider}
          onProviderChange={setProvider}
          userKey={userKey}
          onUserKeyChange={setUserKey}
        />
      )}

      <section className="card space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium">Website content to work on</label>
          <select
            className="input"
            value={selectedTargetKey}
            onChange={(event) => chooseTarget(event.target.value)}
          >
            <option value="">Draft only — paste text without changing the website</option>
            {targets.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">
            The AI receives only the selected field, not the entire repository or private keys.
          </p>
        </div>

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
              placeholder="e.g. Keep AP Physics terminology unchanged"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Original content / working draft</label>
          <p className="mb-2 text-xs text-slate-500">
            Markdown + LaTeX supported. Paste from ChatGPT keeps math as{" "}
            <code className="rounded bg-slate-100 px-1">$...$</code>.
          </p>
          <textarea
            ref={sourceRef}
            className="textarea min-h-[280px] resize-y text-sm leading-relaxed"
            value={source}
            onChange={(event) => setSource(event.target.value)}
            onPaste={(event) => handleRichPaste(event, source, setSource)}
            placeholder="Choose an existing website field above, or paste Markdown + LaTeX here. Select part of the text to edit only that part."
          />
        </div>

        <button
          type="button"
          className="btn-primary"
          disabled={working || !canGenerate}
          onClick={() => void generatePreview()}
        >
          {working ? "Generating preview…" : `Generate preview with ${useLocal ? "local AI" : "cloud AI"}`}
        </button>
        {message && (
          <p role="status" className="text-sm text-slate-600">
            {message}
          </p>
        )}
      </section>

      {preview && (
        <section className="space-y-4" aria-live="polite">
          <div>
            <h2 className="text-xl font-semibold">Review before applying</h2>
            {proposalSummary && <p className="mt-1 text-sm text-slate-500">{proposalSummary}</p>}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="card min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Current draft
              </p>
              <pre className="mt-3 max-h-[460px] overflow-auto whitespace-pre-wrap break-words text-sm text-slate-700">
                {source}
              </pre>
            </div>
            <div className="card min-w-0 border-violet-200">
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
                AI proposal
              </p>
              <div className="mt-3 max-h-[460px] overflow-auto">
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
            <button type="button" className="btn-secondary" onClick={applyPreviewToDraft}>
              Apply to draft only
            </button>
            {selectedTarget && action !== "site_advice" && (
              <button type="button" className="btn-primary" onClick={() => setConfirmApply(true)}>
                Apply to website
              </button>
            )}
          </div>
        </section>
      )}

      {confirmApply && selectedTarget && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ai-developer-apply-title"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h2 id="ai-developer-apply-title" className="text-xl font-semibold">
              Apply AI change to the website?
            </h2>
            <p className="mt-3 text-sm text-slate-600">
              This will replace <strong>{selectedTarget.label}</strong>. A GitHub-backed history
              version will be created so the change can be undone from Manager.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="btn-secondary"
                disabled={saving}
                onClick={() => setConfirmApply(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={saving}
                onClick={() => void applyToWebsite()}
              >
                {saving ? "Applying…" : "Confirm and apply"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
