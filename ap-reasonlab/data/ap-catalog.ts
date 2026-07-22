import { AP_SUBJECTS } from "@/data/ap-expanded";

export type SubjectGroup = "STEM" | "Social Science" | "Humanities";

export type SubjectDefinition = {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  description: string;
  icon: string;
  color: string;
  group: SubjectGroup;
  order: number;
  enabled: boolean;
};

const descriptions: Record<string, string> = {
  "AP Physics 1": "Algebra-based mechanics, energy, momentum, rotation, oscillations, and fluids.",
  "AP Physics 2": "Thermodynamics, fluids, waves, optics, and modern physics without the site's EM extension.",
  "AP Physics C: Mechanics": "Calculus-based mechanics and mathematical modeling.",
  "AP Physics C: E&M": "Calculus-based electricity and magnetism.",
  "AP Calculus AB/BC": "Limits, derivatives, integrals, differential equations, and BC series.",
  "AP Statistics": "Data analysis, probability, experimental design, and inference.",
  "AP Chemistry": "Atomic structure, reactions, kinetics, equilibrium, and thermodynamics.",
  "AP Biology": "Cells, genetics, evolution, energetics, and ecological systems.",
  "AP Psychology": "Research methods, cognition, behavior, development, and mental processes.",
};

export function subjectSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/^ap\s+/, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
function groupFor(name: string): SubjectGroup {
  if (/Physics|Calculus|Statistics|Chemistry|Biology|Computer|Environmental/.test(name)) return "STEM";
  if (/Economics|History|Psychology|Geography/.test(name)) return "Social Science";
  return "Humanities";
}

function iconFor(name: string): string {
  if (/Physics/.test(name)) return "⚛";
  if (/Calculus|Statistics/.test(name)) return "∫";
  if (/Chemistry/.test(name)) return "⚗";
  if (/Biology|Environmental/.test(name)) return "◉";
  if (/Computer/.test(name)) return "⌘";
  if (/Economics/.test(name)) return "↗";
  if (/History|Geography/.test(name)) return "◎";
  if (/English/.test(name)) return "Aa";
  return "◇";
}

export const AP_CATALOG: SubjectDefinition[] = AP_SUBJECTS.map((name, index) => ({
  id: subjectSlug(name),
  slug: subjectSlug(name),
  name,
  shortName: name.replace(/^AP /, ""),
  description: descriptions[name] || `Concepts, formulas, practice, documents, and study tools for ${name}.`,
  icon: iconFor(name),
  color: ["blue", "violet", "emerald", "amber"][index % 4],
  group: groupFor(name),
  order: index,
  enabled: true,
}));

export function getSubjectBySlug(slug: string): SubjectDefinition | undefined {
  return AP_CATALOG.find((subject) => subject.slug === slug);
}
