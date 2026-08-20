"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ROOT_SPACE, normalizeSpace } from "@/lib/storage-space";
import { useEditorMode } from "@/components/EditorModeProvider";
import MarkdownLatexField from "@/components/MarkdownLatexField";
import { readResponseJson } from "@/lib/safe-json";
import { sortNotesWithAi } from "@/lib/structure-concept-client";
import { isImageFile } from "@/lib/media-files";
import { assertUploadableDataUrl, assertUploadableFile } from "@/lib/upload-limits";

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
  /** For mode=file: restrict picker (e.g. image/* for pictures) */
  fileAccept?: string;
  /** From last GET /api/edit — reduces concurrent overwrite races with Manage. */
  baseUpdatedAt?: number;
};

type DraftEntry = {
  key: string;
  title: string;
  content: string;
  note: string;
  category: string;
  /** Practice / generation set: estimated minutes */
  minutes?: string;
  /** Practice / generation set: optional generation note */
  generationNote?: string;
};

function blankEntry(): DraftEntry {
  return {
    key: `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: "",
    content: "",
    note: "",
    category: "Uploaded",
    minutes: "20",
    generationNote: "",
  };
}

const MULTI_MODES: ChangeMode[] = [
  "concept",
  "topic",
  "formula",
  "document",
  "folder",
  "file",
  "questionnaire",
];

/**
 * Plus-button editor: fill the form, then enter a change code to save.
 * Concept / formula / document / folder / file support adding many at once.
 */
export default function ChangePanel({
  mode,
  defaultSubject = "AP Physics 1",
  folderArea = "general",
  spaceKey = ROOT_SPACE,
  label,
  onSaved,
  allowPublicContribution = false,
  fileAccept,
  baseUpdatedAt,
}: Props) {
  const { active: editMode, unlocked, editor, refresh } = useEditorMode();
  const [open, setOpen] = useState(false);
  const [changeCode, setChangeCode] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState(defaultSubject);
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Uploaded");
  const [memberNote, setMemberNote] = useState("");
  const [githubUser, setGithubUser] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [forceCodeField, setForceCodeField] = useState(false);
  const [entries, setEntries] = useState<DraftEntry[]>([blankEntry()]);
  const [structuringKey, setStructuringKey] = useState<string | null>(null);

  const multiMode = MULTI_MODES.includes(mode);

  useEffect(() => {
    setSubject(defaultSubject);
  }, [defaultSubject]);

  const titles: Record<ChangeMode, string> = {
    concept: "Add concepts",
    topic: "Add topics",
    formula: "Add formulas",
    document: "Add documents",
    file: fileAccept?.includes("image") ? "Upload images" : "Upload files",
    member: "Add partner (any name + GitHub)",
    folder: "Add file folders",
    subject: "Add subject folder",
    questionnaire: "Add generated practice sets",
  };

  const scopedSpace = normalizeSpace(spaceKey);
  const needsCodeField = !allowPublicContribution && (!unlocked || forceCodeField);

  const entryNoun = useMemo(() => {
    if (mode === "formula") return "formula";
    if (mode === "document") return "document";
    if (mode === "folder") return "folder";
    if (mode === "topic") return "topic";
    if (mode === "file") return "file";
    if (mode === "questionnaire") return "practice set";
    return "concept";
  }, [mode]);

  function reset() {
    setTitle("");
    setContent("");
    setMemberNote("");
    setGithubUser("");
    setFiles([]);
    setChangeCode("");
    setError("");
    setEntries([blankEntry()]);
  }

  function updateEntry(key: string, patch: Partial<DraftEntry>) {
    setEntries((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function addEntry() {
    setEntries((prev) => (prev.length >= 20 ? prev : [...prev, blankEntry()]));
  }

  function removeEntry(key: string) {
    setEntries((prev) => (prev.length <= 1 ? prev : prev.filter((row) => row.key !== key)));
  }

  async function structureEntry(key: string) {
    const row = entries.find((entry) => entry.key === key);
    if (!row?.title.trim()) {
      setError("Enter a concept title before sorting notes with AI.");
      return;
    }
    if (!row.content.trim()) {
      setError("Paste related notes in the content field first.");
      return;
    }
    setStructuringKey(key);
    setError("");
    try {
      const { formatted, note: sortNote } = await sortNotesWithAi({
        name: row.title.trim(),
        area: subject.trim(),
        content: row.content,
      });
      updateEntry(key, { content: formatted.trim() });
      setNote(sortNote);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Structure failed");
    } finally {
      setStructuringKey(null);
    }
  }

  async function postSave(payload: Record<string, unknown>) {
    const res = await fetch("/api/edit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        ...payload,
        changeCode: changeCode.trim() || undefined,
        githubToken: githubToken.trim() || undefined,
        publicContribution: allowPublicContribution || undefined,
        baseUpdatedAt: baseUpdatedAt || undefined,
      }),
    });
    const parsed = await readResponseJson<{ error?: string; content?: unknown; note?: string }>(res);
    if (!parsed.ok) throw new Error(parsed.error);
    if (res.status === 401) {
      setForceCodeField(true);
      void refresh();
      throw new Error(
        parsed.data.error ||
          "Editor session expired. Enter the content change code below, or unlock again with ✎."
      );
    }
    if (!res.ok) throw new Error(parsed.data.error || "Save failed");
    return parsed.data;
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

      if (mode === "file") {
        if (files.length === 0) throw new Error("Choose one or more files first");
        if (files.length > 10) throw new Error("Upload at most 10 files at once");
        for (const file of files) {
          if (fileAccept?.includes("image") && !isImageFile(file)) {
            throw new Error(`Image upload only — “${file.name}” is not an image.`);
          }
          assertUploadableFile(file);
        }
        const items = [];
        for (const file of files) {
          const dataUrl = await readFileAsDataURL(file);
          assertUploadableDataUrl(dataUrl, file.name);
          items.push({
            name: file.name,
            mime: file.type,
            dataUrl,
            note: title || category || undefined,
            area: folderArea,
            space: scopedSpace,
          });
        }
        const data = await postSave({ action: "add_files", items });
        setNote(data.note || `Saved ${items.length} file${items.length === 1 ? "" : "s"}.`);
        setForceCodeField(false);
        reset();
        setOpen(false);
        onSaved?.(data.content);
        void refresh();
        return;
      }

      if (multiMode) {
        const cleaned = entries
          .map((row) => ({
            ...row,
            title: row.title.trim(),
            content: row.content.trim(),
            note: row.note.trim(),
          }))
          .filter((row) => row.title || row.content || row.note);

        if (cleaned.length === 0) {
          throw new Error(`Add at least one ${entryNoun}.`);
        }
        for (const row of cleaned) {
          if (!row.title) throw new Error(`Each ${entryNoun} needs a title/name.`);
          if (
            (mode === "concept" ||
              mode === "topic" ||
              mode === "formula" ||
              mode === "document" ||
              mode === "questionnaire") &&
            !row.content
          ) {
            throw new Error(`Each ${entryNoun} needs content.`);
          }
        }

        let action = "";
        let items: Record<string, unknown>[] = [];

        if (mode === "concept" || mode === "topic") {
          action = mode === "topic" ? "add_topics" : "add_concepts";
          items = cleaned.map((row) => ({
            title: row.title,
            subject,
            summary: row.content,
            keyPoints: [],
            commonMistakes: [],
            example: "",
            area: folderArea,
            space: scopedSpace,
          }));
        } else if (mode === "formula") {
          action = "add_formulas";
          items = cleaned.map((row) => ({
            name: row.title,
            subject,
            unit: "Managed",
            expression: "",
            content: row.content,
            variables: "",
            whenToUse: "",
          }));
        } else if (mode === "document") {
          action = "add_documents";
          items = cleaned.map((row) => ({
            title: row.title,
            content: row.content,
            category: row.category || category || "Uploaded",
            area: folderArea,
            space: scopedSpace,
          }));
        } else if (mode === "folder") {
          action = "add_folders";
          items = cleaned.map((row) => ({
            title: row.title,
            area: folderArea,
            note: row.note || row.content || undefined,
            space: scopedSpace,
          }));
        } else if (mode === "questionnaire") {
          action = "add_questionnaires";
          items = cleaned.map((row) => ({
            title: row.title,
            subject,
            description: row.content,
            firstPrompt: row.note || row.content,
            estimatedMinutes: Number(row.minutes || "20") || 20,
            generationNote: row.generationNote?.trim() || undefined,
            hint: "Attempt before asking for more hints.",
          }));
        }

        const data = await postSave({ action, items });
        setNote(
          data.note ||
            `Saved ${cleaned.length} ${entryNoun}${cleaned.length === 1 ? "" : "s"}.`
        );
        setForceCodeField(false);
        reset();
        setOpen(false);
        onSaved?.(data.content);
        void refresh();
        return;
      }

      // Single-add modes: member / subject
      let action = "";
      let item: Record<string, unknown> = {};

      if (mode === "member") {
        action = "add_member";
        const handle = githubUser.trim().replace(/^@/, "");
        const noteParts = [
          memberNote.trim() || "Knowledge Explorer partner",
          handle ? `github:${handle}` : "",
        ].filter(Boolean);
        item = { name: title.trim(), note: noteParts.join(" · ") };
      } else if (mode === "subject") {
        action = "add_subject";
        item = { title, name: title };
      }

      const data = await postSave({ action, item });
      setNote(data.note || "Saved. It should appear in this panel / subject list now.");
      setForceCodeField(false);
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

  if (!editMode && !unlocked && !allowPublicContribution) return null;

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
        <form onSubmit={(e) => void handleSubmit(e)} className="card space-y-3 border-brand-200">
          <h3 className="font-semibold text-slate-900">{label || titles[mode]}</h3>
          <p className="text-xs text-slate-500">
            {multiMode
              ? `Add one or many ${entryNoun}s in one save (up to ${mode === "file" ? 10 : 20}).`
              : mode === "subject"
                ? "Creates a new subject folder on Concepts / Formulas / Practice."
                : "Saves only into this area + folder bucket."}
          </p>

          {(mode === "concept" ||
            mode === "topic" ||
            mode === "formula" ||
            mode === "questionnaire") && (
            <input
              className="input"
              placeholder="Subject (shared for all rows, e.g. AP Statistics)"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          )}

          {multiMode && mode !== "file" ? (
            <div className="space-y-3">
              {entries.map((row, index) => (
                <div
                  key={row.key}
                  className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {entryNoun} {index + 1}
                    </p>
                    {entries.length > 1 ? (
                      <button
                        type="button"
                        className="text-xs font-medium text-red-600 hover:underline"
                        onClick={() => removeEntry(row.key)}
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                  <input
                    className="input"
                    placeholder={
                      mode === "formula"
                        ? "Formula name"
                        : mode === "folder"
                          ? "Folder name"
                          : mode === "topic"
                            ? "Topic title"
                            : mode === "concept"
                              ? "Concept title"
                              : mode === "questionnaire"
                                ? "Practice set title"
                                : "Title"
                    }
                    value={row.title}
                    onChange={(e) => updateEntry(row.key, { title: e.target.value })}
                    required
                  />
                  {mode === "folder" ? (
                    <input
                      className="input"
                      placeholder="Note (optional)"
                      value={row.note}
                      onChange={(e) => updateEntry(row.key, { note: e.target.value })}
                    />
                  ) : null}
                  {mode === "document" ? (
                    <input
                      className="input"
                      placeholder="Category"
                      value={row.category}
                      onChange={(e) => updateEntry(row.key, { category: e.target.value })}
                    />
                  ) : null}
                  {(mode === "concept" ||
                    mode === "topic" ||
                    mode === "formula" ||
                    mode === "document") && (
                    <>
                      <MarkdownLatexField
                        label={mode === "document" ? "Document text" : "Full content"}
                        value={row.content}
                        onChange={(value) => updateEntry(row.key, { content: value })}
                        required
                        minHeightClass="min-h-[12rem]"
                      />
                      {(mode === "concept" || mode === "topic") && row.content.trim() ? (
                        <button
                          type="button"
                          className="btn-secondary text-xs"
                          disabled={structuringKey === row.key}
                          onClick={() => void structureEntry(row.key)}
                        >
                          {structuringKey === row.key
                            ? "Sorting notes with AI…"
                            : "Sort notes with AI (Website API)"}
                        </button>
                      ) : null}
                    </>
                  )}
                  {mode === "questionnaire" ? (
                    <>
                      <MarkdownLatexField
                        label="Set description"
                        help="Short description shown on Practice. Markdown + LaTeX supported."
                        value={row.content}
                        onChange={(value) => updateEntry(row.key, { content: value })}
                        required
                        minHeightClass="min-h-[8rem]"
                        placeholder="What this practice set covers…"
                      />
                      <input
                        className="input"
                        placeholder="Estimated minutes (e.g. 25)"
                        value={row.minutes || "20"}
                        onChange={(e) => updateEntry(row.key, { minutes: e.target.value })}
                      />
                      <MarkdownLatexField
                        label="First question prompt"
                        help="Optional first FRQ / concept-check prompt."
                        value={row.note}
                        onChange={(value) => updateEntry(row.key, { note: value })}
                        minHeightClass="min-h-[10rem]"
                        placeholder="Paste the first question (Markdown + $math$)…"
                      />
                      <input
                        className="input"
                        placeholder="Generation note (optional)"
                        value={row.generationNote || ""}
                        onChange={(e) => updateEntry(row.key, { generationNote: e.target.value })}
                      />
                    </>
                  ) : null}
                </div>
              ))}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={addEntry}
                  className="btn-secondary text-sm"
                  disabled={entries.length >= 20}
                >
                  + Add another {entryNoun}
                </button>
                <button
                  type="button"
                  onClick={addEntry}
                  className="btn-ghost text-sm"
                  disabled={entries.length >= 20}
                >
                  + Add more
                </button>
              </div>
            </div>
          ) : null}

          {mode === "file" ? (
            <>
              <input
                className="input"
                placeholder="Shared note for this batch (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <input
                type="file"
                multiple
                accept={fileAccept || undefined}
                onChange={(e) => setFiles(Array.from(e.target.files || []).slice(0, 10))}
                className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:text-white"
                required={files.length === 0}
              />
              {files.length > 0 ? (
                <ul className="space-y-1 text-xs text-slate-600">
                  {files.map((file) => (
                    <li key={`${file.name}-${file.size}`}>
                      {file.name} · {Math.max(1, Math.round(file.size / 1024))} KB
                    </li>
                  ))}
                </ul>
              ) : null}
              <p className="text-xs text-slate-500">
                Select multiple files at once (max 10). Keep each under ~750 KB.
              </p>
            </>
          ) : null}

          {mode === "subject" ? (
            <input
              className="input"
              placeholder="Subject name (e.g. AP Statistics FRQ Lab)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          ) : null}

          {mode === "member" ? (
            <>
              <input
                className="input"
                placeholder="Member name"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <input
                className="input"
                placeholder="Note (optional)"
                value={memberNote}
                onChange={(e) => setMemberNote(e.target.value)}
              />
              <input
                className="input"
                placeholder="GitHub username (e.g. octocat)"
                value={githubUser}
                onChange={(e) => setGithubUser(e.target.value)}
              />
            </>
          ) : null}

          {!allowPublicContribution && unlocked && !forceCodeField && (
            <div className="space-y-2 rounded-xl bg-emerald-50 px-3 py-3 text-xs text-emerald-900">
              <p>
                Editor unlocked ({editor?.level}). Saves use your login session — no change code
                needed.{" "}
                <Link href="/login" className="font-medium underline">
                  Manage login
                </Link>
              </p>
              <button
                type="button"
                className="font-medium text-emerald-950 underline"
                onClick={() => setForceCodeField(true)}
              >
                Use change code override
              </button>
            </div>
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
                once — then this field stays hidden.
              </p>
            </div>
          )}

          {allowPublicContribution && (
            <p className="rounded-xl bg-emerald-50 px-3 py-3 text-xs text-emerald-900">
              Public contribution: no change code is needed.
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
              {loading
                ? "Saving…"
                : multiMode
                  ? `Save all (${mode === "file" ? files.length || 0 : entries.length})`
                  : "Save"}
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
