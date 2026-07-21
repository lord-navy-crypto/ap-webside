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
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content || "";

  try {
    return JSON.parse(text);
  } catch {
    return {
      hints: [text.slice(0, 300)],
      aiMayBeWrong: "AI may make mistakes. Verify with your textbook or teacher.",
      note: "Powered by Groq (free tier).",
    };
  }
}

async function callGemini(apiKey: string, question: string, subject: string) {
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
    throw new Error(`Gemini API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    // fall through
  }

  return {
    hints: [text.slice(0, 300)],
    aiMayBeWrong: "AI may make mistakes. Verify with your textbook.",
    note: "Powered by Gemini API.",
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const question = String(body.question || "").trim();
    const subject = String(body.subject || "AP Physics 1");
    const userApiKey = String(body.userApiKey || "").trim();
    const provider = String(body.provider || "groq") as "groq" | "gemini";

    if (!question) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    if (userApiKey) {
      if (provider === "groq") {
        try {
          const result = await callGroq(
            userApiKey,
            question,
            subject,
            "llama-3.3-70b-versatile"
          );
          return NextResponse.json({ ...result, note: "Powered by your own Groq key." });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Groq call failed";
          return NextResponse.json({ error: message }, { status: 502 });
        }
      }

      if (provider === "gemini") {
        try {
          const result = await callGemini(userApiKey, question, subject);
          return NextResponse.json({ ...result, note: "Powered by your own Gemini key." });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Gemini call failed";
          return NextResponse.json({ error: message }, { status: 502 });
        }
      }
    }

    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (groqKey) {
      try {
        const result = await callGroq(groqKey, question, subject, "llama-3.3-70b-versatile");
        return NextResponse.json({ ...result, note: "Powered by Groq (free tier)." });
      } catch (error) {
        console.error(error);
      }
    }

    if (geminiKey) {
      try {
        const result = await callGemini(geminiKey, question, subject);
        return NextResponse.json({ ...result, note: "Powered by Gemini API." });
      } catch (error) {
        console.error(error);
      }
    }

    return NextResponse.json(mockHints(question, subject));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
