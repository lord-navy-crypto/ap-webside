"use client";

import { useEffect, useMemo, useState } from "react";

type Example = { id: string; title: string; code: string };

type Props = {
  examples: Example[];
  storageKey?: string;
};

const DEFAULT_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>KE Web Lab</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 1.5rem; background: #f8fafc; color: #0f172a; }
    .card { border: 1px solid #cbd5e1; border-radius: 12px; padding: 1rem; background: white; }
    button { margin-top: 0.75rem; padding: 0.5rem 0.9rem; border-radius: 8px; border: 0; background: #2563eb; color: white; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Web playground</h1>
    <p>Edit HTML/CSS/JS on the left. Preview updates when you press Run.</p>
    <button onclick="document.getElementById('out').textContent = 'Hello from JS ' + new Date().toLocaleTimeString()">
      Click me
    </button>
    <p id="out"></p>
  </div>
</body>
</html>`;

export default function HtmlPlayground({
  examples,
  storageKey = "ke-code-html-draft",
}: Props) {
  const starter = examples[0]?.code || DEFAULT_HTML;
  const [code, setCode] = useState(starter);
  const [preview, setPreview] = useState(starter);
  const [selected, setSelected] = useState(examples[0]?.id || "default");
  const [savedNote, setSavedNote] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      setCode(stored);
      setPreview(stored);
      setSelected("draft");
    }
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, code);
  }, [code, storageKey]);

  const exampleOptions = useMemo(
    () => [{ id: "draft", title: "Your draft" }, ...examples],
    [examples]
  );

  function run() {
    setPreview(code);
    setSavedNote("Preview refreshed.");
  }

  function loadExample(id: string) {
    setSelected(id);
    if (id === "draft") return;
    const found = examples.find((item) => item.id === id);
    if (!found) return;
    setCode(found.code);
    setPreview(found.code);
    setSavedNote(`Loaded “${found.title}”.`);
  }

  function resetStarter() {
    setCode(starter);
    setPreview(starter);
    setSelected(examples[0]?.id || "default");
    setSavedNote("Reset to starter example.");
  }

  return (
    <section className="card space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
            Online editor
          </p>
          <h2 className="text-xl font-bold">HTML / Web playground</h2>
          <p className="mt-1 text-sm text-slate-600">
            Edit in the browser and preview instantly. Draft auto-saves on this device.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="text-sm font-medium text-slate-600">
            Example
            <select
              className="input mt-1 min-w-[10rem]"
              value={selected}
              onChange={(event) => loadExample(event.target.value)}
            >
              {exampleOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="btn-secondary self-end" onClick={resetStarter}>
            Reset
          </button>
          <button type="button" className="btn-primary self-end" onClick={run}>
            Run preview
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="block min-w-0 text-sm font-medium">
          Source
          <textarea
            className="textarea mt-2 min-h-[22rem] font-mono text-xs leading-relaxed"
            value={code}
            onChange={(event) => {
              setCode(event.target.value);
              setSelected("draft");
              setSavedNote("");
            }}
            spellCheck={false}
            aria-label="HTML source editor"
          />
        </label>
        <div className="min-w-0">
          <p className="text-sm font-medium">Preview</p>
          <iframe
            title="HTML preview"
            className="mt-2 h-[22rem] w-full rounded-xl border border-slate-300 bg-white"
            sandbox="allow-scripts"
            srcDoc={preview}
          />
        </div>
      </div>
      {savedNote && <p className="text-xs text-emerald-700">{savedNote}</p>}
    </section>
  );
}
