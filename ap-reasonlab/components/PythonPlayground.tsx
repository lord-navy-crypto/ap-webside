"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Example = { id: string; title: string; code: string };

type Props = {
  examples: Example[];
  storageKey?: string;
};

type PyodideLike = {
  runPythonAsync: (code: string) => Promise<unknown>;
  setStdout: (options: { batched: (text: string) => void }) => void;
  setStderr: (options: { batched: (text: string) => void }) => void;
  setStdin?: (options: { stdin: () => string }) => void;
};

declare global {
  interface Window {
    loadPyodide?: (options: { indexURL: string }) => Promise<PyodideLike>;
  }
}

const PYODIDE_VERSION = "0.27.5";
const PYODIDE_INDEX = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

const DEFAULT_PYTHON = `nums = [3, 7, 2, 9]
avg = sum(nums) / len(nums)
print("numbers:", nums)
print("average:", avg)
`;

function loadPyodideScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.loadPyodide) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-ke-pyodide]");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Pyodide script")));
      return;
    }
    const script = document.createElement("script");
    script.src = `${PYODIDE_INDEX}pyodide.js`;
    script.async = true;
    script.dataset.kePyodide = "1";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Pyodide from CDN"));
    document.head.appendChild(script);
  });
}

export default function PythonPlayground({
  examples,
  storageKey = "ke-code-python-draft",
}: Props) {
  const runnableFirst = useMemo(() => {
    const nonInput = examples.filter((item) => !item.code.includes("input("));
    const withInput = examples.filter((item) => item.code.includes("input("));
    return [...nonInput, ...withInput];
  }, [examples]);
  const starter = runnableFirst[0]?.code || DEFAULT_PYTHON;

  const [code, setCode] = useState(starter);
  const [output, setOutput] = useState("Ready. Press Run to execute in the browser (Pyodide).");
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "running" | "error">("idle");
  const [selected, setSelected] = useState(runnableFirst[0]?.id || examples[0]?.id || "default");
  const [note, setNote] = useState("");
  const pyodideRef = useRef<PyodideLike | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      setCode(stored);
      setSelected("draft");
    }
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, code);
  }, [code, storageKey]);

  async function ensurePyodide() {
    if (pyodideRef.current) return pyodideRef.current;
    setStatus("loading");
    setOutput("Loading Python runtime (first time may take a few seconds)…");
    await loadPyodideScript();
    if (!window.loadPyodide) throw new Error("Pyodide loader missing");
    const pyodide = await window.loadPyodide({ indexURL: PYODIDE_INDEX });
    if (pyodide.setStdin) {
      pyodide.setStdin({
        stdin: () => {
          const value = window.prompt("Python input()", "") ?? "";
          return `${value}\n`;
        },
      });
    }
    pyodideRef.current = pyodide;
    setStatus("ready");
    return pyodide;
  }

  async function run() {
    setNote("");
    setStatus("running");
    setOutput("");
    try {
      const pyodide = await ensurePyodide();
      let buffer = "";
      pyodide.setStdout({
        batched: (text) => {
          buffer += text;
          setOutput(buffer || "(no output)");
        },
      });
      pyodide.setStderr({
        batched: (text) => {
          buffer += text;
          setOutput(buffer || "(no output)");
        },
      });
      await pyodide.runPythonAsync(code);
      if (!buffer.trim()) setOutput("(ran successfully — no print output)");
      setStatus("ready");
      setNote("Finished.");
    } catch (err) {
      setStatus("error");
      setOutput(err instanceof Error ? err.message : String(err));
      setNote("Runtime error — fix the code and try again.");
    }
  }

  function loadExample(id: string) {
    setSelected(id);
    if (id === "draft") return;
    const found = examples.find((item) => item.id === id);
    if (!found) return;
    setCode(found.code);
    setNote(`Loaded “${found.title}”.`);
  }

  function resetStarter() {
    setCode(starter);
    setSelected(runnableFirst[0]?.id || examples[0]?.id || "default");
    setOutput("Ready. Press Run to execute in the browser (Pyodide).");
    setNote("Reset to starter example.");
    setStatus(pyodideRef.current ? "ready" : "idle");
  }

  const exampleOptions = [{ id: "draft", title: "Your draft" }, ...examples];

  return (
    <section className="card space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
            Online editor
          </p>
          <h2 className="text-xl font-bold">Python playground</h2>
          <p className="mt-1 text-sm text-slate-600">
            Runs with Pyodide in your browser — no server. Draft auto-saves on this device.
            <code className="mx-1 rounded bg-slate-100 px-1">input()</code>
            uses a browser prompt.
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
          <button
            type="button"
            className="btn-primary self-end"
            onClick={() => void run()}
            disabled={status === "loading" || status === "running"}
          >
            {status === "loading"
              ? "Loading Python…"
              : status === "running"
                ? "Running…"
                : "Run"}
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
              setNote("");
            }}
            spellCheck={false}
            aria-label="Python source editor"
          />
        </label>
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">Output</p>
            <span className="text-xs text-slate-500">
              {status === "idle" && "not loaded"}
              {status === "loading" && "loading runtime"}
              {status === "ready" && "runtime ready"}
              {status === "running" && "running"}
              {status === "error" && "error"}
            </span>
          </div>
          <pre className="mt-2 h-[22rem] overflow-auto rounded-xl border border-slate-300 bg-slate-950 p-4 font-mono text-xs leading-relaxed text-emerald-100 whitespace-pre-wrap">
            {output}
          </pre>
        </div>
      </div>
      {note && (
        <p className={`text-xs ${status === "error" ? "text-red-600" : "text-emerald-700"}`}>
          {note}
        </p>
      )}
    </section>
  );
}
