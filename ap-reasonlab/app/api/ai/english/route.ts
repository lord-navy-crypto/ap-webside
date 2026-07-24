import { NextRequest, NextResponse } from "next/server";
import { asStringList, parseAiProvider, parseSiteModelChoice, runChatJson } from "@/lib/ai-client";
import { ENGLISH_TUTOR_SYSTEM } from "@/lib/ai-prompts";
import { appendAiSiteContext, buildServerAiSiteContext } from "@/lib/ai-site-context-server";

function isClearlyOutsideEnglishScope(input: string, mode: string): boolean {
  if (mode === "writing-feedback" || mode === "grammar-explanation") return false;
  const asksEnglish = /english|grammar|sentence|writing|vocab|word|reading|speaking|listening|toefl|ielts|sat|rewrite|revise|proofread|translate/i.test(input);
  const asksAnotherSubject = /\b(AP\s+)?(physics|chemistry|biology|calculus|statistics|macroeconomics|microeconomics|computer science)\b|calculate|solve the equation|find the force/i.test(input);
  return asksAnotherSubject && !asksEnglish;
}

function scopeRefusal() {
  return {
    refused: true,
    feedback: "This tutor is limited to English learning, writing, grammar, vocabulary, TOEFL, IELTS, and SAT Reading & Writing. Please use AI Toolbox for AP subject questions.",
    strengths: [], priorities: [], revisionExample: "", practicePrompt: "",
    aiMayBeWrong: "If your goal was to improve the English wording of subject text, choose Writing feedback and paste the passage again.",
    note: "English-only scope check.",
  };
}

function mockEnglishTutor(input: string, mode: string) {
  return {
    refused: false,
    feedback: `The English tutor is in offline demo mode. Your ${mode} request was received. Focus first on a clear main idea, then check whether each sentence supports it.`,
    strengths: ["You provided text or a clear learning request for review."],
    priorities: ["Check sentence boundaries.", "Replace vague wording with one specific example.", "Review transitions between ideas."],
    revisionExample: input.split(/[.!?]/)[0]?.trim() ? `Try revising one sentence for precision: “${input.split(/[.!?]/)[0].trim().slice(0, 90)}…”` : "Write one claim followed by a specific reason.",
    practicePrompt: "Rewrite one sentence using a clear claim → reason structure.",
    aiMayBeWrong: "Demo feedback is generic; verify language advice with a teacher or trusted reference.",
    note: "Mock mode (no configured website AI key).",
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = String(body.input || "").trim();
    const mode = String(body.mode || "writing-feedback").trim();
    const target = String(body.target || "General academic English").trim();
    const userApiKey = String(body.userApiKey || "").trim();
    const provider = parseAiProvider(body.provider);
    const siteModel = parseSiteModelChoice(body.siteModel);

    if (!input) return NextResponse.json({ error: "Enter English text or a learning question." }, { status: 400 });
    if (input.length > 10_000) return NextResponse.json({ error: "Input is too long (maximum 10,000 characters)." }, { status: 400 });
    if (mode.length > 60 || target.length > 100) return NextResponse.json({ error: "Invalid mode or target." }, { status: 400 });
    if (isClearlyOutsideEnglishScope(input, mode)) return NextResponse.json(scopeRefusal());

    const user = `Mode: ${mode}\nTarget: ${target}\n\nStudent input:\n${input}\n\nReturn the required English Tutor JSON.`;
    try {
      const siteSearch = body.siteSearch !== false;
      const siteContext = await buildServerAiSiteContext(`${mode}\n${target}\n${input}`, siteSearch);
      const userWithSite = appendAiSiteContext(user, siteContext);
      const result = await runChatJson({
        system: ENGLISH_TUTOR_SYSTEM,
        user: userWithSite,
        maxTokens: 900,
        userApiKey: userApiKey || undefined,
        provider,
        siteModel,
      });
      const data = result.data;
      return NextResponse.json({
        refused: Boolean(data.refused),
        feedback: String(data.feedback || data.raw || "").trim(),
        strengths: asStringList(data.strengths).slice(0, 3),
        priorities: asStringList(data.priorities).slice(0, 4),
        revisionExample: String(data.revisionExample || "").trim(),
        practicePrompt: String(data.practicePrompt || "").trim(),
        aiMayBeWrong: String(data.aiMayBeWrong || "AI language feedback may be wrong. Verify important advice.").trim(),
        note: result.note,
        model: result.model,
        provider: result.provider,
      });
    } catch (error) {
      if (userApiKey) return NextResponse.json({ error: error instanceof Error ? error.message : "AI call failed" }, { status: 502 });
      console.error(error);
      return NextResponse.json(mockEnglishTutor(input, mode));
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
