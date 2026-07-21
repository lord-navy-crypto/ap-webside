import { KeyConceptGuide } from "@/lib/types";
import { macroGuides } from "@/data/ap-macro";
import { microGuides } from "@/data/ap-micro";
import { physics2Guides } from "@/data/ap-physics2";

/**
 * Key concept introductions + concept-check questions
 * Includes AP content AND "how to use AI for AP"
 */

export const keyConceptGuides: KeyConceptGuide[] = [
  {
    id: "guide-kinematics",
    title: "Kinematics (Motion Without Forces)",
    subject: "AP Physics 1",
    category: "ap_content",
    introduction:
      "Kinematics is the language of motion: position, displacement, velocity, acceleration, and time. You describe how objects move before asking why (forces). Always pick a positive direction, list knowns, and choose one constant-acceleration equation that matches your unknowns.",
    howToUseAI: [
      "Ask AI: “Explain the difference between velocity and speed with a walking example.”",
      "Ask AI: “Check whether my chosen equation uses the variables I know.” (paste your setup, not “solve it”).",
      "Ask AI to generate a similar practice problem with different numbers (generated set).",
      "Do NOT ask AI for the final numeric answer before you attempt.",
    ],
    conceptQuestions: [
      {
        id: "gk1",
        prompt: "Why must you choose a positive direction before using kinematics equations?",
        hints: ["Signs encode direction.", "Inconsistent signs break Δx and a."],
      },
      {
        id: "gk2",
        prompt: "When is x = v₀t + ½at² a good first choice?",
        hints: ["When a is constant and you know v₀, a, t (or seek x)."],
      },
    ],
  },
  {
    id: "guide-newton2",
    title: "Newton's Second Law",
    subject: "AP Physics 1",
    category: "ap_content",
    introduction:
      "Newton’s second law says net force equals mass times acceleration: F_net = ma. The hard part is finding net force: draw a free-body diagram, resolve components, then write ΣF = ma for each axis.",
    howToUseAI: [
      "Upload or describe your FBD and ask: “Which forces might I be missing?”",
      "Ask AI to narrate a step checklist for incline problems — then solve yourself.",
      "Use AI image tools to sketch an FBD for study notes, then verify every arrow yourself.",
    ],
    conceptQuestions: [
      {
        id: "gn1",
        prompt: "If an object moves at constant velocity, what is F_net?",
        hints: ["Constant velocity ⇒ a = 0 ⇒ F_net = 0."],
      },
    ],
  },
  {
    id: "guide-derivatives",
    title: "Derivatives as Instantaneous Rate",
    subject: "AP Calculus AB",
    category: "ap_content",
    introduction:
      "A derivative f′(x) is the instantaneous rate of change of f at x, and the slope of the tangent line. Algebraically you use limit definitions and rules (power, product, chain). Conceptually you connect derivatives to velocity, growth, and sensitivity.",
    howToUseAI: [
      "Ask AI to explain power rule with two worked patterns, then hide the last line for you to finish.",
      "Ask AI: “Generate 5 similar power-rule drills with no answers.”",
      "Ask AI to spot chain-rule mistakes in YOUR work.",
    ],
    conceptQuestions: [
      {
        id: "gd1",
        prompt: "What is the geometric meaning of f′(a)?",
        hints: ["Tangent slope at x = a."],
      },
    ],
  },
  {
    id: "guide-energy",
    title: "Work, Energy & Power",
    subject: "AP Physics 1",
    category: "ap_content",
    introduction:
      "Energy methods often replace force analysis: track K and U, use W_net = ΔK, and draw energy bar charts. Near Earth, U_g = mgh; springs store U_s = ½kx². Power tells how fast energy transfers.",
    howToUseAI: [
      "Ask AI to walk through an energy bar chart for a roller coaster — you fill in the numbers.",
      "Ask: “Which formula fits: work, KE, or PE?” given a word problem setup.",
      "Generate 3 original energy half-process problems with different heights/speeds.",
    ],
    conceptQuestions: [
      {
        id: "ge1",
        prompt: "When is mechanical energy (K + U) conserved?",
        hints: ["No non-conservative work (e.g. friction) doing net work on system."],
      },
      {
        id: "ge2",
        prompt: "Why does friction reduce mechanical energy?",
        hints: ["Friction does negative work; energy dissipates as thermal."],
      },
    ],
  },
  {
    id: "guide-momentum",
    title: "Momentum & Impulse",
    subject: "AP Physics 1",
    category: "ap_content",
    introduction:
      "Momentum p = mv helps analyze collisions and explosions. Impulse J = FΔt = Δp connects force applied over time to momentum change. In an isolated system, total momentum is conserved.",
    howToUseAI: [
      "Ask AI for a collision setup with two objects — you write conservation equation.",
      "Ask AI to explain elastic vs inelastic without solving numbers.",
      "Generate impulse problems from F–t graph descriptions.",
    ],
    conceptQuestions: [
      {
        id: "gm1",
        prompt: "Why must you treat momentum as a vector in 1D collisions?",
        hints: ["Signs encode direction; opposite velocities add in Δp."],
      },
    ],
  },
  {
    id: "guide-integrals",
    title: "Integrals & the Fundamental Theorem",
    subject: "AP Calculus AB",
    category: "ap_content",
    introduction:
      "Integration reverses differentiation and measures accumulated change. FTC Part 2 lets you evaluate ∫ₐᵇ f(x) dx = F(b) − F(a). On the AP exam you must know common antiderivatives — there is no formula sheet.",
    howToUseAI: [
      "Ask AI for 5 definite integrals using power rule only — no answers.",
      "Ask AI to explain signed area vs total area under a curve.",
      "Have AI check your antiderivative by differentiating your result.",
    ],
    conceptQuestions: [
      {
        id: "gi1",
        prompt: "What does ∫ₐᵇ f(x) dx represent when f is velocity?",
        hints: ["Net displacement over [a, b]."],
      },
      {
        id: "gi2",
        prompt: "Why do indefinite integrals need +C?",
        hints: ["Many antiderivatives differ by a constant."],
      },
    ],
  },
  {
    id: "guide-limits",
    title: "Limits & Continuity",
    subject: "AP Calculus AB",
    category: "ap_content",
    introduction:
      "Limits describe how a function behaves near a point. Continuity means the limit equals the function value. These ideas justify derivatives and integrals.",
    howToUseAI: [
      "Ask AI to generate 5 limit problems with removable discontinuities.",
      "Ask AI to explain the difference between f(a) and lim x→a f(x).",
      "Have AI check your factoring steps for 0/0 indeterminate forms.",
    ],
    conceptQuestions: [
      {
        id: "gl1",
        prompt: "Give an example where f(a) exists but lim x→a f(x) does not.",
        hints: ["Jump discontinuity in a piecewise function."],
      },
    ],
  },
  {
    id: "guide-optimization",
    title: "Related Rates & Optimization",
    subject: "AP Calculus AB",
    category: "ap_content",
    introduction:
      "Derivatives let you solve real-world problems: how fast one quantity changes when another changes, and how to maximize or minimize a function subject to constraints.",
    howToUseAI: [
      "Ask AI to narrate a related-rates checklist without solving the numbers.",
      "Generate 3 optimization problems and hide the final answer.",
      "Ask AI to spot whether you treated a variable as constant incorrectly.",
    ],
    conceptQuestions: [
      {
        id: "go1",
        prompt: "Why must you check endpoints in optimization?",
        hints: ["Extrema can occur at boundaries of the domain."],
      },
    ],
  },
  {
    id: "guide-rotation",
    title: "Torque & Rotational Motion",
    subject: "AP Physics 1",
    category: "ap_content",
    introduction:
      "Rotational motion extends Newton's laws to spinning objects. Torque causes angular acceleration, rotational inertia depends on mass distribution, and angular momentum is conserved when no net external torque acts.",
    howToUseAI: [
      "Ask AI to compare torque and force with a door-pushing example.",
      "Generate a rolling-without-slipping energy problem.",
      "Ask AI to sketch an L-conservation setup, then solve it yourself.",
    ],
    conceptQuestions: [
      {
        id: "gr1",
        prompt: "Why does a tightrope walker hold a long pole?",
        hints: ["Increases rotational inertia, slowing angular acceleration."],
      },
    ],
  },
  {
    id: "guide-shm",
    title: "Simple Harmonic Motion",
    subject: "AP Physics 1",
    category: "ap_content",
    introduction:
      "SHM is periodic motion where a restoring force proportional to displacement brings the system back to equilibrium. Springs and pendulums are the classic AP examples.",
    howToUseAI: [
      "Ask AI to explain why pendulum period does not depend on mass.",
      "Generate a spring-mass problem varying m and k.",
      "Ask AI to draw an energy vs. position graph for SHM.",
    ],
    conceptQuestions: [
      {
        id: "gshm1",
        prompt: "What happens to the period of a mass-spring system if k is quadrupled?",
        hints: ["T is inversely proportional to √k; period halves."],
      },
    ],
  },
  {
    id: "guide-fluids",
    title: "Fluids",
    subject: "AP Physics 1",
    category: "ap_content",
    introduction:
      "Fluids involve density, pressure, buoyancy, continuity, and Bernoulli. AP Physics 1 assumes ideal (non-viscous, incompressible) fluid in a filled pipe unless stated otherwise. Pressure increases with depth; buoyant force equals the weight of displaced fluid.",
    howToUseAI: [
      "Ask AI to explain why a steel ship floats but a steel block sinks.",
      "Generate a buoyancy problem with a partially submerged object.",
      "Ask AI to compare pressure at two depths in a fluid.",
      "Ask AI to explain why A₁v₁ = A₂v₂ means water speeds up in a narrow hose.",
    ],
    conceptQuestions: [
      {
        id: "gf1",
        prompt: "Does buoyant force depend on the object's mass or the displaced fluid's weight?",
        hints: ["Displaced fluid's weight (Archimedes' principle)."],
      },
    ],
  },
  {
    id: "guide-ai-explain",
    title: "Using AI to Explain AP Concepts",
    subject: "Study Skills / AI for AP",
    category: "ai_for_ap",
    introduction:
      "The best AP use of ChatGPT/Claude is as a Socratic explainer: it rephrases definitions, compares ideas, and asks you questions. It should not replace your attempt. A strong workflow is: attempt → ask for a hint → revise → ask for a concept check question.",
    howToUseAI: [
      "Prompt pattern: “I’m studying AP Physics 1 kinematics. Explain average vs instantaneous velocity like I’m a high schooler. Then ask me 2 check questions without answers.”",
      "Prompt pattern: “Here is my explanation of Newton 2. Point out unclear parts only.”",
      "Prompt pattern: “Give a half-process outline for this problem; hide the last two steps.”",
    ],
    conceptQuestions: [
      {
        id: "gai1",
        prompt: "Rewrite a bad AI prompt (“Solve this AP FRQ”) into a good learning prompt.",
        hints: ["Include your attempt, ask for strategy, forbid final answer."],
      },
      {
        id: "gai2",
        prompt: "Why should you verify AI explanations with your textbook?",
        hints: ["AI can invent formulas and confident wrong steps."],
      },
    ],
  },
  {
    id: "guide-ai-images",
    title: "Using AI to Generate Diagrams / Paintings for AP",
    subject: "Study Skills / AI for AP",
    category: "ai_for_ap",
    introduction:
      "AI image tools can create study visuals: free-body sketches, phase diagrams mood boards, or illustrated memory hooks. They are great for motivation and first drafts of diagrams — but physics arrows, axis labels, and math notation are often wrong. Treat images as drafts you correct.",
    howToUseAI: [
      "Ask for a simple labeled sketch of a block on an incline (then redraw correctly by hand).",
      "Generate a mnemonic illustration for “derivative = slope of tangent.”",
      "Never submit AI images as evidence of correct physics without checking.",
    ],
    conceptQuestions: [
      {
        id: "gimg1",
        prompt: "List two errors AI diagrams often make in physics.",
        hints: ["Missing friction, wrong normal force direction, bad axes."],
      },
    ],
  },
  {
    id: "guide-ai-generate-questions",
    title: "Using AI to Generate Simulated AP Questionnaires",
    subject: "Study Skills / AI for AP",
    category: "ai_for_ap",
    introduction:
      "You can ask ChatGPT or Claude to generate practice questionnaires for each subject. Keep them original (not copied past exams). Specify format: MCQ, half-process FRQ, concept check. Then paste results into data/questionnaires.ts with kind: \"generated\".",
    howToUseAI: [
      "Prompt: “Create 5 original AP Physics 1 kinematics half-process questions. Give visible steps + blank steps. Do not provide final answers.”",
      "Prompt: “Create a 10-item concept-check quiz on derivatives for AP Calculus AB. Hints only.”",
      "Prompt: “Vary numbers and contexts so it is not identical to common textbook examples.”",
    ],
    conceptQuestions: [
      {
        id: "ggen1",
        prompt: "What must you change when inserting AI-generated items into ReasonLab?",
        hints: ["Set kind to generated; add hints; remove any final answer keys from UI."],
      },
    ],
  },
  ...microGuides,
  ...macroGuides,
  ...physics2Guides,
];

export function getGuideById(id: string): KeyConceptGuide | undefined {
  return keyConceptGuides.find((g) => g.id === id);
}

export function getGuidesBySubject(subject: string): KeyConceptGuide[] {
  return keyConceptGuides.filter((g) => g.subject === subject);
}
