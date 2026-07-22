import { NextRequest, NextResponse } from "next/server";

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

async function callGroq(apiKey: string, prompt: string) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 900,
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq API error ${res.status}: ${errText}`);
  }
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content || "";
  return JSON.parse(text);
}

async function callGemini(apiKey: string, prompt: string) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\n\n${prompt}` }] }],
      }),
    }
  );
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errText}`);
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Gemini returned no JSON");
  return JSON.parse(jsonMatch[0]);
}

function normalizeResult(raw: Record<string, unknown>, fallbackNote: string) {
  const asList = (v: unknown) =>
    Array.isArray(v) ? v.map(String).filter((s) => s.trim()) : [];
  return {
    summary: String(raw.summary || "").trim(),
    keyPoints: asList(raw.keyPoints),
    commonMistakes: asList(raw.commonMistakes),
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

    const userPrompt = `Area/subject: ${area}
Concept name: ${name}
User summary (keep on top / refine lightly):
${summary || "(none — invent a short summary from notes)"}

Related notes / AI production content to sort into key points, common mistakes, and example:
${rawContent || summary}`;

    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (groqKey) {
      try {
        const result = await callGroq(groqKey, userPrompt);
        return NextResponse.json(normalizeResult(result, "Sorted with Groq (site key)."));
      } catch (e) {
        console.error(e);
      }
    }
    if (geminiKey) {
      try {
        const result = await callGemini(geminiKey, userPrompt);
        return NextResponse.json(normalizeResult(result, "Sorted with Gemini (site key)."));
      } catch (e) {
        console.error(e);
      }
    }

    return NextResponse.json(mockStructure(name, area, summary, rawContent));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
