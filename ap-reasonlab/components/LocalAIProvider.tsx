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
  MLCEngineInterface,
} from "@mlc-ai/web-llm";
import type { AiProvider, SiteModelChoice } from "@/lib/ai-site-models";
import { parseSiteModelChoice } from "@/lib/ai-site-models";
import {
  isInsideOpenThinkBlock,
  isReasoningLocalModel,
  REASONING_MODEL_DIRECT_ANSWER,
  stripReasoningTrace,
} from "@/lib/ai-reasoning-strip";

/**
 * Shared AI path for every tool:
 * - local  = runs in this browser
 * - site   = website API we provide
 * - byok   = user's own API key
 */
export type AIMode = "local" | "site" | "byok";
/** Weight tiers for the local model library (WebLLM / WebGPU). */
export type LocalModelGroup = "superlight" | "light" | "medium" | "heavy";

export type LocalModelOption = {
  id: string;
  label: string;
  group: LocalModelGroup;
  summary: string;
  bestFor: string;
  parameterSize: string;
  vramMB: number;
  cached: boolean | null;
  recommended?: boolean;
};

type LocalAIStatus = "idle" | "loading" | "ready" | "generating" | "error";

type LocalAIContextValue = {
  mode: AIMode;
  setMode: (mode: AIMode) => void;
  /** True when the active path is Local AI. */
  usesLocal: boolean;
  /** True when the active path is website API or your own API. */
  usesCloud: boolean;
  siteModel: SiteModelChoice;
  setSiteModel: (model: SiteModelChoice) => void;
  provider: AiProvider;
  setProvider: (provider: AiProvider) => void;
  userKey: string;
  setUserKey: (key: string) => void;
  /** When true, AI tools search Knowledge Explorer content before answering. */
  siteSearchEnabled: boolean;
  setSiteSearchEnabled: (enabled: boolean) => void;
  /** Payload fields for /api/ai/* cloud calls from the shared settings. */
  cloudRequestFields: {
    userApiKey?: string;
    provider: AiProvider;
    siteModel: SiteModelChoice;
    siteSearch?: boolean;
  };
  models: LocalModelOption[];
  selectedModelId: string;
  setSelectedModelId: (id: string) => void;
  loadedModelId: string;
  status: LocalAIStatus;
  progress: number;
  statusText: string;
  error: string;
  webGPUSupported: boolean | null;
  cacheScanning: boolean;
  ready: boolean;
  enable: (modelId?: string) => Promise<void>;
  stop: () => Promise<void>;
  refreshCacheStatus: () => Promise<void>;
  removeCachedModel: (modelId: string) => Promise<void>;
  complete: (
    messages: ChatCompletionMessageParam[],
    onToken?: (token: string, fullText: string) => void
  ) => Promise<string>;
};

const LocalAIContext = createContext<LocalAIContextValue | null>(null);
const MODE_KEY = "results-ai-mode";
const MODEL_KEY = "results-local-ai-model";
const SITE_MODEL_KEY = "results-ai-site-model";
const PROVIDER_KEY = "results-ai-provider";
const SITE_SEARCH_KEY = "results-ai-site-search";

function migrateMode(raw: string | null): AIMode | null {
  if (raw === "local" || raw === "site" || raw === "byok") return raw;
  // Older Local / Auto / Cloud UI
  if (raw === "auto" || raw === "cloud") return "site";
  return null;
}
/** Safe default for first enable — Super light Chinese/English starter. */
const DEFAULT_MODEL_ID = "Qwen2.5-0.5B-Instruct-q4f16_1-MLC";

/**
 * Local model library by weight class.
 * IDs must exist in @mlc-ai/web-llm prebuiltAppConfig.model_list.
 */
const LOCAL_MODELS: LocalModelOption[] = [
  // —— Super light ——
  {
    id: "SmolLM2-135M-Instruct-q0f16-MLC",
    label: "SmolLM2 Tiny",
    group: "superlight",
    summary: "Smallest option — very fast, basic answers only.",
    bestFor: "Smoke-test Local AI, short labels, tiny rewrites",
    parameterSize: "135M",
    vramMB: 360,
    cached: null,
  },
  {
    id: "SmolLM2-360M-Instruct-q4f16_1-MLC",
    label: "SmolLM2 Mini",
    group: "superlight",
    summary: "Slightly stronger than Tiny; still ultra-light English.",
    bestFor: "Short English summaries on weak devices",
    parameterSize: "360M",
    vramMB: 376,
    cached: null,
  },
  {
    id: "Qwen2.5-0.5B-Instruct-q4f16_1-MLC",
    label: "Qwen2.5 Micro",
    group: "superlight",
    summary: "Best starter for Chinese + English on low VRAM.",
    bestFor: "Everyday bilingual chat on phones/Chromebooks",
    parameterSize: "0.5B",
    vramMB: 945,
    cached: null,
    recommended: true,
  },
  {
    id: "Qwen3-0.6B-q4f16_1-MLC",
    label: "Qwen3 Micro",
    group: "superlight",
    summary: "Newer Qwen3 micro — better than older tiny models when it fits.",
    bestFor: "Newer bilingual micro reasoning on modest GPUs",
    parameterSize: "0.6B",
    vramMB: 1403,
    cached: null,
  },
  // —— Light ——
  {
    id: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
    label: "Llama 3.2 Light",
    group: "light",
    summary: "Compact Meta model — strong English for its size.",
    bestFor: "English explanations and light study Q&A",
    parameterSize: "1B",
    vramMB: 879,
    cached: null,
  },
  {
    id: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
    label: "Qwen2.5 Light",
    group: "light",
    summary: "Balanced bilingual light model.",
    bestFor: "Chinese/English study help without heavy GPU",
    parameterSize: "1.5B",
    vramMB: 1630,
    cached: null,
    recommended: true,
  },
  {
    id: "Qwen2.5-Math-1.5B-Instruct-q4f16_1-MLC",
    label: "Qwen2.5 Math Light",
    group: "light",
    summary: "Math-tuned light model for step language.",
    bestFor: "AP math hints, formula-oriented explanations",
    parameterSize: "1.5B",
    vramMB: 1630,
    cached: null,
  },
  {
    id: "Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC",
    label: "Qwen2.5 Coder Light",
    group: "light",
    summary: "Code-focused light assistant.",
    bestFor: "Small snippets, comments, Markdown edits",
    parameterSize: "1.5B",
    vramMB: 1630,
    cached: null,
  },
  // —— Medium ——
  {
    id: "Llama-3.2-3B-Instruct-q4f16_1-MLC",
    label: "Llama 3.2 Medium",
    group: "medium",
    summary: "Best English quality/speed balance for most desktops.",
    bestFor: "General study tutoring in English",
    parameterSize: "3B",
    vramMB: 2264,
    cached: null,
    recommended: true,
  },
  {
    id: "Qwen2.5-3B-Instruct-q4f16_1-MLC",
    label: "Qwen2.5 Medium",
    group: "medium",
    summary: "Strong bilingual mid-size Qwen.",
    bestFor: "Longer Chinese/English explanations and drafting",
    parameterSize: "3B",
    vramMB: 2505,
    cached: null,
  },
  {
    id: "Qwen3-4B-q4f16_1-MLC",
    label: "Qwen3 Medium+",
    group: "medium",
    summary: "Newer Qwen3 4B — top pick in the medium class when VRAM allows.",
    bestFor: "Harder bilingual reasoning and richer answers",
    parameterSize: "4B",
    vramMB: 3432,
    cached: null,
  },
  {
    id: "Phi-3.5-mini-instruct-q4f16_1-MLC",
    label: "Phi-3.5 Mini",
    group: "medium",
    summary: "Microsoft mini model — solid reasoning for its class.",
    bestFor: "Structured reasoning and careful short answers",
    parameterSize: "3.8B",
    vramMB: 3672,
    cached: null,
  },
  {
    id: "Qwen2.5-Coder-3B-Instruct-q4f16_1-MLC",
    label: "Qwen2.5 Coder Medium",
    group: "medium",
    summary: "Stronger local coding without jumping to 7B.",
    bestFor: "Code explanations and AI Developer drafts",
    parameterSize: "3B",
    vramMB: 2505,
    cached: null,
  },
  // —— Heavy ——
  {
    id: "Qwen2.5-7B-Instruct-q4f16_1-MLC",
    label: "Qwen2.5 Heavy",
    group: "heavy",
    summary: "Flagship bilingual local general model (~5 GB VRAM).",
    bestFor: "High-quality study answers when your GPU can load it",
    parameterSize: "7B",
    vramMB: 5107,
    cached: null,
    recommended: true,
  },
  {
    id: "Llama-3.1-8B-Instruct-q4f16_1-MLC",
    label: "Llama 3.1 Heavy",
    group: "heavy",
    summary: "Strong English 8B instruct model.",
    bestFor: "Deep English tutoring and long-form writing",
    parameterSize: "8B",
    vramMB: 5001,
    cached: null,
  },
  {
    id: "Qwen2.5-Coder-7B-Instruct-q4f16_1-MLC",
    label: "Qwen2.5 Coder Heavy",
    group: "heavy",
    summary: "Strongest coder in this library.",
    bestFor: "Complex code help and AI Developer work",
    parameterSize: "7B",
    vramMB: 5107,
    cached: null,
  },
  {
    id: "DeepSeek-R1-Distill-Qwen-7B-q4f16_1-MLC",
    label: "DeepSeek-R1 Distill Heavy",
    group: "heavy",
    summary:
      "Reasoning distill — thinks privately first; the site hides <think> and shows only the final answer.",
    bestFor: "Hard multi-step problems when you can wait through a short reasoning phase",
    parameterSize: "7B",
    vramMB: 5107,
    cached: null,
  },
];

async function detectWebGPU(): Promise<boolean> {
  if (typeof navigator === "undefined") return false;
  const gpu = (navigator as Navigator & { gpu?: { requestAdapter: () => Promise<unknown> } }).gpu;
  if (!gpu?.requestAdapter) return false;
  try {
    const adapter = await gpu.requestAdapter();
    return Boolean(adapter);
  } catch {
    return false;
  }
}

export function LocalAIProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<AIMode>("site");
  const [siteModel, setSiteModelState] = useState<SiteModelChoice>("auto");
  const [provider, setProviderState] = useState<AiProvider>("groq");
  const [userKey, setUserKey] = useState("");
  const [siteSearchEnabled, setSiteSearchEnabledState] = useState(true);
  const [models, setModels] = useState<LocalModelOption[]>(LOCAL_MODELS);
  const [selectedModelId, setSelectedModelIdState] = useState(DEFAULT_MODEL_ID);
  const [loadedModelId, setLoadedModelId] = useState("");
  const [status, setStatus] = useState<LocalAIStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState(
    "Local AI is off. Choose a model, then click Enable local AI."
  );
  const [error, setError] = useState("");
  const [webGPUSupported, setWebGPUSupported] = useState<boolean | null>(null);
  const [cacheScanning, setCacheScanning] = useState(false);
  const engineRef = useRef<MLCEngineInterface | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const loadedModelRef = useRef("");
  const enableLockRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    void detectWebGPU().then(setWebGPUSupported);
    const savedMode = migrateMode(localStorage.getItem(MODE_KEY));
    if (savedMode) {
      setModeState(savedMode);
      localStorage.setItem(MODE_KEY, savedMode);
    }
    const savedModel = localStorage.getItem(MODEL_KEY);
    if (LOCAL_MODELS.some((item) => item.id === savedModel)) {
      setSelectedModelIdState(String(savedModel));
    }
    const savedSiteModel = parseSiteModelChoice(localStorage.getItem(SITE_MODEL_KEY));
    if (savedSiteModel) setSiteModelState(savedSiteModel);
    const savedProvider = localStorage.getItem(PROVIDER_KEY);
    if (
      savedProvider === "groq" ||
      savedProvider === "gemini" ||
      savedProvider === "githubmodels" ||
      savedProvider === "kimi" ||
      savedProvider === "openrouter" ||
      savedProvider === "deepseek"
    ) {
      setProviderState(savedProvider);
    }
    const savedSiteSearch = localStorage.getItem(SITE_SEARCH_KEY);
    if (savedSiteSearch === "0") setSiteSearchEnabledState(false);
    if (savedSiteSearch === "1") setSiteSearchEnabledState(true);
  }, []);

  const setMode = useCallback((nextMode: AIMode) => {
    setModeState(nextMode);
    localStorage.setItem(MODE_KEY, nextMode);
  }, []);

  const setSiteModel = useCallback((next: SiteModelChoice) => {
    setSiteModelState(next);
    localStorage.setItem(SITE_MODEL_KEY, next);
  }, []);

  const setProvider = useCallback((next: AiProvider) => {
    setProviderState(next);
    localStorage.setItem(PROVIDER_KEY, next);
  }, []);

  const setSiteSearchEnabled = useCallback((enabled: boolean) => {
    setSiteSearchEnabledState(enabled);
    localStorage.setItem(SITE_SEARCH_KEY, enabled ? "1" : "0");
  }, []);

  const setSelectedModelId = useCallback((id: string) => {
    if (!LOCAL_MODELS.some((item) => item.id === id)) return;
    setSelectedModelIdState(id);
    localStorage.setItem(MODEL_KEY, id);
  }, []);

  const releaseEngine = useCallback(async () => {
    const engine = engineRef.current;
    engineRef.current = null;
    loadedModelRef.current = "";
    setLoadedModelId("");
    if (engine) await engine.unload().catch(() => undefined);
    workerRef.current?.terminate();
    workerRef.current = null;
  }, []);

  const enable = useCallback(
    async (requestedModelId?: string) => {
      if (enableLockRef.current) {
        await enableLockRef.current.catch(() => undefined);
      }

      const run = (async () => {
        const targetModelId = requestedModelId || selectedModelId;
        if (!LOCAL_MODELS.some((item) => item.id === targetModelId)) {
          throw new Error("Select a valid local model first.");
        }

        const gpuOk = await detectWebGPU();
        setWebGPUSupported(gpuOk);
        if (!gpuOk) {
          setStatus("error");
          setError(
            "WebGPU is unavailable (need a desktop Chrome/Edge with GPU acceleration, or a compatible GPU). Switch to Website API or Your own API meanwhile."
          );
          setStatusText("Local AI could not start — WebGPU missing.");
          throw new Error("WebGPU is not supported.");
        }

        if (engineRef.current && loadedModelRef.current === targetModelId) {
          setStatus("ready");
          setStatusText("Local AI is already ready on this device.");
          return;
        }

        setSelectedModelIdState(targetModelId);
        localStorage.setItem(MODEL_KEY, targetModelId);
        setStatus("loading");
        setProgress(0);
        setError("");
        setStatusText("Preparing local AI…");
        await releaseEngine();

        const onProgress = (report: InitProgressReport) => {
          const nextProgress = Math.max(0, Math.min(1, report.progress ?? 0));
          setProgress(nextProgress);
          setStatusText(report.text || `Loading local AI: ${Math.round(nextProgress * 100)}%`);
        };

        try {
          const webllm = await import("@mlc-ai/web-llm");
          let engine: MLCEngineInterface | null = null;

          try {
            setStatusText("Starting local AI worker…");
            const worker = new Worker(new URL("../workers/local-ai.worker.ts", import.meta.url), {
              type: "module",
            });
            workerRef.current = worker;
            engine = await webllm.CreateWebWorkerMLCEngine(worker, targetModelId, {
              initProgressCallback: onProgress,
            });
          } catch (workerError) {
            workerRef.current?.terminate();
            workerRef.current = null;
            const workerMessage =
              workerError instanceof Error ? workerError.message : String(workerError);
            setStatusText(`Worker failed (${workerMessage}). Trying main-thread engine…`);
            engine = await webllm.CreateMLCEngine(targetModelId, {
              initProgressCallback: onProgress,
            });
          }

          engineRef.current = engine;
          loadedModelRef.current = targetModelId;
          setLoadedModelId(targetModelId);
          setStatus("ready");
          setProgress(1);
          setError("");
          setStatusText("Local AI is ready on this device.");
          setModels((current) =>
            current.map((item) => (item.id === targetModelId ? { ...item, cached: true } : item))
          );
        } catch (caught) {
          workerRef.current?.terminate();
          workerRef.current = null;
          engineRef.current = null;
          loadedModelRef.current = "";
          setLoadedModelId("");
          const message = caught instanceof Error ? caught.message : "Local AI failed to load.";
          setStatus("error");
          setError(message);
          setStatusText("Local AI could not start. See the error below, or use Cloud AI.");
          throw caught;
        }
      })();

      enableLockRef.current = run.finally(() => {
        enableLockRef.current = null;
      });
      await enableLockRef.current;
    },
    [releaseEngine, selectedModelId]
  );

  const stop = useCallback(async () => {
    await releaseEngine();
    setStatus("idle");
    setProgress(0);
    setError("");
    setStatusText("Local AI stopped. Downloaded model files remain cached until you remove them.");
  }, [releaseEngine]);

  const refreshCacheStatus = useCallback(async () => {
    setCacheScanning(true);
    setError("");
    try {
      const { hasModelInCache, prebuiltAppConfig } = await import("@mlc-ai/web-llm");
      const cacheResults = await Promise.all(
        LOCAL_MODELS.map(async (model) => ({
          id: model.id,
          cached: await hasModelInCache(model.id, prebuiltAppConfig).catch(() => false),
        }))
      );
      const cacheMap = new Map(cacheResults.map((item) => [item.id, item.cached]));
      setModels((current) =>
        current.map((item) => ({ ...item, cached: cacheMap.get(item.id) ?? false }))
      );
      setStatusText("Browser model cache checked.");
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Could not check model cache.";
      setError(message);
    } finally {
      setCacheScanning(false);
    }
  }, []);

  const removeCachedModel = useCallback(
    async (modelId: string) => {
      if (!LOCAL_MODELS.some((item) => item.id === modelId)) return;
      if (loadedModelRef.current === modelId) {
        await releaseEngine();
        setStatus("idle");
        setProgress(0);
      }
      const { deleteModelAllInfoInCache, prebuiltAppConfig } = await import("@mlc-ai/web-llm");
      await deleteModelAllInfoInCache(modelId, prebuiltAppConfig);
      setModels((current) =>
        current.map((item) => (item.id === modelId ? { ...item, cached: false } : item))
      );
      setError("");
      setStatusText("Selected model removed from browser cache.");
    },
    [releaseEngine]
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
        const modelId = loadedModelRef.current || selectedModelId;
        const reasoningModel = isReasoningLocalModel(modelId);
        const requestMessages: ChatCompletionMessageParam[] = reasoningModel
          ? [{ role: "system", content: REASONING_MODEL_DIRECT_ANSWER }, ...messages]
          : messages;

        if (reasoningModel) {
          setStatusText("DeepSeek is reasoning privately… the final answer will appear next.");
        }

        const stream = await engine.chat.completions.create({
          messages: requestMessages,
          stream: true,
          temperature: reasoningModel ? 0.4 : 0.5,
          // R1 spends many tokens inside <think>; keep enough budget for the answer after.
          ...(reasoningModel ? { max_tokens: 2800 } : {}),
        });
        let raw = "";
        let visible = "";
        let announcedAnswer = false;
        for await (const chunk of stream) {
          const token = chunk.choices[0]?.delta?.content ?? "";
          raw += token;
          visible = stripReasoningTrace(raw);
          if (reasoningModel && isInsideOpenThinkBlock(raw)) {
            setStatusText("DeepSeek is reasoning privately… the final answer will appear next.");
          } else if (reasoningModel && visible && !announcedAnswer) {
            announcedAnswer = true;
            setStatusText("Final answer ready — reasoning hidden.");
          }
          // Push only the stripped answer so the UI never fills with <think> dumps.
          onToken?.(token, visible);
        }
        const cleaned = stripReasoningTrace(raw);
        if (reasoningModel && !cleaned) {
          throw new Error(
            "DeepSeek-R1 only produced hidden thinking and no final answer. Try again, shorten the prompt, or use Qwen / Llama."
          );
        }
        return cleaned;
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : "Local generation failed.";
        setStatus("error");
        setError(message);
        throw caught;
      } finally {
        if (engineRef.current) setStatus("ready");
      }
    },
    [selectedModelId]
  );

  const value = useMemo<LocalAIContextValue>(
    () => ({
      mode,
      setMode,
      usesLocal: mode === "local",
      usesCloud: mode === "site" || mode === "byok",
      siteModel,
      setSiteModel,
      provider,
      setProvider,
      userKey,
      setUserKey,
      siteSearchEnabled,
      setSiteSearchEnabled,
      cloudRequestFields: {
        userApiKey: mode === "byok" ? userKey.trim() || undefined : undefined,
        provider,
        siteModel: mode === "site" ? siteModel : "auto",
        siteSearch: siteSearchEnabled,
      },
      models,
      selectedModelId,
      setSelectedModelId,
      loadedModelId,
      status,
      progress,
      statusText,
      error,
      webGPUSupported,
      cacheScanning,
      ready: status === "ready" || status === "generating",
      enable,
      stop,
      refreshCacheStatus,
      removeCachedModel,
      complete,
    }),
    [
      cacheScanning,
      complete,
      enable,
      error,
      loadedModelId,
      mode,
      models,
      progress,
      provider,
      refreshCacheStatus,
      removeCachedModel,
      selectedModelId,
      setMode,
      setProvider,
      setSelectedModelId,
      setSiteModel,
      setSiteSearchEnabled,
      siteModel,
      siteSearchEnabled,
      status,
      statusText,
      stop,
      userKey,
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
