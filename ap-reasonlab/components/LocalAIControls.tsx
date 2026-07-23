"use client";

import { useState } from "react";
import { useLocalAI, type AIMode } from "@/components/LocalAIProvider";

const MODES: Array<{ value: AIMode; label: string; detail: string }> = [
  {
    value: "auto",
    label: "Auto",
    detail: "Uses local AI when it is ready; otherwise uses the selected cloud channel.",
  },
  {
    value: "local",
    label: "Local AI",
    detail: "Runs only in this browser. Your prompt is not sent to the website AI server.",
  },
  {
    value: "cloud",
    label: "Cloud AI",
    detail: "Uses the website API or your selected bring-your-own-key provider.",
  },
];

export default function LocalAIControls() {
  const localAI = useLocalAI();
  const [confirmDownload, setConfirmDownload] = useState(false);
  const selected = localAI.models.find((model) => model.id === localAI.selectedModelId);
  const busy = localAI.status === "loading" || localAI.status === "generating";

  return (
    <section className="space-y-4 rounded-2xl border border-violet-200 bg-violet-50/60 p-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">AI mode</p>
        <div className="mt-2 grid gap-2 md:grid-cols-3">
          {MODES.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => localAI.setMode(item.value)}
              className={
                localAI.mode === item.value
                  ? "rounded-xl bg-violet-700 px-4 py-3 text-left text-white shadow"
                  : "rounded-xl border border-violet-200 bg-white px-4 py-3 text-left text-slate-800 hover:border-violet-400"
              }
            >
              <span className="block text-sm font-semibold">{item.label}</span>
              <span
                className={`mt-1 block text-xs ${
                  localAI.mode === item.value ? "text-violet-100" : "text-slate-500"
                }`}
              >
                {item.detail}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-violet-200 bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-slate-900">Local AI · runs on this device</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Nothing downloads until you choose Enable. First use needs internet; cached model
              files can normally be reused in this browser.
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              localAI.ready
                ? "bg-emerald-100 text-emerald-800"
                : localAI.webGPUSupported === false
                  ? "bg-red-100 text-red-700"
                  : "bg-slate-100 text-slate-600"
            }`}
          >
            {localAI.ready
              ? "Ready"
              : localAI.webGPUSupported === false
                ? "WebGPU unavailable"
                : "Not enabled"}
          </span>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
          <div>
            <label className="mb-1 block text-sm font-medium">Local model</label>
            <select
              className="input"
              value={localAI.selectedModelId}
              onChange={(event) => localAI.setSelectedModelId(event.target.value)}
              disabled={busy || localAI.ready || localAI.models.length === 0}
            >
              {localAI.models.length === 0 && <option>Loading model list…</option>}
              {localAI.models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.label} · about {model.vramMB} MB device memory
                  {model.cached ? " · cached" : ""}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              These are the two smallest instruction models in the installed WebLLM list. They are
              quick and private, but much less capable than cloud AI.
            </p>
          </div>
          <div className="flex items-end gap-2">
            {!localAI.ready ? (
              <button
                type="button"
                className="btn-primary"
                disabled={busy || !localAI.selectedModelId || localAI.webGPUSupported === false}
                onClick={() => setConfirmDownload(true)}
              >
                {localAI.status === "loading" ? "Loading…" : "Enable local AI"}
              </button>
            ) : (
              <button type="button" className="btn-secondary" onClick={() => void localAI.reset()}>
                Stop
              </button>
            )}
          </div>
        </div>

        {localAI.status === "loading" && (
          <div className="mt-4" aria-live="polite">
            <div className="mb-1 flex justify-between text-xs text-slate-600">
              <span>{localAI.statusText}</span>
              <span>{Math.round(localAI.progress * 100)}%</span>
            </div>
            <progress className="h-2 w-full accent-violet-700" max={1} value={localAI.progress} />
          </div>
        )}
        {localAI.status !== "loading" && (
          <p className="mt-3 text-xs text-slate-500" aria-live="polite">
            {localAI.statusText}
          </p>
        )}
        {localAI.error && <p className="mt-2 text-sm text-red-700">{localAI.error}</p>}
        {localAI.ready && (
          <button
            type="button"
            className="mt-3 text-xs font-medium text-red-600 hover:underline"
            onClick={() => void localAI.reset(true)}
          >
            Remove this model from browser cache
          </button>
        )}
      </div>

      {confirmDownload && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="local-ai-download-title"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h2 id="local-ai-download-title" className="text-xl font-semibold">
              Enable local AI
            </h2>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <p>
                The selected model ({selected?.label || "local model"}) must be downloaded before it
                can run. Model download size is different from the displayed device-memory estimate.
              </p>
              <p>
                Use Wi-Fi and a current desktop Chrome or Edge browser. Clearing site data, changing
                browsers, or a model update may require another download.
              </p>
              <p className="font-medium text-slate-800">
                Local prompts stay on this device and are not sent to the Results AI server.
              </p>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setConfirmDownload(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setConfirmDownload(false);
                  void localAI.enable().catch(() => undefined);
                }}
              >
                Start download
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
