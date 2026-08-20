# AGENTS.md

## Cursor Cloud specific instructions

This repository contains a single Next.js app in the `ap-reasonlab/` subdirectory (AP ReasonLab / "Knowledge Explorer" — an AP study site). Run all commands from `ap-reasonlab/`, not the repo root.

### Services

- Only one service: the Next.js 15 (App Router, React 19, TypeScript, Tailwind) web app. Dev server runs on `http://localhost:3000`.
- Standard commands are in `ap-reasonlab/package.json`: `npm run dev`, `npm run build`, `npm run start`, `npm run check:ai-latex`.

### Non-obvious caveats

- Do NOT run `npm run build` while `npm run dev` is running (or vice versa). They share the `ap-reasonlab/.next/` directory, and building over a running dev server corrupts it (dev then throws `Cannot find module './XXXX.js'` and returns HTTP 500). If this happens, stop the dev server, `rm -rf .next`, and restart `npm run dev`.
- `npm run check:ai-latex` uses `tsx`, which is invoked via the `tsx` binary. It is not listed in `package.json` deps; if missing, `npx tsx scripts/check-ai-latex.ts` will fetch it on demand.
- `next lint` is NOT usable out of the box: there is no committed ESLint config and `eslint` is not a dependency, so `next lint` drops into an interactive setup prompt. Typechecking is covered by `npm run build` (Next.js runs `tsc` during the build). Use the build for verification instead of lint.
- AI features (Hint Coach at `/hints`, AI Toolbox) work without any API keys: they fall back to deterministic "mock mode" responses. Real AI needs keys from `ap-reasonlab/.env.example` (e.g. `GROQ_API_KEY`, `GEMINI_API_KEY`) copied into `.env.local`. Not required for local dev/testing.
