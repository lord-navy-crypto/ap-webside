import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are an AP tutor. Rules:
- Give 2-3 short hints only (strategy, not full solution).
- NEVER give the final numeric answer or complete worked solution.
- If the question has no single standard answer, say so.
- Warn that AI may make mistakes.
- Max 120 words total.
- Respond in JSON format: {"hints":["...","..."],"aiMayBeWrong":"...","note":"..."}`;

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

async function callGroq(
  apiKey: string,
  question: string,
  subject: string,
  model: string
) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Subject: ${subject}\n\nQuestion:\n${question}`,
        },
      ],
      temperature: 0.4,
      max_tokens: 250,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content || "";

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    // fall through to formatted text response
  }

  return {
    hints: [text.slice(0, 300)],
    aiMayBeWrong: "AI may make mistakes. Verify with your textbook or teacher.",
    note: "Powered by Groq (free tier).",
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

    // Prefer Groq (free tier). Fallback to Gemini if configured. Otherwise mock hints.
    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (groqKey) {
      try {
        const result = await callGroq(
          groqKey,
          question,
          subject,
          "llama-3.3-70b-versatile"
        );
        return NextResponse.json({ ...result, note: "Powered by Groq (free tier)." });
      } catch (error) {
        console.error(error);
        // Fall through to next available provider or mock.
      }
    }

    if (geminiKey) {
      const prompt = `${SYSTEM_PROMPT}\n\nSubject: ${subject}\nQuestion:\n${question}\n\nRespond in JSON: {"hints":["...","..."],"aiMayBeWrong":"...","note":"..."}`;
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
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
        // fall through
      }

      return NextResponse.json({
        hints: [text.slice(0, 300)],
        aiMayBeWrong: "AI may make mistakes. Verify with your textbook.",
        note: "Powered by Gemini API.",
      });
    }

    return NextResponse.json(mockHints(question, subject));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
