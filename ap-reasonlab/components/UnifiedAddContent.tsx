"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import BulkEntryEditor from "@/components/BulkEntryEditor";
import RichContent from "@/components/RichContent";
import { useEditorMode } from "@/components/EditorModeProvider";
import {
  BULK_FILE_LIMIT,
  blankBulkDraftEntry,
  type BulkDraftEntry,
} from "@/lib/bulk-draft-rows";
import { readResponseJson } from "@/lib/safe-json";
import { isImageFile } from "@/lib/media-files";
import { assertUploadableDataUrl, assertUploadableFile } from "@/lib/upload-limits";
import { sortNotesWithAi } from "@/lib/structure-concept-client";

type ContentType = "concept" | "formula" | "practice" | "document" | "file" | "image" | "folder";

type SubjectOption = {
  id: string;
  name: string;
};

type Props = {
  subjectId?: string;
  subjectName?: string;
  subjects?: SubjectOption[];
  onSaved?: () => void;
  label?: string;
  baseUpdatedAt?: number;
};

const contentTypes: Array<{ value: ContentType; label: string }> = [
  { value: "concept", label: "Concepts" },
  { value: "formula", label: "Formulas" },
  { value: "practice", label: "Practice sets" },
  { value: "document", label: "Documents" },
  { value: "file", label: "Files" },
  { value: "image", label: "Images" },
  { value: "folder", label: "Folders" },
];

const BULK_TYPES: ContentType[] = ["concept", "formula", "practice", "document", "folder"];

export default function UnifiedAddContent({
  subjectId = "",
  subjectName = "",
  subjects,
  onSaved,
  label = "+ Add content",
  baseUpdatedAt,
}: Props) {
  const { active: editMode, unlocked } = useEditorMode();
  const canPickSubject = Boolean(subjects && subjects.length > 0);
  const initialSubjectId = useMemo(() => {
    if (subjectId && subjectId !== "all") return subjectId;
    return subjects?.[0]?.id || "";
  }, [subjectId, subjects]);
  const [chosenSubjectId, setChosenSubjectId] = useState(initialSubjectId);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<ContentType>("concept");
  const [entries, setEntries] = useState<BulkDraftEntry[]>([blankBulkDraftEntry()]);
  const [changeCode, setChangeCode] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [fileNote, setFileNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [structuringKey, setStructuringKey] = useState("");

  const bulkMode = BULK_TYPES.includes(type);

  useEffect(() => {
    setChosenSubjectId(initialSubjectId);
  }, [initialSubjectId]);

  const chosenSubject = useMemo(() => {
    const fromList = subjects?.find((subject) => subject.id === chosenSubjectId);
    if (fromList) return fromList;
    if (chosenSubjectId) {
      return { id: chosenSubjectId, name: subjectName || chosenSubjectId };
    }
    return { id: subjectId, name: subjectName || subjectId || "Content manager" };
  }, [chosenSubjectId, subjectId, subjectName, subjects]);

  useEffect(() => {
    if (!open) return;
    setEntries([blankBulkDraftEntry()]);
    setFiles([]);
    setFileNote("");
  }, [type, open]);

  async function fileAsDataUrl(selected: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(selected);
    });
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const requestedStatus: "draft" | "published" = submitter?.value === "draft" ? "draft" : "published";
    setBusy(true);
    setMessage("");
    try {
      if (!chosenSubject.id) throw new Error("Choose a subject first.");
      const subjectLabel = chosenSubject.name || chosenSubject.id;
      const space = subjectLabel;

      let action = "";
      let item: Record<string, unknown> | undefined;
      let items: Record<string, unknown>[] | undefined;

      if (type === "file" || type === "image") {
        if (files.length === 0) {
          throw new Error(type === "image" ? "Choose at least one image" : "Choose at least one file");
        }
        if (type === "image" && files.some((f) => !isImageFile(f))) {
          throw new Error("Image upload accepts image files only.");
        }
        action = "add_files";
        for (const file of files) assertUploadableFile(file);
        items = await Promise.all(
          files.map(async (file) => {
            const dataUrl = await fileAsDataUrl(file);
            assertUploadableDataUrl(dataUrl, file.name);
            return {
              name: file.name,
              mime: file.type,
              dataUrl,
              note: fileNote || undefined,
              area: "ap-subject",
              space,
            };
          })
        );
      } else if (bulkMode) {
        const cleaned = entries
          .map((row) => ({
            ...row,
            title: row.title.trim(),
            content: row.content.trim(),
            note: row.note.trim(),
          }))
          .filter((row) => row.title || row.content || row.note);

        if (cleaned.length === 0) throw new Error("Add at least one row.");
        for (const row of cleaned) {
          if (!row.title) throw new Error("Each row needs a title.");
          if (type === "practice") {
            if (!row.content && !row.note) {
              throw new Error("Each practice set needs a description or first question.");
            }
          } else if (type !== "folder" && !row.content) {
            throw new Error("Each row needs content.");
          }
        }

        if (type === "practice") {
          action = "add_questionnaires";
          items = cleaned.map((row) => ({
            title: row.title,
            subject: subjectLabel,
            description: row.content.slice(0, 4_000),
            firstPrompt: row.note.trim() || row.content,
            estimatedMinutes: Number(row.minutes || "20") || 20,
            generationNote:
              row.generationNote?.trim() ||
              `Added from Manage · ${new Date().toISOString().slice(0, 10)}`,
            difficultyTier: Number(row.difficultyTier || "2") || 2,
            hint: "Attempt before asking for more hints.",
          }));
        } else if (type === "folder") {
          action = "add_folders";
          items = cleaned.map((row) => ({
            title: row.title,
            note: row.note || undefined,
            area: "ap-subject",
            space,
          }));
        } else {
          action = "add_content_items";
          items = cleaned.map((row) => ({
            subjectId: chosenSubject.id,
            type,
            title: row.title,
            content: row.content,
            tags: type === "document" && row.category.trim() ? [row.category.trim()] : [],
            difficulty: "standard",
            status: requestedStatus,
          }));
        }
      } else {
        throw new Error("Unknown content type.");
      }

      const response = await fetch("/api/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action,
          item,
          items,
          changeCode: changeCode.trim() || undefined,
          githubToken: githubToken.trim() || undefined,
          baseUpdatedAt: baseUpdatedAt || undefined,
        }),
      });
      const parsed = await readResponseJson<{
        error?: string;
        content?: { questionnaires?: Array<{ title: string; id: string }> };
      }>(response);
      if (!parsed.ok) throw new Error(parsed.error);
      if (!response.ok) throw new Error(parsed.data.error || "Save failed");

      const count =
        type === "file" || type === "image"
          ? files.length
          : cleanedCount(entries);

      if (type === "practice" && count === 1) {
        const title = entries[0]?.title.trim();
        const created = parsed.data.content?.questionnaires?.find((q) => q.title === title);
        const setHref = created?.id
          ? `/questionnaires/${created.id}`
          : `/practice?subject=${encodeURIComponent(subjectLabel)}`;
        setMessage(`Saved 1 practice set. Opening…`);
        window.setTimeout(() => window.location.assign(setHref), 600);
      } else {
        setMessage(`Saved ${count} item${count === 1 ? "" : "s"} successfully.`);
      }

      setEntries([blankBulkDraftEntry()]);
      setFiles([]);
      setFileNote("");
      onSaved?.();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function structureEntry(key: string) {
    const row = entries.find((entry) => entry.key === key);
    if (!row?.content.trim()) return;
    setStructuringKey(key);
    setMessage("");
    try {
      const result = await sortNotesWithAi({
        name: row.title.trim() || "Concept",
        area: chosenSubject.name || chosenSubject.id,
        content: row.content,
      });
      setEntries((prev) =>
        prev.map((entry) => (entry.key === key ? { ...entry, content: result.formatted } : entry))
      );
      setMessage(result.note);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Structure failed");
    } finally {
      setStructuringKey("");
    }
  }

  if (!editMode && !unlocked) return null;

  return (
    <>
      <button type="button" className="btn-primary" onClick={() => setOpen(true)}>
        {label}
      </button>
      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-slate-950/55 p-4 pt-[8vh]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-content-title"
        >
          <form
            onSubmit={(e) => void submit(e)}
            className="w-full max-w-2xl space-y-4 rounded-3xl bg-white p-5 shadow-2xl md:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
                  {chosenSubject.name || "Content manager"}
                </p>
                <h2 id="add-content-title" className="mt-1 text-2xl font-bold">
                  Batch add content
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Up to 20 rows per type · up to {BULK_FILE_LIMIT} files/images at once
                </p>
              </div>
              <button type="button" className="btn-ghost" onClick={() => setOpen(false)} aria-label="Close">
                ✕
              </button>
            </div>

            <fieldset>
              <legend className="mb-2 text-sm font-semibold">Content type</legend>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                {contentTypes.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setType(option.value)}
                    className={type === option.value ? "filter-pill-active" : "filter-pill"}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </fieldset>

            {canPickSubject ? (
              <label className="block text-sm font-medium">
                Subject
                <select
                  className="input mt-1"
                  value={chosenSubject.id}
                  onChange={(event) => setChosenSubjectId(event.target.value)}
                  required
                >
                  {subjects!.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <label className="block text-sm font-medium">
                Subject
                <input className="input mt-1" value={chosenSubject.name || chosenSubject.id} disabled />
              </label>
            )}

            {type === "file" || type === "image" ? (
              <>
                <input
                  className="input"
                  placeholder="Shared note for this batch (optional)"
                  value={fileNote}
                  onChange={(event) => setFileNote(event.target.value)}
                />
                <label className="block text-sm font-medium">
                  {type === "image"
                    ? `Choose up to ${BULK_FILE_LIMIT} images`
                    : `Choose up to ${BULK_FILE_LIMIT} files`}
                  <input
                    className="mt-2 block w-full text-sm"
                    type="file"
                    multiple
                    accept={type === "image" ? "image/*" : undefined}
                    onChange={(event) =>
                      setFiles(Array.from(event.target.files || []).slice(0, BULK_FILE_LIMIT))
                    }
                    required={files.length === 0}
                  />
                  <span className="mt-1 block text-xs text-slate-500">
                    {files.length} selected · each must stay under ~750 KB
                  </span>
                </label>
              </>
            ) : (
              <>
                <BulkEntryEditor
                  variant={type === "concept" ? "concept" : type}
                  entries={entries}
                  onChange={setEntries}
                  onStructureConcept={type === "concept" ? (key) => void structureEntry(key) : undefined}
                  structuringKey={structuringKey}
                />
                {entries.some((row) => row.title.trim() && (row.content.trim() || row.note.trim())) ? (
                  <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Live preview before save
                    </p>
                    {entries
                      .filter((row) => row.title.trim() && (row.content.trim() || row.note.trim()))
                      .map((row) => (
                        <div key={`preview-${row.key}`} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                          <h3 className="text-base font-semibold text-slate-900">{row.title.trim()}</h3>
                          {type === "practice" && row.note.trim() ? (
                            <p className="mt-1 text-xs text-slate-500">First question preview below description</p>
                          ) : null}
                          <div className="mt-2">
                            <RichContent className="text-sm">{row.content || row.note}</RichContent>
                          </div>
                          {type === "practice" && row.note.trim() && row.content.trim() ? (
                            <div className="mt-3 border-t border-slate-200 pt-3">
                              <RichContent className="text-sm">{row.note}</RichContent>
                            </div>
                          ) : null}
                        </div>
                      ))}
                  </div>
                ) : null}
              </>
            )}

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              {unlocked ? (
                <p className="text-sm text-emerald-800">
                  Editor unlocked — batch save uses your login session.{" "}
                  <Link href="/login" className="font-medium underline">
                    /login
                  </Link>
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    type="password"
                    className="input"
                    placeholder="Content change code (or unlock at /login)"
                    value={changeCode}
                    onChange={(event) => setChangeCode(event.target.value)}
                    required
                  />
                  <input
                    type="password"
                    className="input"
                    placeholder="GitHub token (optional)"
                    value={githubToken}
                    onChange={(event) => setGithubToken(event.target.value)}
                  />
                </div>
              )}
              {unlocked && (
                <input
                  type="password"
                  className="input mt-3"
                  placeholder="GitHub token (optional)"
                  value={githubToken}
                  onChange={(event) => setGithubToken(event.target.value)}
                />
              )}
            </div>

            {message ? (
              <p
                role="status"
                className={
                  /failed|Wrong|Choose|needs|least/i.test(message)
                    ? "text-sm text-red-600"
                    : "text-sm text-emerald-700"
                }
              >
                {message}
              </p>
            ) : null}

            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
                Cancel
              </button>
              {bulkMode && type !== "practice" && type !== "folder" ? (
                <button type="submit" value="draft" className="btn-secondary" disabled={busy}>
                  Save drafts
                </button>
              ) : null}
              <button type="submit" value="published" className="btn-primary" disabled={busy}>
                {busy ? "Saving…" : "Save batch"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

function cleanedCount(entries: BulkDraftEntry[]) {
  return entries.filter((row) => row.title.trim() || row.content.trim() || row.note.trim()).length;
}
