"use client";

import type { ClipboardEvent, Dispatch, SetStateAction } from "react";

function childrenToMarkdown(element: Element): string {
  return Array.from(element.childNodes).map(nodeToMarkdown).join("");
}

function tableToMarkdown(table: Element): string {
  const rows = Array.from(table.querySelectorAll("tr")).map((row) =>
    Array.from(row.querySelectorAll(":scope > th, :scope > td")).map((cell) =>
      childrenToMarkdown(cell).replace(/\|/g, "\\|").replace(/\s*\n\s*/g, " ").trim()
    )
  ).filter((row) => row.length > 0);
  if (rows.length === 0) return "";
  const width = Math.max(...rows.map((row) => row.length));
  const normalized = rows.map((row) => [...row, ...Array(Math.max(0, width - row.length)).fill("")]);
  return `\n\n| ${normalized[0].join(" | ")} |\n| ${Array(width).fill("---").join(" | ")} |\n${normalized.slice(1).map((row) => `| ${row.join(" | ")} |`).join("\n")}\n\n`;
}

function nodeToMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent || "";
  if (!(node instanceof Element)) return "";

  const tag = node.tagName.toLowerCase();
  const content = childrenToMarkdown(node);
  if (/^h[1-6]$/.test(tag)) return `\n\n${"#".repeat(Number(tag[1]))} ${content.trim()}\n\n`;
  if (["p", "div", "section", "article"].includes(tag)) return `\n\n${content.trim()}\n\n`;
  if (tag === "br") return "\n";
  if (tag === "strong" || tag === "b") return `**${content}**`;
  if (tag === "em" || tag === "i") return `*${content}*`;
  if (tag === "blockquote") return `\n\n${content.trim().split("\n").map((line) => `> ${line}`).join("\n")}\n\n`;
  if (tag === "a") {
    const href = node.getAttribute("href");
    return href ? `[${content.trim() || href}](${href})` : content;
  }
  if (tag === "pre") return `\n\n\`\`\`\n${node.textContent?.trim() || ""}\n\`\`\`\n\n`;
  if (tag === "code") return `\`${content}\``;
  if (tag === "table") return tableToMarkdown(node);
  if (tag === "li") {
    const parent = node.parentElement;
    const marker = parent?.tagName.toLowerCase() === "ol"
      ? `${Array.from(parent.children).indexOf(node) + 1}.`
      : "-";
    return `${marker} ${content.trim().replace(/\n+/g, "\n  ")}\n`;
  }
  if (tag === "ul" || tag === "ol") return `\n${content}\n`;
  return content;
}

/** Convert rich clipboard HTML (especially ChatGPT KaTeX) into editable Markdown + LaTeX. */
export function richHtmlToMarkdown(html: string): string {
  const document = new DOMParser().parseFromString(html, "text/html");

  document.querySelectorAll(".katex-display").forEach((display) => {
    const latex = display.querySelector("annotation[encoding='application/x-tex']")?.textContent?.trim();
    if (latex) display.replaceWith(document.createTextNode(`\n\n$$\n${latex}\n$$\n\n`));
  });
  document.querySelectorAll(".katex").forEach((math) => {
    const latex = math.querySelector("annotation[encoding='application/x-tex']")?.textContent?.trim();
    if (latex) math.replaceWith(document.createTextNode(`$${latex}$`));
  });

  return childrenToMarkdown(document.body)
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function handleRichPaste(
  event: ClipboardEvent<HTMLTextAreaElement>,
  value: string,
  setValue: Dispatch<SetStateAction<string>>,
) {
  const html = event.clipboardData.getData("text/html");
  if (!html || !/(?:class=["'][^"']*katex|<h[1-6]\b|<table\b|<ul\b|<ol\b)/i.test(html)) return;

  const markdown = richHtmlToMarkdown(html);
  if (!markdown) return;
  event.preventDefault();
  const textarea = event.currentTarget;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  setValue(`${value.slice(0, start)}${markdown}${value.slice(end)}`);
  requestAnimationFrame(() => {
    const cursor = start + markdown.length;
    textarea.setSelectionRange(cursor, cursor);
  });
}
