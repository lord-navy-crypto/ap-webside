/**
 * Strip chain-of-thought / reasoning dumps that some local models (e.g. DeepSeek-R1
 * distill) emit before the real answer. Without this, the UI fills with thinking
 * and can appear frozen.
 */
export function stripReasoningTrace(text: string): string {
  if (!text) return "";

  let out = text
    .replace(/<think\b[^>]*>[\s\S]*?<\/think>/gi, "")
    .replace(/<thinking\b[^>]*>[\s\S]*?<\/thinking>/gi, "")
    .replace(/<reason(?:ing)?\b[^>]*>[\s\S]*?<\/reason(?:ing)?>/gi, "")
    .replace(/◁think▷[\s\S]*?◁\/think▷/gi, "")
    .replace(/\[thinking\][\s\S]*?\[\/thinking\]/gi, "");

  // Unclosed thinking block — hide everything from the open tag onward for display.
  const unclosed = out.match(/<\/?think(?:ing)?\b[^>]*>/i);
  if (unclosed && unclosed.index != null) {
    const openIdx = out.search(/<think(?:ing)?\b/i);
    if (openIdx >= 0 && !/<\/think(?:ing)?>/i.test(out.slice(openIdx))) {
      out = out.slice(0, openIdx);
    }
  }

  // Common R1 preface lines when tags are missing.
  out = out.replace(/^(?:okay|ok|alright|let me think|thinking step by step)[,.]?\s*/i, "");

  return out.replace(/\n{3,}/g, "\n\n").trim();
}

export function isReasoningLocalModel(modelId: string): boolean {
  return /deepseek-r1|r1-distill|reasoning/i.test(modelId);
}

/** Extra system line so reasoning distill models answer instead of dumping CoT. */
export const REASONING_MODEL_DIRECT_ANSWER =
  "Answer directly in the requested format. Do not output <think> blocks, hidden reasoning, or step-by-step inner monologue. Give only the final useful reply.";
