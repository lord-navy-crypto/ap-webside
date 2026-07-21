import { ChecklistItem } from "@/lib/types";

/** Live project checklist — shown on /checklist */
export const checklistItems: ChecklistItem[] = [
  {
    id: "deploy",
    status: "done",
    title: "Deploy live website",
    description: "Site online at ap-webside.vercel.app via Vercel.",
    link: "https://ap-webside.vercel.app",
  },
  {
    id: "github",
    status: "done",
    title: "Upload code to GitHub",
    description: "Repository lord-navy-crypto/ap-webside connected to Vercel.",
    link: "https://github.com/lord-navy-crypto/ap-webside",
  },
  {
    id: "root-dir",
    status: "done",
    title: "Vercel Root Directory = ap-reasonlab",
    description: "Git push auto-deploys the correct Next.js folder.",
  },
  {
    id: "content-v1",
    status: "in_progress",
    title: "Fill AP concepts, formulas, generated questions",
    description: "Physics 1 + Calc AB core units; more subjects coming.",
    link: "/concepts",
  },
  {
    id: "gemini",
    status: "todo",
    title: "Add GEMINI_API_KEY on Vercel",
    description: "Enable live AI Hint Coach in production.",
    link: "/guide",
  },
  {
    id: "more-phys",
    status: "todo",
    title: "Expand Physics 1 (energy, momentum, rotation, SHM)",
    description: "Add concepts, formulas, and generated sets for Units 4–7.",
    link: "/formulas?subject=AP+Physics+1",
  },
  {
    id: "more-calc",
    status: "todo",
    title: "Expand Calculus AB (integrals, FTC, applications)",
    description: "Units 6–8 concepts + integral practice sets.",
    link: "/formulas?subject=AP+Calculus+AB",
  },
  {
    id: "tier-ui",
    status: "todo",
    title: "Three difficulty tiers (UI)",
    description: "Filter generated sets by intro / standard / challenge.",
    link: "/questionnaires",
  },
  {
    id: "chem-bio",
    status: "todo",
    title: "Add AP Chemistry & AP Biology (future)",
    description: "New subjects after Physics + Calc are stable.",
  },
  {
    id: "users",
    status: "todo",
    title: "Get 10–20 student testers",
    description: "Share link, collect feedback, improve hints UX.",
  },
  {
    id: "collab",
    status: "todo",
    title: "Invite collaborators on GitHub (optional)",
    description: "Friends with Write access can push via pull requests.",
  },
];

export function getChecklistStats() {
  const done = checklistItems.filter((i) => i.status === "done").length;
  const inProgress = checklistItems.filter((i) => i.status === "in_progress").length;
  const todo = checklistItems.filter((i) => i.status === "todo").length;
  return { done, inProgress, todo, total: checklistItems.length };
}
