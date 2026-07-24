"use client";

import { useState } from "react";
import RichContent from "@/components/RichContent";
import { handleRichPaste } from "@/lib/rich-paste";

type Props = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  help?: string;
  placeholder?: string;
  required?: boolean;
  minHeightClass?: string;
  /** Show Markdown + LaTeX rendered preview under the field */
  showPreview?: boolean;
  previewDefaultOpen?: boolean;
  id?: string;
};

/**
 * Study-content text field: rich paste (ChatGPT KaTeX → $...$), Markdown + LaTeX help,
 * and optional live preview. Use for concepts, formulas, practice, documents, forum, etc.
 * Do NOT use in code playgrounds.
 */
export default function MarkdownLatexField({
  value,
  onChange,
  label = "Full content",
  help = "Paste the complete write-up. Markdown is supported. Use $...$ for inline math and $$...$$ for display LaTeX.",
  placeholder = "Paste Markdown + LaTeX here…",
  required = false,
  minHeightClass = "min-h-[14rem]",
  showPreview = true,
  previewDefaultOpen = false,
  id,
}: Props) {
  const [preview, setPreview] = useState(previewDefaultOpen);

  return (
    <div className="space-y-2">
      {(label || help) && (
        <div className="space-y-1">
          {label ? <p className="text-sm font-medium text-slate-800">{label}</p> : null}
          {help ? (
            <p className="text-xs leading-relaxed text-slate-500">
              {help.includes("$...$") ? (
                <>
                  Paste the complete write-up. Markdown is supported. Use{" "}
                  <code className="rounded bg-slate-100 px-1">$...$</code> for inline math and{" "}
                  <code className="rounded bg-slate-100 px-1">$$...$$</code> for display LaTeX.
                </>
              ) : (
                help
              )}
            </p>
          ) : null}
        </div>
      )}
      <textarea
        id={id}
        className={`textarea w-full resize-y text-sm leading-relaxed ${minHeightClass}`}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onPaste={(event) =>
          handleRichPaste(event, value, (next) => {
            onChange(typeof next === "function" ? next(value) : next);
          })
        }
        required={required}
      />
      {showPreview && value.trim() ? (
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <button
            type="button"
            className="flex w-full items-center justify-between bg-slate-50 px-4 py-2.5 text-left text-sm font-semibold"
            onClick={() => setPreview((open) => !open)}
          >
            Markdown + LaTeX preview <span>{preview ? "−" : "+"}</span>
          </button>
          {preview ? (
            <div className="max-h-[min(60vh,28rem)] overflow-auto p-4">
              <RichContent>{value}</RichContent>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
