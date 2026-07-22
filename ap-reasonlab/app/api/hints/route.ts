import { NextRequest, NextResponse } from "next/server";
import { asStringList, runChatJson } from "@/lib/ai-client";
import { HINT_PROCESS_SYSTEM } from "@/lib/ai-prompts";

function mockHints(question: string, subject: string) {
  return {
    hints: [
      `Identify what ${subject} concept this question is testing before choosing a formula.`,
      "List knowns, unknowns, and units. Sketch if helpful.",
      "Pick one linking equation, then solve the last step yourself.",
    ],
    keyFormulas: ["Write the main equation symbols for this topic (from your sheet)."],
    checkpoints: [
      "Check units of any intermediate quantity before substituting.",
      "Confirm sign convention matches your diagram.",
      "Your intermediate should relate knowns to the unknown — not skip to the final number.",
    ],
    processOutline: [
      "Clarify the physical/math situation",
      "Select relevant formula(s)",
      "Compute/check an intermediate",
      "Finish the last algebra yourself",
    ],
    aiMayBeWrong:
      "AI may make formula or reasoning errors. Verify every step with your textbook or teacher.",
    note: `Mock mode (no API key yet). Question received: "${question.slice(0, 80)}${question.length > 80 ? "..." : ""}"`,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const question = String(body.question || "").trim();
    const subject = String(body.subject || "AP Physics 1");
    const notes = String(body.notes || "").trim();
    const userApiKey = String(body.userApiKey || "").trim();
    const provider = (body.provider === "gemini" ? "gemini" : "groq") as "groq" | "gemini";

    if (!question) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }
    if (question.length > 6000) {
      return NextResponse.json({ error: "Question is too long (max 6000 characters)." }, { status: 400 });
    }
    if (subject.length > 120 || notes.length > 8_000) {
      return NextResponse.json({ error: "Subject or notes are too long" }, { status: 400 });
    }

    const user = `Subject: ${subject}

Question:
${question}

${notes ? `Student notes / attempt (optional):\n${notes}` : ""}

Return JSON with hints, keyFormulas, checkpoints, processOutline, aiMayBeWrong.`;

    try {
      const result = await runChatJson({
        system: HINT_PROCESS_SYSTEM,
        user,
        maxTokens: 750,
        userApiKey: userApiKey || undefined,
        provider,
      });

      const data = result.data;
      return NextResponse.json({
        hints: asStringList(data.hints).slice(0, 4),
        keyFormulas: asStringList(data.keyFormulas).slice(0, 5),
        checkpoints: asStringList(data.checkpoints).slice(0, 5),
        processOutline: asStringList(data.processOutline).slice(0, 6),
        aiMayBeWrong:
          String(data.aiMayBeWrong || "").trim() ||
          "AI may make mistakes. Verify with your textbook or teacher.",
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
      return NextResponse.json(mockHints(question, subject));
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
