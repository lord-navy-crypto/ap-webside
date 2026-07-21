import { KeyConceptGuide } from "@/lib/types";

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
];

export function getGuideById(id: string): KeyConceptGuide | undefined {
  return keyConceptGuides.find((g) => g.id === id);
}

export function getGuidesBySubject(subject: string): KeyConceptGuide[] {
  return keyConceptGuides.filter((g) => g.subject === subject);
}
