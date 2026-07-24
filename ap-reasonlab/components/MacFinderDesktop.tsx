"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import ChangePanel from "@/components/ChangePanel";
import RichContent from "@/components/RichContent";
import { useEditorMode } from "@/components/EditorModeProvider";
import type { ManagedContent, ManagedDocument, ManagedFile, ManagedFolder } from "@/lib/managed-types";
import { ROOT_SPACE, normalizeSpace } from "@/lib/storage-space";

type Row =
  | { kind: "file"; item: ManagedFile }
  | { kind: "document"; item: ManagedDocument }
  | { kind: "folder"; item: ManagedFolder };

type Props = {
  data: Partial<ManagedContent>;
  changeCode: string;
  githubToken: string;
  onMutate: (action: string, extra: Record<string, unknown>) => Promise<boolean>;
  onContent: (content: Partial<ManagedContent>) => void;
};

function isImage(file: ManagedFile): boolean {
  return Boolean(file.mime?.startsWith("image/") || file.dataUrl?.startsWith("data:image"));
}

function iconFor(row: Row): string {
  if (row.kind === "folder") return "📁";
  if (row.kind === "document") return "📄";
  if (isImage(row.item as ManagedFile)) return "🖼";
  return "📎";
}

/**
 * Mac Finder–style backend for Manage → Files.
 * Same site storage as the top-right media windows on every page.
 */
export default function MacFinderDesktop({
  data,
  changeCode,
  onMutate,
  onContent,
}: Props) {
  const { unlocked } = useEditorMode();
  const [areaFilter, setAreaFilter] = useState("all");
  const [spaceFilter, setSpaceFilter] = useState("all");
  const [view, setView] = useState<"icons" | "list">("icons");
  const [selected, setSelected] = useState<Row | null>(null);
  const [dragOverArea, setDragOverArea] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const dropRef = useRef<HTMLDivElement>(null);

  const areas = useMemo(() => {
    const set = new Set<string>();
    for (const f of data.files || []) set.add(f.area || "general");
    for (const d of data.documents || []) set.add(d.area || "general");
    for (const folder of data.folders || []) set.add(folder.area || "general");
    return ["all", ...Array.from(set).sort()];
  }, [data.documents, data.files, data.folders]);

  const spacesInArea = useMemo(() => {
    const set = new Set<string>();
    const consider = (area?: string, space?: string) => {
      if (areaFilter !== "all" && (area || "general") !== areaFilter) return;
      set.add(normalizeSpace(space));
    };
    for (const f of data.files || []) consider(f.area, f.space);
    for (const d of data.documents || []) consider(d.area, d.space);
    for (const folder of data.folders || []) consider(folder.area, folder.space);
    return ["all", ...Array.from(set).sort()];
  }, [areaFilter, data.documents, data.files, data.folders]);

  const rows = useMemo(() => {
    const fileRows: Row[] = (data.files || []).map((item) => ({ kind: "file", item }));
    const docRows: Row[] = (data.documents || []).map((item) => ({ kind: "document", item }));
    const folderRows: Row[] = (data.folders || []).map((item) => ({ kind: "folder", item }));
    return [...folderRows, ...fileRows, ...docRows]
      .filter((row) => {
        const area =
          row.kind === "folder"
            ? row.item.area || "general"
            : row.item.area || "general";
        const space = normalizeSpace(row.item.space);
        if (areaFilter !== "all" && area !== areaFilter) return false;
        if (spaceFilter !== "all" && space !== spaceFilter) return false;
        return true;
      })
      .sort((a, b) => {
        if (a.kind === "folder" && b.kind !== "folder") return -1;
        if (b.kind === "folder" && a.kind !== "folder") return 1;
        const an = a.kind === "file" ? a.item.name : a.item.title;
        const bn = b.kind === "file" ? b.item.name : b.item.title;
        return an.localeCompare(bn);
      });
  }, [areaFilter, data.documents, data.files, data.folders, spaceFilter]);

  const relocate = useCallback(
    async (row: Row, area: string, space = ROOT_SPACE) => {
      if (row.kind === "folder") {
        setMessage("Folders keep their own area; create a new folder in the target area instead.");
        return;
      }
      if (!unlocked && !changeCode.trim()) {
        setMessage("Unlock with the content code to move files.");
        return;
      }
      const ok = await onMutate("update", {
        target: row.kind,
        id: row.item.id,
        item: { area, space },
      });
      if (ok) setMessage(`Moved to ${area} / ${space}`);
    },
    [changeCode, onMutate, unlocked]
  );

  async function onDesktopDrop(event: React.DragEvent) {
    event.preventDefault();
    setDragOverArea(null);
    const transfer = event.dataTransfer.getData("application/x-ke-media");
    if (transfer) {
      try {
        const payload = JSON.parse(transfer) as {
          kind: "file" | "document";
          id: string;
        };
        const row =
          payload.kind === "file"
            ? rows.find((r) => r.kind === "file" && r.item.id === payload.id)
            : rows.find((r) => r.kind === "document" && r.item.id === payload.id);
        if (row && areaFilter !== "all" && (row.kind === "file" || row.kind === "document")) {
          await relocate(row, areaFilter, spaceFilter === "all" ? ROOT_SPACE : spaceFilter);
        }
      } catch {
        /* ignore */
      }
      return;
    }

    const fileList = event.dataTransfer.files;
    if (!fileList?.length) return;
    if (!unlocked && !changeCode.trim()) {
      setMessage("Unlock with the content code to upload.");
      return;
    }
    const targetArea = areaFilter === "all" ? "manage" : areaFilter;
    const targetSpace = spaceFilter === "all" ? ROOT_SPACE : spaceFilter;
    const items: Array<{ name: string; mime: string; dataUrl: string }> = [];
    for (const file of Array.from(fileList).slice(0, 10)) {
      if (file.size > 1_000_000) {
        setMessage(`${file.name} is too large (keep under ~1MB).`);
        continue;
      }
      const dataUrl = await readAsDataUrl(file);
      items.push({ name: file.name, mime: file.type || "application/octet-stream", dataUrl });
    }
    if (!items.length) return;
    const ok = await onMutate("add_files", {
      items: items.map((item) => ({ ...item, area: targetArea, space: targetSpace })),
    });
    if (ok) setMessage(`Uploaded ${items.length} file(s) into ${targetArea}.`);
  }

  function onItemDragStart(event: React.DragEvent, row: Row) {
    if (row.kind === "folder") return;
    event.dataTransfer.setData(
      "application/x-ke-media",
      JSON.stringify({ kind: row.kind, id: row.item.id })
    );
    event.dataTransfer.effectAllowed = "move";
  }

  async function deleteRow(row: Row) {
    if (row.kind === "folder") {
      await onMutate("delete", { target: "folder", id: row.item.id });
    } else {
      await onMutate("delete", { target: row.kind, id: row.item.id });
    }
    if (selected?.item.id === row.item.id) setSelected(null);
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-400 bg-[#c8c8c8] shadow-xl">
      {/* Title bar */}
      <div className="flex items-center gap-3 border-b border-slate-400 bg-gradient-to-b from-[#e8e8e8] to-[#d0d0d0] px-3 py-2">
        <div className="flex gap-1.5" aria-hidden>
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        </div>
        <p className="flex-1 text-center text-xs font-semibold text-slate-700">
          Knowledge Explorer · Finder
        </p>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setView("icons")}
            className={`rounded px-2 py-0.5 text-[10px] font-medium ${
              view === "icons" ? "bg-white shadow" : "text-slate-600 hover:bg-white/60"
            }`}
          >
            Icons
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={`rounded px-2 py-0.5 text-[10px] font-medium ${
              view === "list" ? "bg-white shadow" : "text-slate-600 hover:bg-white/60"
            }`}
          >
            List
          </button>
        </div>
      </div>

      <div className="grid min-h-[28rem] gap-0 md:grid-cols-[13rem_1fr_15rem]">
        {/* Sidebar — areas like Finder favorites */}
        <aside className="border-b border-slate-300 bg-[#f0f0f0] p-2 md:border-b-0 md:border-r">
          <p className="mb-1 px-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">
            Locations
          </p>
          <ul className="space-y-0.5">
            {areas.map((area) => (
              <li key={area}>
                <button
                  type="button"
                  onClick={() => {
                    setAreaFilter(area);
                    setSpaceFilter("all");
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverArea(area);
                  }}
                  onDragLeave={() => setDragOverArea(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverArea(null);
                    const raw = e.dataTransfer.getData("application/x-ke-media");
                    if (!raw || area === "all") return;
                    try {
                      const payload = JSON.parse(raw) as { kind: "file" | "document"; id: string };
                      const source =
                        payload.kind === "file"
                          ? (data.files || []).find((f) => f.id === payload.id)
                          : (data.documents || []).find((d) => d.id === payload.id);
                      if (!source) return;
                      void relocate(
                        { kind: payload.kind, item: source } as Row,
                        area,
                        normalizeSpace(source.space)
                      );
                    } catch {
                      /* ignore */
                    }
                  }}
                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm ${
                    areaFilter === area
                      ? "bg-[#0a84ff] font-semibold text-white"
                      : dragOverArea === area
                        ? "bg-sky-100 text-sky-900"
                        : "text-slate-700 hover:bg-white"
                  }`}
                >
                  <span aria-hidden>{area === "all" ? "🗂" : "📂"}</span>
                  <span className="truncate">{area === "all" ? "All areas" : area}</span>
                </button>
              </li>
            ))}
          </ul>
          {spacesInArea.length > 2 ? (
            <>
              <p className="mb-1 mt-3 px-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Spaces
              </p>
              <ul className="max-h-40 space-y-0.5 overflow-y-auto">
                {spacesInArea.map((space) => (
                  <li key={space}>
                    <button
                      type="button"
                      onClick={() => setSpaceFilter(space)}
                      className={`w-full truncate rounded-lg px-2 py-1 text-left text-xs ${
                        spaceFilter === space
                          ? "bg-white font-semibold text-slate-900 shadow-sm"
                          : "text-slate-600 hover:bg-white/70"
                      }`}
                    >
                      {space === "all" ? "All spaces" : space}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </aside>

        {/* Desktop / icon view */}
        <div
          ref={dropRef}
          className={`relative overflow-y-auto bg-[radial-gradient(circle_at_20%_20%,#dce9f7,transparent_40%),linear-gradient(160deg,#6a8fad_0%,#3d5a73_100%)] p-4 ${
            dragOverArea === "__desktop" ? "ring-2 ring-inset ring-sky-300" : ""
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOverArea("__desktop");
          }}
          onDragLeave={() => setDragOverArea(null)}
          onDrop={(e) => void onDesktopDrop(e)}
        >
          <p className="mb-3 text-center text-[11px] font-medium text-white/90 drop-shadow">
            Drag files onto Locations to move · Drop files here to upload · Same storage as page Media windows
          </p>

          {rows.length === 0 ? (
            <p className="mt-16 text-center text-sm text-white/80">This folder is empty.</p>
          ) : view === "icons" ? (
            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
              {rows.map((row) => {
                const name = row.kind === "file" ? row.item.name : row.item.title;
                const active = selected?.item.id === row.item.id && selected.kind === row.kind;
                return (
                  <li key={`${row.kind}-${row.item.id}`}>
                    <button
                      type="button"
                      draggable={row.kind !== "folder"}
                      onDragStart={(e) => onItemDragStart(e, row)}
                      onClick={() => setSelected(row)}
                      onDoubleClick={() => setSelected(row)}
                      className={`flex w-full flex-col items-center gap-1 rounded-xl p-2 text-center ${
                        active ? "bg-sky-500/40 ring-1 ring-white/50" : "hover:bg-white/15"
                      }`}
                    >
                      {row.kind === "file" && isImage(row.item) && row.item.dataUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={row.item.dataUrl}
                          alt=""
                          className="h-14 w-14 rounded-lg object-cover shadow"
                        />
                      ) : (
                        <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-white/90 text-2xl shadow">
                          {iconFor(row)}
                        </span>
                      )}
                      <span className="line-clamp-2 w-full text-[11px] font-medium text-white drop-shadow">
                        {name}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <ul className="overflow-hidden rounded-xl bg-white/95 shadow">
              {rows.map((row) => {
                const name = row.kind === "file" ? row.item.name : row.item.title;
                const area = row.item.area || "general";
                const space = normalizeSpace(row.item.space);
                const active = selected?.item.id === row.item.id && selected.kind === row.kind;
                return (
                  <li key={`${row.kind}-${row.item.id}`}>
                    <button
                      type="button"
                      draggable={row.kind !== "folder"}
                      onDragStart={(e) => onItemDragStart(e, row)}
                      onClick={() => setSelected(row)}
                      className={`flex w-full items-center gap-3 border-b border-slate-100 px-3 py-2 text-left text-sm ${
                        active ? "bg-sky-100" : "hover:bg-slate-50"
                      }`}
                    >
                      <span className="text-lg">{iconFor(row)}</span>
                      <span className="min-w-0 flex-1 truncate font-medium text-slate-900">{name}</span>
                      <span className="hidden text-xs text-slate-500 sm:inline">{row.kind}</span>
                      <span className="hidden truncate text-xs text-slate-400 md:inline">
                        {area}/{space}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Preview / Get Info pane */}
        <aside className="border-t border-slate-300 bg-[#f6f6f6] p-3 md:border-l md:border-t-0">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Preview</p>
          {!selected ? (
            <p className="mt-4 text-sm text-slate-500">Select a file to preview what it looks like.</p>
          ) : (
            <div className="mt-3 space-y-3">
              <div className="flex justify-center">
                {selected.kind === "file" && isImage(selected.item) && selected.item.dataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selected.item.dataUrl}
                    alt=""
                    className="max-h-40 rounded-lg object-contain shadow"
                  />
                ) : (
                  <span className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white text-4xl shadow">
                    {iconFor(selected)}
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {selected.kind === "file" ? selected.item.name : selected.item.title}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {selected.kind} · {selected.item.area || "general"} /{" "}
                  {normalizeSpace(selected.item.space)}
                </p>
              </div>
              {selected.kind === "document" ? (
                <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2 text-xs">
                  <RichContent className="text-xs">{selected.item.content}</RichContent>
                </div>
              ) : null}
              {selected.kind === "file" && selected.item.dataUrl && !isImage(selected.item) ? (
                <a
                  href={selected.item.dataUrl}
                  download={selected.item.name}
                  className="inline-flex text-xs font-medium text-sky-700 underline"
                >
                  Download / open
                </a>
              ) : null}
              <button
                type="button"
                className="btn-ghost w-full text-xs text-red-600"
                onClick={() => void deleteRow(selected)}
              >
                Move to Trash (−)
              </button>
            </div>
          )}

          <div className="mt-6 border-t border-slate-200 pt-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">
              Upload into current location
            </p>
            <ChangePanel
              mode="file"
              folderArea={areaFilter === "all" ? "manage" : areaFilter}
              spaceKey={spaceFilter === "all" ? ROOT_SPACE : spaceFilter}
              onSaved={(content) => {
                if (content) onContent(content as ManagedContent);
              }}
            />
            <div className="mt-2">
              <ChangePanel
                mode="document"
                folderArea={areaFilter === "all" ? "manage" : areaFilter}
                spaceKey={spaceFilter === "all" ? ROOT_SPACE : spaceFilter}
                onSaved={(content) => {
                  if (content) onContent(content as ManagedContent);
                }}
              />
            </div>
          </div>
          {message ? <p className="mt-2 text-xs text-slate-600">{message}</p> : null}
          {!unlocked && !changeCode.trim() ? (
            <p className="mt-2 text-[10px] text-amber-800">
              Paste the content code above the tabs to move or delete files.
            </p>
          ) : null}
        </aside>
      </div>
    </section>
  );
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}
