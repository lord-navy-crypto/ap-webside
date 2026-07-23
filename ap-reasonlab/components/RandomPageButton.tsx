"use client";

import { useRouter } from "next/navigation";
import { AP_CATALOG } from "@/data/ap-catalog";

const STATIC_STUDY_PATHS = [
  "/ap",
  "/concepts",
  "/formulas",
  "/practice",
  "/hints",
  "/search",
  "/tools",
  "/tools/calculator",
  "/tools/grapher",
  "/academic",
  "/code",
  "/forum",
  "/learning-box",
  "/picture",
  "/image-gen",
  "/key-concepts",
  "/questionnaires",
  "/checklist",
  "/guide",
];

function studyPaths(): string[] {
  const subjectPaths = AP_CATALOG.map((subject) => `/ap/${subject.slug}`);
  return [...STATIC_STUDY_PATHS, ...subjectPaths];
}

export default function RandomPageButton() {
  const router = useRouter();

  function goRandom() {
    const paths = studyPaths();
    const next = paths[Math.floor(Math.random() * paths.length)];
    router.push(next);
  }

  return (
    <button
      type="button"
      onClick={goRandom}
      title="Jump to a random study page"
      aria-label="Jump to a random study page"
      className="fixed bottom-20 left-3 z-50 rounded-full border border-slate-200 bg-white/95 px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-lg backdrop-blur transition hover:border-brand-300 hover:text-brand-700 md:bottom-6"
    >
      🎲 Random
    </button>
  );
}
