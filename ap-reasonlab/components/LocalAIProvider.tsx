"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  ChatCompletionMessageParam,
  InitProgressReport,
  WebWorkerMLCEngine,
} from "@mlc-ai/web-llm";

export type AIMode = "auto" | "local" | "cloud";

export type LocalModelOption = {
  id: string;
  label: string;
  vramMB: number;
  cached: boolean;
};

type LocalAIStatus = "idle" | "loading" | "ready" | "generating" | "error";

type LocalAIContextValue = {
  mode: AIMode;
  setMode: (mode: AIMode) => void;
  models: LocalModelOption[];
  selectedModelId: string;
  setSelectedModelId: (id: string) => void;
  status: LocalAIStatus;
  progress: number;
  statusText: string;
  error: string;
  webGPUSupported: boolean | null;
  ready: boolean;
  enable: () => Promise<void>;
  reset: (removeCachedModel?: boolean) => Promise<void>;
  complete: (
    messages: ChatCompletionMessageParam[],
    onToken?: (token: string, fullText: string) => void
  ) => Promise<string>;
};

const LocalAIContext = createContext<LocalAIContextValue | null>(null);
const MODE_KEY = "results-ai-mode";
const MODEL_KEY = "results-local-ai-model";
const SMALLEST_LOCAL_MODELS: LocalModelOption[] = [
  {
    id: "SmolLM2-135M-Instruct-q0f16-MLC",
    label: "Tiny local AI · 135M",
    vramMB: 360,
    cached: false,
  },
  {
    id: "SmolLM2-360M-Instruct-q4f16_1-MLC",
    label: "Small local AI · 360M",
    vramMB: 376,
    cached: false,
  },
];

export function LocalAIProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<AIMode>("cloud");
  const [models, setModels] = useState<LocalModelOption[]>(SMALLEST_LOCAL_MODELS);
  const [selectedModelId, setSelectedModelIdState] = useState(SMALLEST_LOCAL_MODELS[0].id);
  const [status, setStatus] = useState<LocalAIStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Local AI is not enabled.");
  const [error, setError] = useState("");
  const [webGPUSupported, setWebGPUSupported] = useState<boolean | null>(null);
  const engineRef = useRef<WebWorkerMLCEngine | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const loadedModelRef = useRef("");

  useEffect(() => {
    setWebGPUSupported("gpu" in navigator);
    const savedMode = localStorage.getItem(MODE_KEY);
    if (savedMode === "auto" || savedMode === "local" || savedMode === "cloud") {
      setModeState(savedMode);
    }

    const savedModel = localStorage.getItem(MODEL_KEY);
    if (SMALLEST_LOCAL_MODELS.some((item) => item.id === savedModel)) {
      setSelectedModelIdState(String(savedModel));
    }
  }, []);

  const setMode = useCallback((nextMode: AIMode) => {
    setModeState(nextMode);
    localStorage.setItem(MODE_KEY, nextMode);
  }, []);

  const setSelectedModelId = useCallback((id: string) => {
    setSelectedModelIdState(id);
    localStorage.setItem(MODEL_KEY, id);
  }, []);

  const releaseEngine = useCallback(async () => {
    const engine = engineRef.current;
    engineRef.current = null;
    loadedModelRef.current = "";
    if (engine) await engine.unload().catch(() => undefined);
    workerRef.current?.terminate();
    workerRef.current = null;
  }, []);

  const enable = useCallback(async () => {
    if (!selectedModelId) throw new Error("Local model list is still loading.");
    if (!("gpu" in navigator)) {
      setStatus("error");
      setError("This browser does not support WebGPU. Use current desktop Chrome/Edge or cloud AI.");
      throw new Error("WebGPU is not supported.");
    }
    if (engineRef.current && loadedModelRef.current === selectedModelId) return;

    setStatus("loading");
    setProgress(0);
    setError("");
    setStatusText("Preparing local AI…");
    await releaseEngine();

    try {
      const { CreateWebWorkerMLCEngine } = await import("@mlc-ai/web-llm");
      const worker = new Worker(new URL("../workers/local-ai.worker.ts", import.meta.url), {
        type: "module",
      });
      workerRef.current = worker;
      const engine = await CreateWebWorkerMLCEngine(worker, selectedModelId, {
        initProgressCallback(report: InitProgressReport) {
          const nextProgress = Math.max(0, Math.min(1, report.progress ?? 0));
          setProgress(nextProgress);
          setStatusText(report.text || `Loading local AI: ${Math.round(nextProgress * 100)}%`);
        },
      });
      engineRef.current = engine;
      loadedModelRef.current = selectedModelId;
      setStatus("ready");
      setProgress(1);
      setStatusText("Local AI is ready on this device.");
      setModels((current) =>
        current.map((item) => (item.id === selectedModelId ? { ...item, cached: true } : item))
      );
    } catch (caught) {
      workerRef.current?.terminate();
      workerRef.current = null;
      const message = caught instanceof Error ? caught.message : "Local AI failed to load.";
      setStatus("error");
      setError(message);
      setStatusText("Local AI could not start.");
      throw caught;
    }
  }, [releaseEngine, selectedModelId]);

  const reset = useCallback(
    async (removeCachedModel = false) => {
      const modelId = loadedModelRef.current || selectedModelId;
      await releaseEngine();
      if (removeCachedModel && modelId) {
        const { deleteModelAllInfoInCache, prebuiltAppConfig } = await import("@mlc-ai/web-llm");
        await deleteModelAllInfoInCache(modelId, prebuiltAppConfig);
        setModels((current) =>
          current.map((item) => (item.id === modelId ? { ...item, cached: false } : item))
        );
      }
      setStatus("idle");
      setProgress(0);
      setError("");
      setStatusText(
        removeCachedModel ? "Local model cache removed." : "Local AI stopped. Cached files remain."
      );
    },
    [releaseEngine, selectedModelId]
  );

  const complete = useCallback(
    async (
      messages: ChatCompletionMessageParam[],
      onToken?: (token: string, fullText: string) => void
    ) => {
      const engine = engineRef.current;
      if (!engine) throw new Error("Enable local AI before sending a local request.");
      setStatus("generating");
      setError("");
      try {
        const stream = await engine.chat.completions.create({
          messages,
          stream: true,
          temperature: 0.5,
          max_tokens: 512,
        });
        let answer = "";
        for await (const chunk of stream) {
          const token = chunk.choices[0]?.delta?.content ?? "";
          answer += token;
          onToken?.(token, answer);
        }
        return answer.trim();
      } finally {
        setStatus("ready");
      }
    },
    []
  );

  const value = useMemo<LocalAIContextValue>(
    () => ({
      mode,
      setMode,
      models,
      selectedModelId,
      setSelectedModelId,
      status,
      progress,
      statusText,
      error,
      webGPUSupported,
      ready: status === "ready" || status === "generating",
      enable,
      reset,
      complete,
    }),
    [
      complete,
      enable,
      error,
      mode,
      models,
      progress,
      reset,
      selectedModelId,
      setMode,
      setSelectedModelId,
      status,
      statusText,
      webGPUSupported,
    ]
  );

  return <LocalAIContext.Provider value={value}>{children}</LocalAIContext.Provider>;
}

export function useLocalAI() {
  const value = useContext(LocalAIContext);
  if (!value) throw new Error("useLocalAI must be used inside LocalAIProvider");
  return value;
}
