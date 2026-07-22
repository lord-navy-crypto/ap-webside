import katex from "katex";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { toLatexSource } from "@/lib/unicode-math";

type Mode = "markdown" | "math" | "inline-math";

type Props = {
  children: string;
  /** markdown = prose + $math$; math = display formula; inline-math = inline formula */
  mode?: Mode;
  className?: string;
  /** Clamp long previews (e.g. list cards). Uses CSS line-clamp. */
  clampLines?: 2 | 3 | 4;
};

function renderKatex(source: string, displayMode: boolean): string {
  return katex.renderToString(toLatexSource(source), {
    throwOnError: false,
    displayMode,
    strict: "ignore",
    trust: false,
  });
}

/**
 * Shared Markdown + KaTeX renderer for authored study content.
 * Authors can write Markdown with $…$ / $$…$$; plain Unicode formulas also render in math modes.
 */
export default function RichContent({
  children,
  mode = "markdown",
  className = "",
  clampLines,
}: Props) {
  const text = (children ?? "").toString();
  if (!text.trim()) return null;

  const clampClass =
    clampLines === 2
      ? "line-clamp-2"
      : clampLines === 3
        ? "line-clamp-3"
        : clampLines === 4
          ? "line-clamp-4"
          : "";

  if (mode === "math" || mode === "inline-math") {
    const html = renderKatex(text, mode === "math");
    return (
      <div
        className={`rich-content rich-math overflow-x-auto ${clampClass} ${className}`.trim()}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <div className={`rich-content prose-study ${clampClass} ${className}`.trim()}>
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
        {text}
      </ReactMarkdown>
    </div>
  );
}

/** Prefer this for formula.expression fields (Unicode or LaTeX). */
export function FormulaMath({
  expression,
  className = "",
}: {
  expression: string;
  className?: string;
}) {
  return (
    <RichContent
      mode="math"
      className={`rounded-lg bg-slate-50 px-4 py-3 text-lg text-slate-900 ${className}`.trim()}
    >
      {expression}
    </RichContent>
  );
}
