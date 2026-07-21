import { Concept, PracticeQuestion } from "@/lib/types";

export const concepts: Concept[] = [
  {
    id: "kinematics-basics",
    title: "Kinematics Basics",
    subject: "AP Physics 1",
    summary:
      "Kinematics describes motion using displacement, velocity, and acceleration without focusing on forces.",
    keyPoints: [
      "Displacement is a vector; distance is a scalar.",
      "Average velocity = Δx / Δt.",
      "Constant acceleration: v = v₀ + at and x = x₀ + v₀t + ½at².",
    ],
    commonMistakes: [
      "Mixing up speed and velocity.",
      "Using equations without checking constant acceleration.",
      "Forgetting direction signs in 1D motion.",
    ],
    example:
      "A car starts from rest and accelerates at 2 m/s² for 5 s. Find final velocity: v = 0 + (2)(5) = 10 m/s.",
  },
  {
    id: "newtons-second-law",
    title: "Newton's Second Law",
    subject: "AP Physics 1",
    summary: "The net force on an object equals mass times acceleration: F_net = ma.",
    keyPoints: [
      "Draw a free-body diagram first.",
      "Use component form: ΣF_x = ma_x.",
      "Net force causes acceleration, not motion by itself.",
    ],
    commonMistakes: [
      "Including only one force instead of net force.",
      "Assuming F = ma always uses total force in one direction incorrectly.",
      "Ignoring friction or tension in multi-force problems.",
    ],
    example:
      "A 4 kg block pulled with 12 N net force has a = F/m = 12/4 = 3 m/s².",
  },
  {
    id: "derivatives-basics",
    title: "Derivatives Basics",
    subject: "AP Calculus AB",
    summary:
      "A derivative measures instantaneous rate of change and slope of a tangent line.",
    keyPoints: [
      "f′(x) = lim(h→0) [f(x+h) − f(x)] / h.",
      "Power rule: d/dx(xⁿ) = nxⁿ⁻¹.",
      "Derivative of position gives velocity.",
    ],
    commonMistakes: [
      "Forgetting the chain rule on composite functions.",
      "Confusing average rate of change with instantaneous rate.",
      "Dropping constants incorrectly.",
    ],
    example: "If f(x) = x³, then f′(x) = 3x².",
  },
];

export const practiceQuestions: PracticeQuestion[] = [
  {
    id: "p1-001",
    subject: "AP Physics 1",
    topic: "Kinematics",
    question:
      "A ball is dropped from rest from a height of 20 m. Ignore air resistance. Take g = 10 m/s². How long does it take to hit the ground?",
    visibleSteps: [
      "Known: v₀ = 0, y₀ = 20 m, a = −g = −10 m/s² (choose downward positive or upward positive consistently).",
      "Choose equation linking displacement, initial velocity, acceleration, and time.",
      "Substitute values and solve for t.",
    ],
    blankSteps: [
      "Selected equation: ______________________",
      "Final time t = ______ s (you solve before checking reasoning)",
    ],
    hints: [
      "L1: This is vertical motion with constant acceleration.",
      "L2: Try an equation with Δy, v₀, a, and t without needing final velocity.",
      "L3: AI may make arithmetic errors — verify your setup first.",
    ],
  },
  {
    id: "p1-002",
    subject: "AP Physics 1",
    topic: "Forces",
    question:
      "A 5 kg box on a frictionless horizontal surface is pushed with a horizontal force of 20 N. Find the acceleration.",
    visibleSteps: [
      "Draw free-body diagram for the box.",
      "Identify net horizontal force.",
      "Use Newton's second law.",
    ],
    blankSteps: [
      "Net horizontal force = ______ N",
      "Acceleration a = ______ m/s²",
    ],
    hints: [
      "L1: Frictionless means no horizontal friction force.",
      "L2: On a flat surface, weight and normal force are vertical.",
      "L3: Use a = F_net / m after confirming net force.",
    ],
  },
];

export function getConceptById(id: string): Concept | undefined {
  return concepts.find((c) => c.id === id);
}
