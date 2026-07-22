"use client";

import { useEffect, useState } from "react";
import { ROOT_SPACE, normalizeSpace } from "@/lib/storage-space";

type Mode = "concept" | "formula" | "document" | "file" | "member" | "folder";

type Props = {
  mode: Mode;
  /** Default subject / area name for concept/formula forms */
  defaultSubject?: string;
  /** Page area for folder creation and file/doc scoping */
  folderArea?: string;
  /** Isolated storage space key for this folder */
  spaceKey?: string;
  label?: string;
  /** Called after successful save; receives latest managed content when available */
  onSaved?: (content?: unknown) => void;
};

/**
 * Plus-button editor: fill the form, then enter a change code to save.
 * Concepts: type area + name + paste notes → AI sorts into key points / mistakes / example.
 */
export default function ChangePanel({
  mode,
  defaultSubject = "AP Physics 1",
  folderArea = "general",
  spaceKey = ROOT_SPACE,
  label,
  onSaved,
}: Props) {
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
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    setSubject(defaultSubject);
  }, [defaultSubject]);

  const titles: Record<Mode, string> = {
    concept: "Add concept (AI sort)",
    formula: "Add formula",
    document: "Add document",
    file: "Upload file",
    member: "Add member (master code only)",
    folder: "Add folder (own storage space)",
  };

  const scopedSpace = normalizeSpace(spaceKey);

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
    setFile(null);
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
      setNote(
        `${data.note || "Sorted."} ${data.aiMayBeWrong || ""}`.trim()
      );
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
      let action = "";
      let item: Record<string, unknown> = {};

      if (mode === "concept") {
        action = "add_concept";
        item = {
          title,
          subject,
          summary,
          keyPoints: linesToList(keyPointsText),
          commonMistakes: linesToList(mistakesText),
          example,
        };
      } else if (mode === "formula") {
        action = "add_formula";
        item = { name: title, subject, unit, expression, variables: "", whenToUse: summary };
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
        item = { name: title, note: memberNote };
      } else if (mode === "folder") {
        action = "add_folder";
        item = {
          title,
          area: folderArea,
          note: memberNote || summary,
          space: scopedSpace,
        };
      }

      const res = await fetch("/api/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          item,
          changeCode: changeCode.trim(),
          githubToken: githubToken.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");

      setNote(
        data.mode === "github"
          ? "Saved into this folder’s storage. It should appear on the right now."
          : "Saved into this folder’s storage. It should appear on the right now."
      );
      reset();
      onSaved?.(data.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

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
            Saves only into this folder space — not shared with other folders.
          </p>

          {(mode === "concept" ||
            mode === "formula" ||
            mode === "document" ||
            mode === "member" ||
            mode === "folder") && (
            <input
              className="input"
              placeholder={
                mode === "formula"
                  ? "Formula name"
                  : mode === "member"
                    ? "Member name"
                    : mode === "folder"
                      ? "Folder name (becomes its own storage)"
                      : mode === "concept"
                        ? "Name (concept title)"
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

          {(mode === "concept" || mode === "formula") && (
            <input
              className="input"
              placeholder="Area (e.g. AP Physics 1)"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          )}

          {mode === "concept" && (
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

          <div className="space-y-2 rounded-xl bg-amber-50 px-3 py-3">
            <label className="block text-sm font-medium text-amber-950">
              Change code (required to save)
            </label>
            <input
              type="password"
              className="input"
              placeholder="Enter change code"
              value={changeCode}
              onChange={(e) => setChangeCode(e.target.value)}
              required
            />
            <p className="text-xs text-amber-900">
              Content code can add content/files. Master code can also add members.
            </p>
          </div>

          <details className="text-sm text-slate-600">
            <summary className="cursor-pointer font-medium">
              GitHub publish token (for Vercel)
            </summary>
            <input
              type="password"
              className="input mt-2"
              placeholder="ghp_... optional if GITHUB_TOKEN is set on Vercel"
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
            />
          </details>

          {error && <p className="whitespace-pre-wrap text-sm text-red-600">{error}</p>}
          {note && <p className="text-sm text-emerald-700">{note}</p>}

          <div className="flex flex-wrap gap-2">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Saving..." : "Save with change code"}
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
