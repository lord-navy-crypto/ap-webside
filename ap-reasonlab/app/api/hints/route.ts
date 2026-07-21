import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are an AP tutor. Rules:
- Give 2-3 short hints only (strategy, not full solution).
- NEVER give the final numeric answer or complete worked solution.
- If the question has no single standard answer, say so.
- Warn that AI may make mistakes.
- Max 120 words total.`;

function mockHints(question: string, subject: string) {
  return {
    hints: [
      `Identify what ${subject} concept this question is testing before choosing a formula.`,
      "Write known values and what you need to find. Draw a diagram if possible.",
      "Choose one equation that links your unknown to known quantities, then solve step by step yourself.",
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

    if (!question) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(mockHints(question, subject));
    }

    const prompt = `${SYSTEM_PROMPT}\n\nSubject: ${subject}\nQuestion:\n${question}\n\nRespond in JSON: {"hints":["...","..."],"aiMayBeWrong":"...","note":"..."}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error("Gemini API error:", errText);
      return NextResponse.json(mockHints(question, subject));
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return NextResponse.json(JSON.parse(jsonMatch[0]));
      }
    } catch {
      // fall through to formatted text response
    }

    return NextResponse.json({
      hints: [text.slice(0, 300)],
      aiMayBeWrong: "AI may make mistakes. Verify with your textbook.",
      note: "Powered by Gemini API.",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
