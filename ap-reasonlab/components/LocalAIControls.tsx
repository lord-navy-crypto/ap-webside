"use client";

import { useState } from "react";
import {
  useLocalAI,
  type AIMode,
  type LocalModelGroup,
} from "@/components/LocalAIProvider";

const MODES: Array<{
  value: AIMode;
  label: string;
  detail: string;
  badge?: string;
  badgeTone?: "recommend" | "backup";
}> = [
  {
    value: "local",
    label: "Local AI",
    detail:
      "Runs on your computer — free for the site, private, no shared cloud quota. Enable a model below.",
    badge: "Author recommends",
    badgeTone: "recommend",
  },
  {
    value: "auto",
    label: "Auto",
    detail: "Uses Local when enabled; otherwise falls back to cloud. Prefer enabling Local first.",
    badge: "Backup path",
    badgeTone: "backup",
  },
  {
    value: "cloud",
    label: "Cloud AI",
    detail: "Website Instant (lowest) or your own mid-tier API. Use when Local is not available.",
    badge: "Backup · limited",
    badgeTone: "backup",
  },
];

const MODEL_GROUPS: Array<{ value: LocalModelGroup; label: string }> = [
  { value: "ultralight", label: "Ultra-light models" },
  { value: "general", label: "General & Chinese models" },
  { value: "study", label: "Study & mathematics" },
  { value: "developer", label: "Developer models" },
];

export default function LocalAIControls() {
  const localAI = useLocalAI();
  const [pendingModelId, setPendingModelId] = useState("");
  const [confirmLoad, setConfirmLoad] = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState("");
  const [showDownloads, setShowDownloads] = useState(false);
  const [loadError, setLoadError] = useState("");
  const selected = localAI.models.find((model) => model.id === localAI.selectedModelId);
  const loaded = localAI.models.find((model) => model.id === localAI.loadedModelId);
  const target = localAI.models.find(
    (model) => model.id === (pendingModelId || localAI.selectedModelId)
  );
  const removeTarget = localAI.models.find((model) => model.id === confirmRemoveId);
  const cachedModels = localAI.models.filter((model) => model.cached);
  const cacheChecked = localAI.models.every((model) => model.cached !== null);
  const busy = localAI.status === "loading" || localAI.status === "generating";
  const modeNeedsModel =
    (localAI.mode === "local" || localAI.mode === "auto") && !localAI.ready;

  function requestModel(modelId: string) {
    if (localAI.ready && modelId !== localAI.loadedModelId) {
      setPendingModelId(modelId);
      setConfirmLoad(true);
      setLoadError("");
      return;
    }
    localAI.setSelectedModelId(modelId);
  }

  function openLoadConfirmation(modelId?: string) {
    setPendingModelId(modelId || localAI.selectedModelId);
    setConfirmLoad(true);
    setLoadError("");
  }

  function selectMode(next: AIMode) {
    localAI.setMode(next);
    // Choosing Local / Auto does NOT load a model by itself — prompt Enable.
    if ((next === "local" || next === "auto") && !localAI.ready && !busy) {
      openLoadConfirmation(localAI.selectedModelId);
    }
  }

  async function confirmModelLoad() {
    const modelId = pendingModelId || localAI.selectedModelId;
    setConfirmLoad(false);
    setPendingModelId("");
    setLoadError("");
    try {
      // Prefer local once the user explicitly enables a model.
      if (localAI.mode === "cloud") localAI.setMode("auto");
      await localAI.enable(modelId);
    } catch (caught) {
      setLoadError(caught instanceof Error ? caught.message : "Could not enable local AI.");
    }
  }

  async function openDownloads() {
    if (showDownloads) {
      setShowDownloads(false);
      return;
    }
    setShowDownloads(true);
    if (!cacheChecked) await localAI.refreshCacheStatus();
  }

  return (
    <section className="space-y-4 rounded-2xl border border-violet-200 bg-violet-50/60 p-4">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">AI mode</p>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
            Local first
          </span>
        </div>
        <div className="mt-2 grid gap-2 md:grid-cols-3">
          {MODES.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => selectMode(item.value)}
              className={
                localAI.mode === item.value
                  ? item.value === "local"
                    ? "rounded-xl bg-emerald-700 px-4 py-3 text-left text-white shadow"
                    : "rounded-xl bg-violet-700 px-4 py-3 text-left text-white shadow"
                  : item.value === "local"
                    ? "rounded-xl border-2 border-emerald-400 bg-white px-4 py-3 text-left text-slate-800 shadow-sm hover:border-emerald-500"
                    : "rounded-xl border border-violet-200 bg-white px-4 py-3 text-left text-slate-800 hover:border-violet-400"
              }
            >
              <span className="flex flex-wrap items-center gap-2">
                <span className="block text-sm font-semibold">{item.label}</span>
                {item.badge && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      localAI.mode === item.value
                        ? "bg-white/20 text-white"
                        : item.badgeTone === "recommend"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </span>
              <span
                className={`mt-1 block text-xs ${
                  localAI.mode === item.value
                    ? item.value === "local"
                      ? "text-emerald-50"
                      : "text-violet-100"
                    : "text-slate-500"
                }`}
              >
                {item.detail}
              </span>
            </button>
          ))}
        </div>
      </div>

      {modeNeedsModel && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <strong>Local mode is selected, but no model is loaded yet.</strong>
          <p className="mt-1">
            Clicking Local AI only sets preference. Press <strong>Enable local AI</strong> to
            download/load a model in this browser.
          </p>
        </div>
      )}

      <div className="rounded-xl border border-violet-200 bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-slate-900">Local model library</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              <strong>Author recommends Local AI</strong> for everyday study: no website token bill,
              prompts stay on your device, and we do not apply cloud-style output caps. Pick a model
              below (tiny / Chinese / math / coder), then Enable.
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              localAI.ready
                ? "bg-emerald-100 text-emerald-800"
                : localAI.webGPUSupported === false
                  ? "bg-red-100 text-red-700"
                  : localAI.status === "loading"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-slate-100 text-slate-600"
            }`}
          >
            {localAI.ready
              ? `Enabled · ${loaded?.parameterSize || "model"}`
              : localAI.status === "loading"
                ? "Enabling…"
                : localAI.webGPUSupported === false
                  ? "WebGPU unavailable"
                  : "Not enabled"}
          </span>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
          <div>
            <label className="mb-1 block text-sm font-medium">Choose local model</label>
            <select
              className="input"
              value={localAI.selectedModelId}
              onChange={(event) => requestModel(event.target.value)}
              disabled={busy}
            >
              {MODEL_GROUPS.map((group) => (
                <optgroup key={group.value} label={group.label}>
                  {localAI.models
                    .filter((model) => model.group === group.value)
                    .map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.label} · {model.parameterSize} · about {model.vramMB} MB memory
                        {model.recommended ? " · recommended" : ""}
                        {model.cached ? " · downloaded" : ""}
                        {model.id === localAI.loadedModelId ? " · active" : ""}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            {!localAI.ready ? (
              <button
                type="button"
                className="btn-primary"
                disabled={busy || !localAI.selectedModelId || localAI.webGPUSupported === false}
                onClick={() => openLoadConfirmation()}
              >
                {localAI.status === "loading"
                  ? "Enabling…"
                  : selected?.cached
                    ? "Enable local AI"
                    : "Enable / download"}
              </button>
            ) : (
              <button type="button" className="btn-secondary" onClick={() => void localAI.stop()}>
                Stop local AI
              </button>
            )}
            <button
              type="button"
              className="btn-secondary"
              disabled={busy || localAI.cacheScanning}
              onClick={() => void openDownloads()}
            >
              {localAI.cacheScanning
                ? "Checking…"
                : showDownloads
                  ? "Hide downloads"
                  : "Manage downloads"}
            </button>
          </div>
        </div>

        {selected && !localAI.ready && (
          <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <strong className="text-slate-900">{selected.label}</strong>
              {selected.recommended && (
                <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-800">
                  Recommended
                </span>
              )}
              {selected.cached && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                  Downloaded
                </span>
              )}
            </div>
            <p className="mt-1 text-slate-600">{selected.summary}</p>
            <p className="mt-1 text-xs text-slate-500">
              Best for: {selected.bestFor}. Estimated device memory: {selected.vramMB} MB.
            </p>
          </div>
        )}

        {localAI.ready && loaded && (
          <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-950">
            <strong>Active: {loaded.label}</strong>
            <p className="mt-1">{loaded.bestFor}.</p>
            <p className="mt-1 text-xs text-emerald-800">
              Pick another model above to switch. You will confirm before the current model unloads.
            </p>
          </div>
        )}

        <p className="mt-3 text-xs text-slate-500">
          Recommended starters: <strong>Qwen Chinese starter (0.5B)</strong> for bilingual study, or{" "}
          <strong>Tiny local AI</strong> just to test Enable. Desktop Chrome/Edge with GPU works
          best. First enable may download hundreds of MB; later loads reuse this browser cache. Only
          your device limits speed and length — not the website quota.
        </p>

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
        {(localAI.error || loadError) && (
          <p className="mt-2 whitespace-pre-wrap text-sm text-red-700" role="alert">
            {loadError || localAI.error}
          </p>
        )}

        {showDownloads && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Downloaded model files</h3>
                <p className="text-xs text-slate-500">
                  Cache belongs to this browser profile on this device.
                </p>
              </div>
              <button
                type="button"
                className="text-xs font-medium text-violet-700 hover:underline"
                disabled={localAI.cacheScanning}
                onClick={() => void localAI.refreshCacheStatus()}
              >
                Check again
              </button>
            </div>
            {cacheChecked && cachedModels.length === 0 && (
              <p className="mt-3 text-sm text-slate-500">No downloaded models were found.</p>
            )}
            <div className="mt-3 space-y-2">
              {cachedModels.map((model) => (
                <div
                  key={model.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">{model.label}</p>
                    <p className="text-xs text-slate-500">
                      {model.parameterSize} · about {model.vramMB} MB device memory
                      {model.id === localAI.loadedModelId ? " · active" : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-xs font-medium text-red-600 hover:underline"
                    disabled={busy}
                    onClick={() => setConfirmRemoveId(model.id)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {confirmLoad && target && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="local-ai-load-title"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h2 id="local-ai-load-title" className="text-xl font-semibold">
              {localAI.ready ? "Switch local model" : "Enable local AI"}
            </h2>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              {localAI.ready && loaded && (
                <p>
                  The active model <strong>{loaded.label}</strong> will stop before{" "}
                  <strong>{target.label}</strong> loads.
                </p>
              )}
              <p>
                Model: <strong>{target.label}</strong> ({target.parameterSize}). Estimated device
                memory: <strong>{target.vramMB} MB</strong>.
              </p>
              <p>
                {target.cached
                  ? "This model looks cached and should load from this browser."
                  : "First enable downloads model files (needs internet). Later visits reuse the cache."}
              </p>
              <p className="font-medium text-slate-800">
                Prompts stay on this device while local AI is active.
              </p>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setConfirmLoad(false);
                  setPendingModelId("");
                }}
              >
                Cancel
              </button>
              <button type="button" className="btn-primary" onClick={() => void confirmModelLoad()}>
                {target.cached ? "Enable now" : "Download & enable"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmRemoveId && removeTarget && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="local-ai-remove-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 id="local-ai-remove-title" className="text-xl font-semibold">
              Remove downloaded model?
            </h2>
            <p className="mt-3 text-sm text-slate-600">
              Remove <strong>{removeTarget.label}</strong> from this browser cache? You can download
              it again later.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setConfirmRemoveId("")}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                onClick={() => {
                  const modelId = confirmRemoveId;
                  setConfirmRemoveId("");
                  void localAI.removeCachedModel(modelId).catch(() => undefined);
                }}
              >
                Remove model
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
