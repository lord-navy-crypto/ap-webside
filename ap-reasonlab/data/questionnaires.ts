import { Questionnaire } from "@/lib/types";
import { macroQuestionnaires } from "@/data/ap-macro";
import { microQuestionnaires } from "@/data/ap-micro";
import { physics2Questionnaires } from "@/data/ap-physics2";
import { statsQuestionnaires } from "@/data/ap-stats";

/**
 * Generated question sets only.
 * Workflow: feed topic / sample problems to Claude or ChatGPT → get NEW items → paste here.
 * Do not paste College Board exam text verbatim.
 */

export const questionnaires: Questionnaire[] = [
  {
    id: "phys1-gen-kinematics-a",
    title: "Physics 1 — Kinematics Generated Set A",
    subject: "AP Physics 1",
    kind: "generated",
    description:
      "AI-generated kinematics practice. Half-process style — hints only, no answer keys on site.",
    generationNote:
      "Generated from kinematics topic prompts (Claude/ChatGPT). Original numbers and contexts.",
    estimatedMinutes: 25,
    tags: ["kinematics", "1D motion", "generated"],
    items: [
      {
        id: "phys1-gen-k1",
        format: "frq_half",
        conceptId: "kinematics-basics",
        conceptIntro:
          "Key concept: constant-acceleration kinematics. Lock direction and knowns first.",
        prompt:
          "A skateboarder starts from rest and accelerates at 1.5 m/s² for 4.0 s on flat ground. Find the distance traveled during those 4.0 s.",
        visibleSteps: [
          "List knowns: v₀ = 0, a = 1.5 m/s², t = 4.0 s.",
          "Choose an equation linking x, v₀, a, and t.",
        ],
        blankSteps: [
          "Equation: ____________________",
          "Distance x = ______ m",
        ],
        hints: [
          "L1: From rest ⇒ v₀ = 0.",
          "L2: Try x = v₀t + ½at² when final v is unknown.",
          "L3: Verify units before computing.",
        ],
      },
      {
        id: "phys1-gen-k2",
        format: "concept_check",
        conceptId: "kinematics-basics",
        conceptIntro: "Key concept: distance vs |displacement|.",
        prompt:
          "A runner goes +40 m then −10 m in 20 s. Which is larger: distance or |displacement|? Explain in one sentence.",
        hints: [
          "Distance sums path lengths; displacement is net position change.",
        ],
      },
      {
        id: "phys1-gen-k3",
        format: "mcq",
        conceptId: "kinematics-basics",
        conceptIntro: "Key concept: slope on v–t graphs.",
        prompt:
          "On a velocity–time graph with constant positive slope, which statement is true?",
        choices: [
          "A) Acceleration is zero",
          "B) Acceleration is constant and nonzero",
          "C) Position is constant",
          "D) Speed must be decreasing",
        ],
        hints: [
          "Slope of v–t equals acceleration.",
          "Justify from definitions — do not hunt for a letter key.",
        ],
      },
    ],
  },
  {
    id: "phys1-gen-forces-lab",
    title: "Physics 1 — Forces Generated Lab Set",
    subject: "AP Physics 1",
    kind: "generated",
    description:
      "Generated Newton's law and free-body diagram drills. Original practice items.",
    generationNote:
      "Produced via AI from forces topic + sample FBD prompts. Regenerate to expand.",
    estimatedMinutes: 30,
    tags: ["forces", "Newton", "FBD", "generated"],
    items: [
      {
        id: "phys1-gen-f1",
        format: "frq_half",
        conceptId: "newtons-second-law",
        conceptIntro: "Key concept: F_net = ma after a correct FBD.",
        prompt:
          "A 3.0 kg crate on a frictionless floor is pulled by a horizontal rope with tension 9.0 N. Find the acceleration.",
        visibleSteps: [
          "Draw FBD: tension horizontal; weight and normal vertical.",
          "Identify net horizontal force.",
        ],
        blankSteps: ["F_net,x = ______ N", "a = ______ m/s²"],
        hints: [
          "L1: No friction on a frictionless floor.",
          "L2: Vertical forces cancel if no vertical acceleration.",
        ],
      },
      {
        id: "phys1-gen-f2",
        format: "fill_blank",
        conceptId: "newtons-second-law",
        conceptIntro: "Key concept: zero net force ⇒ zero acceleration.",
        prompt:
          "If net force on an object is zero, acceleration is ______ and velocity is ______ (constant / changing).",
        hints: ["Newton 1 is F_net = 0 ⇒ a = 0."],
      },
    ],
  },
  {
    id: "calcab-gen-derivatives-a",
    title: "Calculus AB — Derivatives Generated Set A",
    subject: "AP Calculus AB/BC",
    kind: "generated",
    description: "Generated derivative drills using power rule and meaning of f′.",
    generationNote: "AI-generated from derivatives topic outline.",
    estimatedMinutes: 25,
    tags: ["derivatives", "power rule", "generated"],
    items: [
      {
        id: "calc-gen-d1",
        format: "frq_half",
        conceptId: "derivatives-basics",
        conceptIntro: "Key concept: power rule, term by term.",
        prompt: "Find f′(x) if f(x) = 4x⁵ − 3x² + 7.",
        visibleSteps: [
          "Recall d/dx(xⁿ) = nxⁿ⁻¹.",
          "Differentiate each term.",
        ],
        blankSteps: ["f′(x) = ____________________"],
        hints: ["Constants differentiate to 0.", "Reduce each exponent by 1."],
      },
      {
        id: "calc-gen-d2",
        format: "concept_check",
        conceptId: "derivatives-basics",
        conceptIntro: "Key concept: f′(a) as tangent slope.",
        prompt:
          "In one sentence: what does f′(2) mean geometrically for y = f(x)?",
        hints: ["Tangent line slope at x = 2."],
      },
    ],
  },
  {
    id: "calcab-gen-rates",
    title: "Calculus AB — Rates Generated Set",
    subject: "AP Calculus AB/BC",
    kind: "generated",
    description: "Generated rate-of-change word problems and concept checks.",
    generationNote: "AI-generated rates applications set.",
    estimatedMinutes: 20,
    tags: ["rates", "applications", "generated"],
    items: [
      {
        id: "calc-gen-r1",
        format: "frq_half",
        conceptId: "derivatives-basics",
        conceptIntro: "Key concept: velocity = derivative of position.",
        prompt:
          "s(t) = t³ − 6t² + 9t (meters). Find v(t) = s′(t).",
        visibleSteps: ["Velocity is ds/dt.", "Differentiate term by term."],
        blankSteps: ["v(t) = ____________________"],
        hints: ["Power rule on each term."],
      },
      {
        id: "calc-gen-r2",
        format: "mcq",
        conceptIntro: "Key concept: average vs instantaneous rate.",
        prompt: "Average rate of change of f on [1, 3] equals:",
        choices: [
          "A) f′(1)",
          "B) f′(3)",
          "C) [f(3) − f(1)] / (3 − 1)",
          "D) lim h→0 [f(1+h) − f(1)] / h",
        ],
        hints: ["Secant slope vs derivative/limit."],
      },
    ],
  },
  {
    id: "phys1-gen-formulas",
    title: "Physics 1 — Formula Application Set",
    subject: "AP Physics 1",
    kind: "generated",
    description:
      "Practice choosing and applying official equation-sheet formulas. Half-process only.",
    generationNote:
      "Original problems aligned with AP Physics 1 CED Units 1, 4, 5.",
    estimatedMinutes: 30,
    tags: ["formulas", "energy", "momentum", "kinematics", "generated"],
    items: [
      {
        id: "phys1-form-f1",
        format: "frq_half",
        conceptId: "kinematics-basics",
        conceptIntro: "Formula: v² = v₀² + 2aΔx — no time given.",
        prompt:
          "A car slows from 20 m/s to 10 m/s with constant acceleration −2 m/s². How far does it travel during braking?",
        visibleSteps: [
          "List: v₀ = 20, v = 10, a = −2 (if +x is forward).",
          "Pick v² = v₀² + 2aΔx.",
        ],
        blankSteps: ["Δx = ______ m"],
        hints: ["L1: Time is not needed.", "L2: Watch sign of a vs direction."],
      },
      {
        id: "phys1-form-f2",
        format: "frq_half",
        conceptId: "energy-work",
        conceptIntro: "Formula: K = ½mv².",
        prompt:
          "A 0.8 kg ball’s speed increases from 5 m/s to 15 m/s. Find the change in kinetic energy.",
        visibleSteps: ["Compute K_i and K_f separately.", "ΔK = K_f − K_i."],
        blankSteps: ["ΔK = ______ J"],
        hints: ["L1: K uses speed squared.", "L2: ΔK can be computed as ½m(v_f² − v_i²)."],
      },
      {
        id: "phys1-form-f3",
        format: "concept_check",
        conceptId: "momentum",
        conceptIntro: "Formula: J = FΔt = Δp.",
        prompt:
          "A 50 N force acts on a cart for 0.20 s. What quantity equals 50 × 0.20 in SI units, and what does it measure?",
        hints: ["Impulse in N·s = kg·m/s = change in momentum."],
      },
      {
        id: "phys1-form-f4",
        format: "mcq",
        conceptId: "energy-work",
        conceptIntro: "Formula: U_g = mgh.",
        prompt:
          "Doubling only the height of an object (same mass, same g) changes gravitational PE by:",
        choices: [
          "A) Factor of 4",
          "B) Factor of 2",
          "C) Unchanged",
          "D) Factor of ½",
        ],
        hints: ["U_g is linear in h when m and g fixed."],
      },
    ],
  },
  {
    id: "calcab-gen-formulas",
    title: "Calculus AB — Formula & Rule Set",
    subject: "AP Calculus AB/BC",
    kind: "generated",
    description:
      "Derivative rules, FTC, and power-rule integration drills. No exam formula sheet — memorize these.",
    generationNote: "Original items aligned with AP Calculus AB CED Units 2–6.",
    estimatedMinutes: 35,
    tags: ["formulas", "derivatives", "integrals", "FTC", "generated"],
    items: [
      {
        id: "calc-form-c1",
        format: "frq_half",
        conceptId: "derivatives-basics",
        conceptIntro: "Chain rule: d/dx f(g(x)) = f′(g(x))·g′(x).",
        prompt: "Find d/dx [(3x² + 1)⁴].",
        visibleSteps: [
          "Outer function: u⁴ ⇒ derivative 4u³.",
          "Inner function: 3x² + 1 ⇒ derivative 6x.",
        ],
        blankSteps: ["Result = ____________________"],
        hints: ["L1: Multiply outer and inner derivatives.", "L2: Substitute u = 3x² + 1 at end."],
      },
      {
        id: "calc-form-c2",
        format: "frq_half",
        conceptId: "integrals-basics",
        conceptIntro: "FTC Part 2: ∫ₐᵇ f(x) dx = F(b) − F(a).",
        prompt: "Evaluate ∫₀² (x² + 1) dx.",
        visibleSteps: [
          "Antiderivative: x³/3 + x.",
          "Evaluate at 2 and 0.",
        ],
        blankSteps: ["Value = ______"],
        hints: ["L1: Power rule for integration.", "L2: F(0) simplifies the lower bound."],
      },
      {
        id: "calc-form-c3",
        format: "fill_blank",
        conceptId: "derivatives-basics",
        conceptIntro: "Product rule: (fg)′ = f′g + fg′.",
        prompt:
          "If f(x) = x² and g(x) = sin x, then (fg)′(x) = ______·sin x + x²·______.",
        hints: ["Differentiate each factor separately."],
      },
      {
        id: "calc-form-c4",
        format: "concept_check",
        conceptId: "integrals-basics",
        conceptIntro: "FTC Part 1 links accumulation and derivative.",
        prompt:
          "In one sentence: why does d/dx ∫₀ˣ t² dt equal x²?",
        hints: ["FTC Part 1: derivative of accumulation function returns integrand."],
      },
    ],
  },
  {
    id: "ai-ap-study-habits",
    title: "How to Use AI for AP — Generated Reflection Set",
    subject: "Study Skills / AI for AP",
    kind: "generated",
    description:
      "Generated prompts about safe AI use: explaining, diagrams, and half-process practice.",
    generationNote: "Meta questionnaire for learners building ReasonLab workflows.",
    estimatedMinutes: 15,
    tags: ["AI", "study skills", "generated"],
    items: [
      {
        id: "ai-gen-q1",
        format: "open",
        conceptIntro: "AI as explainer — ask why/how, not final answers.",
        prompt:
          "Write one Claude/ChatGPT prompt to explain an AP free-body diagram without asking for the numeric answer.",
        hints: ["Include your attempt and what confuses you."],
      },
      {
        id: "ai-gen-q2",
        format: "concept_check",
        conceptIntro: "AI images can help visualize but may be physically wrong.",
        prompt:
          "One benefit and one risk of AI-generated physics diagrams?",
        hints: ["Visualization vs wrong arrows/axes."],
      },
      {
        id: "ai-gen-q3",
        format: "fill_blank",
        conceptIntro: "ReasonLab hides final answers by design.",
        prompt: "ReasonLab should give ______ first and hide ______ by default.",
        hints: ["Hints / scaffolding vs final answers."],
      },
    ],
  },
  {
    id: "phys1-gen-rotation",
    title: "Physics 1 — Rotation & SHM Generated Set",
    subject: "AP Physics 1",
    kind: "generated",
    description:
      "Generated practice on torque, rotational inertia, angular momentum, and simple harmonic motion.",
    generationNote:
      "Original items aligned with AP Physics 1 CED Units 5–7 and 2026 equation sheet.",
    estimatedMinutes: 30,
    tags: ["rotation", "torque", "SHM", "generated"],
    items: [
      {
        id: "phys1-rot-1",
        format: "frq_half",
        conceptId: "rotation",
        conceptIntro: "Formula: α = τ_net / I.",
        prompt:
          "A wheel with rotational inertia 0.6 kg·m² experiences a net torque of 1.2 N·m. Find the angular acceleration.",
        visibleSteps: ["Identify τ_net and I.", "Use α = τ_net / I."],
        blankSteps: ["α = ______ rad/s²"],
        hints: [
          "L1: This is the rotational form of Newton's second law.",
          "L2: Units check: N·m / (kg·m²) = rad/s².",
        ],
      },
      {
        id: "phys1-shm-1",
        format: "frq_half",
        conceptId: "shm",
        conceptIntro: "Formula: T = 2π√(m/k) for mass-spring system.",
        prompt:
          "A 2.0 kg mass oscillates on a spring with spring constant 8.0 N/m. Find the period of oscillation.",
        visibleSteps: [
          "Recall T = 2π√(m/k).",
          "Substitute m = 2.0 kg and k = 8.0 N/m.",
        ],
        blankSteps: ["T = ______ s"],
        hints: ["L1: Simplify √(2/8) first.", "L2: Period depends on m and k, not amplitude."],
      },
    ],
  },
  {
    id: "phys1-gen-fluids",
    title: "Physics 1 — Fluids Generated Set",
    subject: "AP Physics 1",
    kind: "generated",
    description:
      "Generated practice on density, pressure, buoyancy, and hydrostatics for the 2026 AP Physics 1 exam.",
    generationNote:
      "Original items aligned with AP Physics 1 CED Unit 8 (Fluids) and official equation sheet.",
    estimatedMinutes: 25,
    tags: ["fluids", "buoyancy", "pressure", "generated"],
    items: [
      {
        id: "phys1-fluid-1",
        format: "frq_half",
        conceptId: "fluids",
        conceptIntro: "Formula: F_b = ρVg.",
        prompt:
          "A 0.003 m³ solid block is fully submerged in water (ρ = 1000 kg/m³). Take g = 10 m/s². Find the buoyant force magnitude.",
        visibleSteps: [
          "V_displaced = V_block because fully submerged.",
          "Use F_b = ρ_fluid V_displaced g.",
        ],
        blankSteps: ["F_b = ______ N"],
        hints: [
          "L1: Buoyant force equals weight of displaced water.",
          "L2: Use fluid density, not block density.",
        ],
      },
      {
        id: "phys1-fluid-2",
        format: "concept_check",
        conceptId: "fluids",
        conceptIntro: "Density ρ = m/V.",
        prompt:
          "A wooden block has mass 0.4 kg and volume 0.0005 m³. Will it float in water? Justify using density.",
        hints: ["Compare block density to water density (1000 kg/m³)."],
      },
      {
        id: "phys1-fluid-3",
        format: "frq_half",
        conceptId: "fluids",
        conceptIntro: "Continuity: A₁v₁ = A₂v₂.",
        prompt:
          "Water flows through a pipe that narrows from area A₁ = 0.04 m² to A₂ = 0.01 m². If v₁ = 2 m/s, find v₂.",
        visibleSteps: [
          "Apply A₁v₁ = A₂v₂ for incompressible steady flow.",
          "Solve for v₂.",
        ],
        blankSteps: ["v₂ = ______ m/s"],
        hints: [
          "L1: Smaller area means faster speed.",
          "L2: v₂ = (A₁/A₂) × v₁.",
        ],
      },
    ],
  },
  {
    id: "calcab-gen-limits",
    title: "Calculus AB — Limits & Continuity Generated Set",
    subject: "AP Calculus AB/BC",
    kind: "generated",
    description:
      "Generated drills on limits, factoring, continuity, and the Intermediate Value Theorem.",
    generationNote: "Original items aligned with AP Calculus AB CED Unit 1.",
    estimatedMinutes: 25,
    tags: ["limits", "continuity", "generated"],
    items: [
      {
        id: "calc-lim-1",
        format: "frq_half",
        conceptId: "limits-continuity",
        conceptIntro: "Factor to resolve 0/0 indeterminate form.",
        prompt: "Find lim x→2 (x² − 4)/(x − 2).",
        visibleSteps: [
          "Direct substitution gives 0/0.",
          "Factor numerator and cancel common factor.",
        ],
        blankSteps: ["Limit = ______"],
        hints: ["L1: x² − 4 is a difference of squares.", "L2: After canceling, substitute x = 2."],
      },
      {
        id: "calc-lim-2",
        format: "concept_check",
        conceptId: "limits-continuity",
        conceptIntro: "Continuity at a point requires lim = f(a).",
        prompt:
          "A function f is defined at x = 3 with f(3) = 5, but lim x→3 f(x) = 4. Is f continuous at x = 3? Why or why not?",
        hints: ["For continuity, the limit must equal the function value."],
      },
    ],
  },
  {
    id: "calcab-gen-optimization",
    title: "Calculus AB — Related Rates & Optimization Generated Set",
    subject: "AP Calculus AB/BC",
    kind: "generated",
    description:
      "Generated word problems on how fast quantities change and maximizing/minimizing functions.",
    generationNote: "Original items aligned with AP Calculus AB CED Units 4–5.",
    estimatedMinutes: 30,
    tags: ["related rates", "optimization", "generated"],
    items: [
      {
        id: "calc-opt-1",
        format: "frq_half",
        conceptId: "related-rates",
        conceptIntro: "Differentiate with respect to time and substitute known rates.",
        prompt:
          "A spherical balloon is inflated so that its volume increases at 12π cm³/s. Find dr/dt when r = 3 cm.",
        visibleSteps: [
          "V = (4/3)πr³. Differentiate with respect to t.",
          "Substitute dV/dt = 12π and r = 3.",
        ],
        blankSteps: ["dr/dt = ______ cm/s"],
        hints: ["L1: dV/dt = 4πr² dr/dt.", "L2: Solve for dr/dt."],
      },
      {
        id: "calc-opt-2",
        format: "concept_check",
        conceptId: "related-rates",
        conceptIntro: "Critical points occur where f′(x) = 0 or undefined.",
        prompt:
          "When finding the maximum of a continuous function on a closed interval, why must you check the endpoints as well as critical points?",
        hints: ["Extrema can occur at boundaries of the domain."],
      },
    ],
  },
  ...microQuestionnaires,
  ...macroQuestionnaires,
  ...physics2Questionnaires,
  ...statsQuestionnaires,
];

export function getQuestionnaireById(id: string): Questionnaire | undefined {
  return questionnaires.find((q) => q.id === id);
}

export function getQuestionnairesBySubject(subject: string): Questionnaire[] {
  return questionnaires.filter((q) => q.subject === subject);
}

export function getSubjectsFromQuestionnaires(): string[] {
  return [...new Set(questionnaires.map((q) => q.subject))];
}
