"use client";

import { useId, useRef, useState } from "react";
import Link from "next/link";
import UploadAndShow from "@/components/UploadAndShow";
import { saveImage, saveLearningItem } from "@/lib/storage";

type Props = {
  /** Window title shown in the chrome bar */
  title?: string;
  /** Shared site storage area key */
  folderArea: string;
  /** Isolated space (subject name, slug, folder:id, _root) */
  spaceKey?: string;
  spaceBasePath?: string;
  defaultSubject?: string;
  /** Collapse shared uploads by default */
  collapsedByDefault?: boolean;
  allowPublicContributions?: boolean;
  /** Show private Learning Box image capture (IndexedDB, this browser only) */
  enablePrivateImages?: boolean;
  className?: string;
};

/**
 * Unified Mac-like display frame used across AP / Toolbox / study pages.
 * - Scrollable content viewport
 * - Shared site uploads (docs, images, files) via UploadAndShow
 * - Optional private image → Learning Box / Picture library
 */
export default function UnifiedMediaFrame({
  title = "Files & pictures",
  folderArea,
  spaceKey,
  spaceBasePath,
  defaultSubject,
  collapsedByDefault = false,
  allowPublicContributions = false,
  enablePrivateImages = true,
  className = "",
}: Props) {
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [privateNote, setPrivateNote] = useState("");
  const [privateError, setPrivateError] = useState("");
  const [privateBusy, setPrivateBusy] = useState(false);

  async function onPrivateImages(files: FileList | null) {
    if (!files?.length) return;
    setPrivateBusy(true);
    setPrivateError("");
    setPrivateNote("");
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          throw new Error("Private Learning Box upload here accepts images only.");
        }
        if (file.size > 4_500_000) {
          throw new Error("Image is too large (keep under ~4 MB).");
        }
        const dataUrl = await readAsDataUrl(file);
        const name = file.name.replace(/\.[^.]+$/, "") || "Picture";
        await saveImage({
          kind: "uploaded",
          name,
          dataUrl,
          note: `From ${title}`,
          tags: ["learning-box", folderArea],
        });
        await saveLearningItem({
          title: name,
          content: dataUrl,
          category: "Private image",
        });
      }
      setPrivateNote("Saved privately in this browser (Learning Box + Picture).");
      if (fileRef.current) fileRef.current.value = "";
    } catch (caught) {
      setPrivateError(caught instanceof Error ? caught.message : "Private save failed");
    } finally {
      setPrivateBusy(false);
    }
  }

  return (
    <section
      className={`overflow-hidden rounded-2xl border border-slate-300 bg-slate-100 shadow-lg ${className}`}
    >
      {/* Mac-like title bar */}
      <div className="flex items-center gap-3 border-b border-slate-300 bg-gradient-to-b from-slate-200 to-slate-150 px-3 py-2">
        <div className="flex gap-1.5" aria-hidden>
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        </div>
        <p className="min-w-0 flex-1 truncate text-center text-xs font-semibold text-slate-700">
          {title}
        </p>
        <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
          Scroll
        </span>
      </div>

      {/* Scrollable viewport */}
      <div className="max-h-[min(70vh,36rem)] overflow-y-auto overscroll-contain bg-white p-3 md:p-4">
        <UploadAndShow
          title="Shared files, documents & pictures"
          folderArea={folderArea}
          spaceKey={spaceKey}
          spaceBasePath={spaceBasePath}
          defaultSubject={defaultSubject}
          collapsedByDefault={collapsedByDefault}
          allowPublicContributions={allowPublicContributions}
          alsoShow={["document", "folder"]}
        />

        {enablePrivateImages && (
          <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50/70 p-3">
            <p className="text-sm font-semibold text-violet-950">Private picture (this device)</p>
            <p className="mt-1 text-xs text-violet-900/80">
              Uploads stay in your browser — Learning Box &amp;{" "}
              <Link href="/picture" className="underline">
                Picture
              </Link>
              . Not published to the shared site.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <label
                htmlFor={inputId}
                className="btn-secondary cursor-pointer text-sm"
              >
                {privateBusy ? "Saving…" : "Upload private image"}
              </label>
              <input
                id={inputId}
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                disabled={privateBusy}
                onChange={(event) => void onPrivateImages(event.target.files)}
              />
              <Link href="/learning-box" className="btn-ghost text-sm">
                Open Learning Box
              </Link>
            </div>
            {privateNote && <p className="mt-2 text-xs text-emerald-700">{privateNote}</p>}
            {privateError && <p className="mt-2 text-xs text-red-600">{privateError}</p>}
          </div>
        )}
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
