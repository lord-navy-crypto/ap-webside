"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ROOT_SPACE, normalizeSpace } from "@/lib/storage-space";
import { useContentEditor } from "@/components/useContentEditor";

export type ChangeMode =
  | "concept"
  | "topic"
  | "formula"
  | "document"
  | "file"
  | "member"
  | "folder"
  | "subject"
  | "questionnaire";

type Props = {
  mode: ChangeMode;
  /** Default subject / area name for concept/formula forms */
  defaultSubject?: string;
  /** Page area for folder creation and file/doc scoping */
  folderArea?: string;
  /** Isolated storage space key for this folder */
  spaceKey?: string;
  label?: string;
  /** Called after successful save; receives latest managed content when available */
  onSaved?: (content?: unknown) => void;
  allowPublicContribution?: boolean;
};

/**
 * Plus-button editor: fill the form, then enter a change code to save.
 * Concepts/topics: type area + name + paste notes → AI sorts into key points / mistakes / example.
 */
export default function ChangePanel({
  mode,
  defaultSubject = "AP Physics 1",
  folderArea = "general",
  spaceKey = ROOT_SPACE,
  label,
  onSaved,
  allowPublicContribution = false,
}: Props) {
  const { unlocked, editor, refresh } = useContentEditor();
  const [open, setOpen] = useState(false);
  const [changeCode, setChangeCode] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [structuring, setStructuring] = useState(false);

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState(defaultSubject);
  const [summary, setSummary] = useState("");
  const [rawNotes, setRawNotes] = useState("");
  const [keyPointsText, setKeyPointsText] = useState("");
  const [mistakesText, setMistakesText] = useState("");
  const [example, setExample] = useState("");
  const [expression, setExpression] = useState("");
  const [unit, setUnit] = useState("Managed");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Uploaded");
  const [memberNote, setMemberNote] = useState("");
  const [githubUser, setGithubUser] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [firstPrompt, setFirstPrompt] = useState("");
  const [minutes, setMinutes] = useState("20");

  useEffect(() => {
    setSubject(defaultSubject);
  }, [defaultSubject]);

  const titles: Record<ChangeMode, string> = {
    concept: "Add concept (AI sort)",
    topic: "Add topic",
    formula: "Add formula",
    document: "Add document",
    file: "Upload file",
    member: "Add partner (any name + GitHub)",
    folder: "Add folder (own storage space)",
    subject: "Add subject folder",
    questionnaire: "Add generated practice set",
  };

  const scopedSpace = normalizeSpace(spaceKey);
  const needsCodeField = !allowPublicContribution && !unlocked;

  function reset() {
    setTitle("");
    setSummary("");
    setRawNotes("");
    setKeyPointsText("");
    setMistakesText("");
    setExample("");
    setExpression("");
    setContent("");
    setMemberNote("");
    setGithubUser("");
    setFile(null);
    setFirstPrompt("");
    setMinutes("20");
    setChangeCode("");
    setError("");
  }

  function linesToList(text: string): string[] {
    return text
      .split("\n")
      .map((l) => l.replace(/^[-*•]\s*/, "").trim())
      .filter(Boolean);
  }

  async function handleStructure() {
    setStructuring(true);
    setError("");
    setNote("");
    try {
      const res = await fetch("/api/structure-concept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: title.trim(),
          area: subject.trim(),
          summary: summary.trim(),
          content: rawNotes.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI sort failed");
      if (data.summary) setSummary(String(data.summary));
      setKeyPointsText((data.keyPoints || []).join("\n"));
      setMistakesText((data.commonMistakes || []).join("\n"));
      setExample(String(data.example || ""));
      setNote(`${data.note || "Sorted."} ${data.aiMayBeWrong || ""}`.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI sort failed");
    } finally {
      setStructuring(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setNote("");
    try {
      if (needsCodeField && !changeCode.trim()) {
        throw new Error("Enter the content change code, or unlock once at /login.");
      }

      let action = "";
      let item: Record<string, unknown> = {};

      if (mode === "concept" || mode === "topic") {
        action = mode === "topic" ? "add_topic" : "add_concept";
        item = {
          title,
          subject,
          summary,
          keyPoints: linesToList(keyPointsText),
          commonMistakes: linesToList(mistakesText),
          example,
          area: folderArea,
          space: scopedSpace,
        };
      } else if (mode === "formula") {
        action = "add_formula";
        item = {
          name: title,
          subject,
          unit,
          expression,
          variables: "",
          whenToUse: summary,
        };
      } else if (mode === "document") {
        action = "add_document";
        item = { title, content, category, area: folderArea, space: scopedSpace };
      } else if (mode === "file") {
        if (!file) throw new Error("Choose a file first");
        action = "add_file";
        const dataUrl = await readFileAsDataURL(file);
        item = {
          name: file.name,
          mime: file.type,
          dataUrl,
          note: title || category,
          area: folderArea,
          space: scopedSpace,
        };
      } else if (mode === "member") {
        action = "add_member";
        const handle = githubUser.trim().replace(/^@/, "");
        const noteParts = [
          memberNote.trim() || "TrueJet partner",
          handle ? `github:${handle}` : "",
        ].filter(Boolean);
        item = { name: title.trim(), note: noteParts.join(" · ") };
      } else if (mode === "folder") {
        action = "add_folder";
        item = {
          title,
          area: folderArea,
          note: memberNote || summary,
          space: scopedSpace,
        };
      } else if (mode === "subject") {
        action = "add_subject";
        item = { title, name: title };
      } else if (mode === "questionnaire") {
        action = "add_questionnaire";
        item = {
          title,
          subject,
          description: summary || content,
          firstPrompt,
          estimatedMinutes: Number(minutes) || 20,
          generationNote: memberNote || undefined,
          hint: "Attempt before asking for more hints.",
        };
      }

      const res = await fetch("/api/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          item,
          changeCode: changeCode.trim() || undefined,
          githubToken: githubToken.trim() || undefined,
          publicContribution: allowPublicContribution || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");

      setNote(data.note || "Saved. It should appear in this panel / subject list now.");
      reset();
      setOpen(false);
      onSaved?.(data.content);
      void refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  const showTitleField =
    mode === "concept" ||
    mode === "topic" ||
    mode === "formula" ||
    mode === "document" ||
    mode === "member" ||
    mode === "folder" ||
    mode === "subject" ||
    mode === "questionnaire";

  const showSubjectField =
    mode === "concept" || mode === "topic" || mode === "formula" || mode === "questionnaire";

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-xl border border-dashed border-brand-300 bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-800 hover:bg-brand-100"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-white">
          +
        </span>
        {label || titles[mode]}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="card space-y-3 border-brand-200">
          <h3 className="font-semibold text-slate-900">{titles[mode]}</h3>
          <p className="text-xs text-slate-500">
            {mode === "subject"
              ? "Creates a new subject folder on Concepts / Formulas / Practice."
              : mode === "topic"
                ? "Adds a topic (concept card) inside this subject — searchable on the Concepts page."
                : mode === "questionnaire"
                  ? "Creates an AI-generated practice set in this subject (hints only)."
                  : "Saves only into this area + folder bucket — not mixed with other panels."}
          </p>

          {showTitleField && (
            <input
              className="input"
              placeholder={
                mode === "formula"
                  ? "Formula name"
                  : mode === "member"
                    ? "Member name"
                    : mode === "folder"
                      ? "Folder name (becomes its own storage)"
                      : mode === "subject"
                        ? "Subject name (e.g. AP Statistics FRQ Lab)"
                        : mode === "topic"
                          ? "Topic title (e.g. One-proportion z-interval)"
                          : mode === "concept"
                            ? "Name (concept title)"
                            : mode === "questionnaire"
                              ? "Set title (e.g. Stats — Inference Sprint B)"
                              : "Title"
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          )}

          {mode === "folder" && (
            <input
              className="input"
              placeholder="Note (optional)"
              value={memberNote}
              onChange={(e) => setMemberNote(e.target.value)}
            />
          )}

          {showSubjectField && (
            <input
              className="input"
              placeholder="Subject (e.g. AP Statistics)"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          )}

          {(mode === "concept" || mode === "topic") && (
            <>
              <textarea
                className="textarea min-h-[90px]"
                placeholder="Summary (stays on top; Markdown + $math$ ok)"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
              <textarea
                className="textarea min-h-[140px]"
                placeholder="Related notes / AI production content — paste here, then Auto-sort"
                value={rawNotes}
                onChange={(e) => setRawNotes(e.target.value)}
              />
              <button
                type="button"
                className="btn-secondary"
                disabled={structuring || !title.trim() || !subject.trim()}
                onClick={handleStructure}
              >
                {structuring ? "Sorting with AI..." : "Auto-sort → key points / mistakes / example"}
              </button>
              <textarea
                className="textarea min-h-[100px]"
                placeholder="Key points (one per line) — filled by AI, editable"
                value={keyPointsText}
                onChange={(e) => setKeyPointsText(e.target.value)}
              />
              <textarea
                className="textarea min-h-[90px]"
                placeholder="Common mistakes (one per line)"
                value={mistakesText}
                onChange={(e) => setMistakesText(e.target.value)}
              />
              <textarea
                className="textarea min-h-[90px]"
                placeholder="Example"
                value={example}
                onChange={(e) => setExample(e.target.value)}
              />
            </>
          )}

          {mode === "formula" && (
            <>
              <input
                className="input"
                placeholder="Unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              />
              <input
                className="input"
                placeholder="Expression (Unicode or LaTeX, e.g. v = v_0 + at)"
                value={expression}
                onChange={(e) => setExpression(e.target.value)}
                required
              />
              <input
                className="input"
                placeholder="When to use (optional)"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
            </>
          )}

          {mode === "document" && (
            <>
              <input
                className="input"
                placeholder="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
              <textarea
                className="textarea min-h-[120px]"
                placeholder="Document text (Markdown + $E=mc^2$ supported)..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </>
          )}

          {mode === "questionnaire" && (
            <>
              <textarea
                className="textarea min-h-[80px]"
                placeholder="Short description of this generated set"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
              <input
                className="input"
                placeholder="Estimated minutes (e.g. 25)"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
              />
              <textarea
                className="textarea min-h-[100px]"
                placeholder="Optional first question prompt (you can add more items later)"
                value={firstPrompt}
                onChange={(e) => setFirstPrompt(e.target.value)}
              />
              <input
                className="input"
                placeholder="Generation note (optional)"
                value={memberNote}
                onChange={(e) => setMemberNote(e.target.value)}
              />
            </>
          )}

          {mode === "file" && (
            <>
              <input
                className="input"
                placeholder="Note (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:text-white"
                required
              />
            </>
          )}

          {mode === "member" && (
            <input
              className="input"
              placeholder="Note (optional)"
              value={memberNote}
              onChange={(e) => setMemberNote(e.target.value)}
            />
          )}

          {mode === "member" && (
            <>
              <input
                className="input"
                placeholder="GitHub username (e.g. octocat)"
                value={githubUser}
                onChange={(e) => setGithubUser(e.target.value)}
              />
            </>
          )}

          {!allowPublicContribution && unlocked && (
            <p className="rounded-xl bg-emerald-50 px-3 py-3 text-xs text-emerald-900">
              Editor unlocked ({editor?.level}). Saves use your login session — no change code
              needed.{" "}
              <Link href="/login" className="font-medium underline">
                Manage login
              </Link>
            </p>
          )}

          {!allowPublicContribution && needsCodeField && (
            <div className="space-y-2 rounded-xl bg-amber-50 px-3 py-3">
              <label className="block text-sm font-medium text-amber-950">
                Content change code
              </label>
              <input
                type="password"
                className="input"
                placeholder="Content code"
                value={changeCode}
                onChange={(e) => setChangeCode(e.target.value)}
                required={needsCodeField}
              />
              <p className="text-xs text-amber-900">
                Prefer the edit circle on any page, or{" "}
                <Link href="/login" className="font-medium underline">
                  /login
                </Link>{" "}
                once — then this field stays hidden. Master code can also add members.
              </p>
            </div>
          )}

          {allowPublicContribution && (
            <p className="rounded-xl bg-emerald-50 px-3 py-3 text-xs text-emerald-900">
              Public contribution: no change code is needed. Do not upload private, sensitive, or
              copyrighted material you cannot share.
            </p>
          )}

          <details className="text-sm text-slate-600">
            <summary className="cursor-pointer font-medium">
              GitHub publish token (optional override)
            </summary>
            <input
              type="password"
              className="input mt-2"
              placeholder="Leave empty — uses Vercel GITHUB_TOKEN (repo write)"
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
            />
          </details>

          {error && <p className="whitespace-pre-wrap text-sm text-red-600">{error}</p>}
          {note && <p className="text-sm text-emerald-700">{note}</p>}

          <div className="flex flex-wrap gap-2">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </button>
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
