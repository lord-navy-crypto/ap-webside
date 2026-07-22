"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ROOT_SPACE, normalizeSpace } from "@/lib/storage-space";
import { useContentEditor } from "@/components/useContentEditor";

type Mode = "concept" | "formula" | "document" | "file" | "member" | "folder";

type Props = {
  mode: Mode;
  defaultSubject?: string;
  folderArea?: string;
  spaceKey?: string;
  label?: string;
  onSaved?: (content?: unknown) => void;
  allowPublicContribution?: boolean;
};

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
          name: title,
          area: subject,
          summary,
          content: rawNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI sort failed");
      if (data.summary) setSummary(data.summary);
      if (Array.isArray(data.keyPoints)) setKeyPointsText(data.keyPoints.join("\n"));
      if (Array.isArray(data.commonMistakes)) setMistakesText(data.commonMistakes.join("\n"));
      if (data.example) setExample(data.example);
      setNote(data.note || "Sorted. Review fields, then save.");
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
      if (mode === "member" && editor?.level === "content" && !changeCode.trim()) {
        throw new Error("Adding members still needs a master code (content login is not enough).");
      }
      if (needsCodeField && !changeCode.trim()) {
        throw new Error("Enter the content change code, or unlock once at /login.");
      }

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
        item = {
          name: title,
          subject,
          unit,
          expression,
          variables: summary,
          whenToUse: content,
          sourceNote: "Managed upload",
        };
      } else if (mode === "document") {
        action = "add_document";
        item = {
          title,
          category,
          content,
          area: folderArea,
          space: scopedSpace,
        };
      } else if (mode === "file") {
        if (!file) throw new Error("Choose a file");
        const dataUrl = await readFileAsDataURL(file);
        action = "add_file";
        item = {
          name: file.name,
          mime: file.type || "application/octet-stream",
          dataUrl,
          note: memberNote || summary,
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
          note: memberNote || summary,
          area: folderArea,
          space: scopedSpace,
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
      setNote(data.note || "Saved.");
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

  return (
    <div className="space-y-3">
      <button type="button" className="btn-secondary" onClick={() => setOpen((v) => !v)}>
        {label || titles[mode]}
      </button>
      {open && (
        <form onSubmit={handleSubmit} className="card space-y-3">
          <h3 className="font-semibold">{titles[mode]}</h3>

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
                      ? "Folder title"
                      : "Title"
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          )}

          {(mode === "concept" || mode === "formula") && (
            <input
              className="input"
              placeholder="Subject / area"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          )}

          {mode === "concept" && (
            <>
              <textarea
                className="textarea min-h-[80px]"
                placeholder="Short summary (optional)"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
              <textarea
                className="textarea"
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
                className="textarea min-h-[80px]"
                placeholder="Common mistakes (one per line)"
                value={mistakesText}
                onChange={(e) => setMistakesText(e.target.value)}
              />
              <textarea
                className="textarea min-h-[80px]"
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
                placeholder="Expression"
                value={expression}
                onChange={(e) => setExpression(e.target.value)}
                required
              />
              <input
                className="input"
                placeholder="Unit / topic"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              />
              <input
                className="input"
                placeholder="Variables"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
              <textarea
                className="textarea min-h-[80px]"
                placeholder="When to use"
                value={content}
                onChange={(e) => setContent(e.target.value)}
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
                className="textarea"
                placeholder="Document content"
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
                placeholder="Optional note"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
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

          {mode === "folder" && (
            <input
              className="input"
              placeholder="Note (optional)"
              value={memberNote}
              onChange={(e) => setMemberNote(e.target.value)}
            />
          )}

          {!allowPublicContribution && unlocked && mode !== "member" && (
            <p className="rounded-xl bg-emerald-50 px-3 py-3 text-xs text-emerald-900">
              Editor unlocked ({editor?.level}). Saves use your login session — no change code
              needed.{" "}
              <Link href="/login" className="font-medium underline">
                Manage login
              </Link>
            </p>
          )}

          {!allowPublicContribution && (needsCodeField || mode === "member") && (
            <div className="space-y-2 rounded-xl bg-amber-50 px-3 py-3">
              <label className="block text-sm font-medium text-amber-950">
                {mode === "member"
                  ? "Master change code (required for members)"
                  : "Content change code"}
              </label>
              <input
                type="password"
                className="input"
                placeholder={mode === "member" ? "Master code" : "Content code"}
                value={changeCode}
                onChange={(e) => setChangeCode(e.target.value)}
                required={needsCodeField || mode === "member"}
              />
              <p className="text-xs text-amber-900">
                Prefer{" "}
                <Link href="/login" className="font-medium underline">
                  /login
                </Link>{" "}
                once with the content code — then this field stays hidden for normal saves.
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
              placeholder="optional if CONTENT_GITHUB_TOKEN is set on Vercel"
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
