import { NextRequest, NextResponse } from "next/server";
import { parseAiProvider, parseSiteModelChoice, runChatJson } from "@/lib/ai-client";
import { CONCEPT_EXPLAIN_SYSTEM } from "@/lib/ai-prompts";
import { appendAiSiteContext, buildServerAiSiteContext } from "@/lib/ai-site-context-server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const subject = String(body.subject || "").trim();
    const conceptTitle = String(body.conceptTitle || body.concept || "").trim();
    const conceptSummary = String(body.conceptSummary || "").trim();
    const mode = String(body.mode || "explain") as "explain" | "quiz" | "ask";
    const question = String(body.question || "").trim();
    const userApiKey = String(body.userApiKey || "").trim();
    const provider = parseAiProvider(body.provider);
    const siteModel = parseSiteModelChoice(body.siteModel);
    const lockToConcept = Boolean(body.lockToConcept);

    if (!conceptTitle && !question) {
      return NextResponse.json(
        { error: "Provide a concept name or a question about a concept." },
        { status: 400 }
      );
    }
    if (subject.length > 120 || conceptTitle.length > 160 || conceptSummary.length > 4_000 || question.length > 3_000) {
      return NextResponse.json({ error: "Concept request is too long" }, { status: 400 });
    }

    const user = `Subject: ${subject || "AP"}
Concept title: ${conceptTitle || "(user will name it in the question)"}
Concept summary (may be empty): ${conceptSummary || "(none)"}
Mode: ${mode}
Lock to this concept only: ${lockToConcept ? "yes" : "no — still must stay on learning/AP concepts"}
User message:
${question || (mode === "quiz" ? "Quiz me on this concept." : "Explain this concept clearly for AP study.")}

Return JSON with refused, reply, quizPrompt, aiMayBeWrong.`;

    try {
      const siteSearch = body.siteSearch !== false;
      const siteContext = await buildServerAiSiteContext(
        `${subject}\n${conceptTitle}\n${conceptSummary}\n${question}`,
        siteSearch
      );
      const userWithSite = appendAiSiteContext(user, siteContext);

      const result = await runChatJson({
        system: CONCEPT_EXPLAIN_SYSTEM,
        user: userWithSite,
        maxTokens: 650,
        userApiKey: userApiKey || undefined,
        provider,
        siteModel,
      });
      const data = result.data;
      const refused = Boolean(data.refused);
      return NextResponse.json({
        refused,
        reply:
          String(data.reply || "").trim() ||
          (refused
            ? "Sorry — that is unrelated to this concept or to learning, so I will not answer."
            : "No response generated."),
        quizPrompt: String(data.quizPrompt || "").trim(),
        aiMayBeWrong:
          String(data.aiMayBeWrong || "").trim() ||
          "AI may be wrong. Verify with your notes or textbook.",
        note: result.note,
        model: result.model,
        provider: result.provider,
      });
    } catch (error) {
      if (userApiKey) {
        const message = error instanceof Error ? error.message : "AI call failed";
        return NextResponse.json({ error: message }, { status: 502 });
      }
      console.error(error);
      return NextResponse.json({
        refused: false,
        reply: conceptTitle
          ? `Mock explain for “${conceptTitle}”: restudy the definition, list 2 key points from your notes, and invent one tiny example (no full solutions). Configure GROQ_API_KEY for live AI.`
          : "Mock mode: name a concept to explain. Configure site API keys for live answers.",
        quizPrompt: conceptTitle
          ? `In one sentence, what must you not confuse “${conceptTitle}” with?`
          : "",
        aiMayBeWrong: "Mock response — not a real model.",
        note: "Mock mode (no API key yet).",
      });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
