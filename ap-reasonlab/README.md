# AP ReasonLab

Free AP study website: concept library, half-process practice, and hint coach (no final answers by default).

## Project structure

```text
ap-reasonlab/
├── app/
│   ├── page.tsx              # Home
│   ├── concepts/             # Concept library
│   ├── practice/             # Half-process practice
│   ├── hints/                # Hint Coach UI
│   ├── about/                # About & ethics
│   └── api/hints/route.ts    # AI hints API (mock without key)
├── components/
├── data/content.ts           # Concepts & questions (edit here first)
├── lib/types.ts
├── preview.html              # Static preview (no Node needed)
└── .env.example              # Gemini API key (optional)
```

## Quick start

### Step 1 — Install Node.js

Download and install Node.js 20+ from https://nodejs.org

Verify:

```bash
node -v
npm -v
```

### Step 2 — Install dependencies

```bash
cd ap-reasonlab
npm install
```

### Step 3 — Run locally

```bash
npm run dev
```

Open http://localhost:3000

### Step 4 — (Optional) Enable Gemini AI

```bash
cp .env.example .env.local
```

Add your free API key from https://aistudio.google.com/apikey

Restart `npm run dev`. Without a key, Hint Coach uses mock hints (still works).

## What works now

- Home page
- Concept library (3 sample concepts)
- Concept detail pages
- Half-process practice (2 sample questions)
- Hint Coach UI (mock or Gemini)
- Ethics banner on key pages

## Next steps (your roadmap)

1. Edit `data/content.ts` — add more AP concepts and questions
2. Add Gemini API key in `.env.local`
3. Deploy to Vercel (free)
4. Open-source on GitHub
5. Add question generator module

## Deploy to Vercel (later)

1. Push project to GitHub
2. Go to https://vercel.com
3. Import repo → deploy
4. Add `GEMINI_API_KEY` in Vercel environment variables

## Ethics

This project is for learning only. Do not use on graded exams or homework unless allowed by your teacher.
