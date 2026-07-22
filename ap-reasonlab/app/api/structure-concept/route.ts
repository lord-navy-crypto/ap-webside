import { NextRequest, NextResponse } from "next/server";
import { asStringList, runChatJson } from "@/lib/ai-client";

const SYSTEM_PROMPT = `You are helping build an AP study concept card for a non-profit learning site.
Rules:
- Use only the student's pasted notes. Do not invent exam answers or scrape the web.
- Keep content educational. Never produce a full worked solution for a graded problem.
- Respond in JSON only:
{
  "summary": "1-3 sentence overview (may refine the user summary)",
  "keyPoints": ["...", "...", "..."],
  "commonMistakes": ["...", "..."],
  "example": "One short illustrative example or mini-scenario (not a full answer key)"
}
- keyPoints: 3-6 bullet ideas
- commonMistakes: 2-4 typical student errors
- example: brief; if notes lack an example, say what kind of example to try
- Flag uncertainty only inside the fields if needed; do not add extra keys.`;

function mockStructure(name: string, area: string, summary: string, raw: string) {
  const lines = raw
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
  const chunks = lines.length ? lines : [raw.trim() || summary].filter(Boolean);

  const keyPoints = chunks.slice(0, 5).map((c) => c.slice(0, 220));
  const commonMistakes = [
    `Mixing up related ideas in ${area} when studying “${name}”.`,
    "Skipping definitions before jumping to formulas or examples.",
    ...(chunks[1] ? [`Overlooking: ${chunks[1].slice(0, 160)}`] : []),
  ].slice(0, 4);

  return {
    summary:
      summary.trim() ||
      chunks[0]?.slice(0, 280) ||
      `${name} (${area}) — review your notes and refine this summary.`,
    keyPoints: keyPoints.length
      ? keyPoints
      : [`Core idea of ${name}`, `How ${name} is used in ${area}`, "What you must remember for FRQs"],
    commonMistakes,
    example:
      chunks.find((c) => /example|e\.g\.|for instance|比如/i.test(c))?.slice(0, 400) ||
      `Try a short example from your notes for “${name}” and write one key setup step (not the full solution).`,
    note: "Mock sort (no API key). Review and edit before saving.",
    aiMayBeWrong: "AI may mis-sort notes. Check every field before publishing.",
  };
}

function normalizeResult(raw: Record<string, unknown>, fallbackNote: string) {
  return {
    summary: String(raw.summary || "").trim(),
    keyPoints: asStringList(raw.keyPoints),
    commonMistakes: asStringList(raw.commonMistakes),
    example: String(raw.example || "").trim(),
    note: fallbackNote,
    aiMayBeWrong:
      "AI may mis-sort or invent emphasis. Edit fields before saving. Learning only — not for graded work.",
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body.name || body.title || "").trim();
    const area = String(body.area || body.subject || "").trim();
    const summary = String(body.summary || "").trim();
    const rawContent = String(body.content || body.raw || "").trim();

    if (!name || !area) {
      return NextResponse.json({ error: "Area and name are required" }, { status: 400 });
    }
    if (!rawContent && !summary) {
      return NextResponse.json(
        { error: "Paste related notes/content (or a summary) for AI to sort" },
        { status: 400 }
      );
    }
    if (name.length > 160 || area.length > 120 || summary.length > 4_000 || rawContent.length > 20_000) {
      return NextResponse.json({ error: "Concept input is too long" }, { status: 400 });
    }

    const userPrompt = `Area/subject: ${area}
Concept name: ${name}
User summary (keep on top / refine lightly):
${summary || "(none — invent a short summary from notes)"}

Related notes / AI production content to sort into key points, common mistakes, and example:
${rawContent || summary}`;

    try {
      const result = await runChatJson({
        system: SYSTEM_PROMPT,
        user: userPrompt,
        maxTokens: 900,
      });
      return NextResponse.json(normalizeResult(result.data, result.note));
    } catch (e) {
      console.error(e);
      return NextResponse.json(mockStructure(name, area, summary, rawContent));
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
