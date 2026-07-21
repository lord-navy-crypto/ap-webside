import { Concept, PracticeQuestion } from "@/lib/types";
import { macroConcepts } from "@/data/ap-macro";
import { microConcepts } from "@/data/ap-micro";
import { physics2Concepts } from "@/data/ap-physics2";
import { expandedApConcepts } from "@/data/ap-expanded";
import managed from "@/data/managed-content.json";

const builtInConcepts: Concept[] = [
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
    subject: "AP Calculus AB/BC",
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
  {
    id: "energy-work",
    title: "Work & Energy",
    subject: "AP Physics 1",
    summary:
      "Energy methods track how work transfers energy. Kinetic energy K = ½mv²; gravitational PE U_g = mgh near Earth.",
    keyPoints: [
      "Work W = Fd cos θ (constant force); W_net = ΔK.",
      "Conservative forces allow energy bar charts: K + U = constant (no non-conservative work).",
      "Power P = ΔE/Δt measures rate of energy transfer.",
    ],
    commonMistakes: [
      "Using mgh without consistent zero level for h.",
      "Forgetting friction does negative work and removes mechanical energy.",
      "Mixing up work done BY a force vs ON an object.",
    ],
    example:
      "A 2 kg book lifted 3 m gains ΔU_g = mgh = (2)(9.8)(3) ≈ 59 J of gravitational PE.",
  },
  {
    id: "momentum",
    title: "Linear Momentum & Impulse",
    subject: "AP Physics 1",
    summary:
      "Momentum p = mv is conserved in isolated systems. Impulse J = FΔt = Δp links force over time to momentum change.",
    keyPoints: [
      "Closed system with no external impulse ⇒ total p conserved.",
      "Impulse equals area under F–t graph.",
      "Elastic vs inelastic collisions differ in whether KE is conserved.",
    ],
    commonMistakes: [
      "Using momentum conservation when external forces (e.g. friction) are significant.",
      "Treating momentum as scalar instead of vector.",
      "Assuming all collisions conserve kinetic energy.",
    ],
    example:
      "A 0.5 kg ball changes velocity from +4 m/s to −2 m/s: Δp = m(v_f − v_i) = 0.5(−2 − 4) = −3 kg·m/s.",
  },
  {
    id: "integrals-basics",
    title: "Integrals & FTC",
    subject: "AP Calculus AB/BC",
    summary:
      "Integration accumulates change. The Fundamental Theorem connects antiderivatives to definite integrals.",
    keyPoints: [
      "∫ₐᵇ f(x) dx = F(b) − F(a) where F′ = f.",
      "Definite integral = signed area under curve (above x-axis positive).",
      "∫ xⁿ dx = xⁿ⁺¹/(n+1) + C for n ≠ −1.",
    ],
    commonMistakes: [
      "Forgetting +C in indefinite integrals.",
      "Wrong antiderivative sign or exponent.",
      "Confusing average value with average rate of change.",
    ],
    example: "∫₀² 3x² dx = [x³]₀² = 8 − 0 = 8.",
  },
  {
    id: "rotation",
    title: "Torque & Rotational Motion",
    subject: "AP Physics 1",
    summary:
      "Rotation extends Newton's laws to spinning objects. Torque τ = rF sin θ causes angular acceleration α = τ_net/I.",
    keyPoints: [
      "Torque depends on force, lever arm, and angle.",
      "Rotational inertia I depends on mass distribution.",
      "Rotational KE = ½Iω²; angular momentum L = Iω is conserved with no net external torque.",
    ],
    commonMistakes: [
      "Using linear equations directly for angular motion.",
      "Forgetting τ and α are vectors along the rotation axis.",
      "Confusing rolling KE with only translational KE.",
    ],
    example: "A wheel with I = 0.5 kg·m² and τ = 2 N·m has α = 2/0.5 = 4 rad/s².",
  },
  {
    id: "shm",
    title: "Simple Harmonic Motion",
    subject: "AP Physics 1",
    summary:
      "SHM is periodic motion where restoring force is proportional to displacement. Periods of spring and pendulum depend on system properties.",
    keyPoints: [
      "Mass-spring period: T = 2π√(m/k).",
      "Simple pendulum period: T = 2π√(ℓ/g) (small angles).",
      "Energy oscillates between kinetic and potential.",
    ],
    commonMistakes: [
      "Assuming pendulum period depends on mass.",
      "Forgetting small-angle approximation for pendulum formula.",
      "Confusing frequency (1/T) with angular frequency (2π/T).",
    ],
    example: "A 1 kg mass on k = 4 N/m spring has T = 2π√(1/4) = π s.",
  },
  {
    id: "fluids",
    title: "Fluids",
    subject: "AP Physics 1",
    summary:
      "Ideal fluids in filled pipes: density, pressure, buoyancy, continuity, and Bernoulli. AP assumes non-viscous, incompressible flow unless stated otherwise.",
    keyPoints: [
      "Density ρ = m/V; pressure P = F/A; hydrostatic ΔP = ρgΔh.",
      "Buoyant force F_B = ρ_fluid V_displaced g; compare object and fluid density for float/sink.",
      "Continuity: A₁v₁ = A₂v₂ — smaller area means faster flow speed.",
      "Bernoulli: P + ½ρv² + ρgy = constant along a streamline (steady, ideal fluid).",
      "Torricelli: v = √(2gh) for efflux speed from height h below surface.",
      "Use ΣF = ma with buoyancy for submerged objects (e.g. F_B − mg = ma).",
    ],
    commonMistakes: [
      "Confusing pressure with force.",
      "Applying Bernoulli across different streamlines or with viscosity.",
      "Forgetting buoyant force depends on displaced fluid volume, not object mass.",
      "Using Poiseuille/viscosity formulas (not AP Physics 1 core).",
    ],
    example:
      "Water leaves a tank through a hole h = 2 m below the surface: v = √(2gh) = √(2 × 9.8 × 2) ≈ 6.3 m/s.",
  },
  {
    id: "limits-continuity",
    title: "Limits & Continuity",
    subject: "AP Calculus AB/BC",
    summary:
      "Limits describe function behavior near a point. Continuity requires the limit to equal the function value.",
    keyPoints: [
      "lim x→a f(x) = L means f(x) approaches L as x approaches a.",
      "A function is continuous at a if lim = f(a).",
      "Intermediate Value Theorem: if f is continuous on [a,b] and k is between f(a) and f(b), then f(c)=k for some c in (a,b).",
    ],
    commonMistakes: [
      "Substituting into indeterminate forms like 0/0 without simplifying.",
      "Ignoring one-sided limits at piecewise boundaries.",
      "Confusing limit value with function value at a hole.",
    ],
    example: "lim x→2 (x²−4)/(x−2) = lim x→2 (x+2) = 4.",
  },
  {
    id: "related-rates",
    title: "Related Rates & Optimization",
    subject: "AP Calculus AB/BC",
    summary:
      "Related rates use derivatives to connect changing quantities. Optimization finds maxima/minima using critical points and endpoints.",
    keyPoints: [
      "Differentiate an equation with respect to time t.",
      "Optimization: find critical points where f′(x)=0 or undefined, then test endpoints.",
      "First/second derivative tests classify extrema and concavity.",
    ],
    commonMistakes: [
      "Forgetting to apply chain rule when differentiating with respect to t.",
      "Misidentifying what is constant vs. changing in related rates.",
      "In optimization, ignoring the domain or endpoints.",
    ],
    example:
      "A sphere's volume V = (4/3)πr³. dV/dt = 4πr² dr/dt, so if r=3 and dV/dt=36π, dr/dt = 1.",
  },
  {
    id: "diff-eqs",
    title: "Differential Equations",
    subject: "AP Calculus AB/BC",
    summary:
      "Differential equations relate a function to its derivatives. AP Calculus AB focuses on separable equations and slope fields.",
    keyPoints: [
      "Separable equations: dy/dx = f(x)g(y) → separate and integrate.",
      "Slope fields sketch the direction of solution curves.",
      "Exponential growth/decay: dy/dt = ky ⇒ y = y₀e^(kt).",
    ],
    commonMistakes: [
      "Forgetting to include +C and solve for the constant using initial conditions.",
      "Dividing by g(y) without checking if g(y)=0 gives solutions.",
      "Confusing general solution with particular solution.",
    ],
    example: "dy/dx = 2x/y → ∫ y dy = ∫ 2x dx → y²/2 = x² + C.",
  },
  ...microConcepts,
  ...macroConcepts,
  ...physics2Concepts,
  ...expandedApConcepts,
];

export const concepts: Concept[] = [
  ...builtInConcepts,
  ...((managed.concepts || []) as Concept[]),
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
  {
    id: "p1-003",
    subject: "AP Physics 1",
    topic: "Energy",
    question:
      "A 1.5 kg cart at 4 m/s on a frictionless track. Find its kinetic energy.",
    visibleSteps: [
      "Recall K = ½mv².",
      "Substitute m and v (speed, not velocity sign for K).",
    ],
    blankSteps: ["K = ______ J"],
    hints: [
      "L1: K uses speed squared.",
      "L2: Units: kg · (m/s)² = joules.",
    ],
  },
  {
    id: "p1-004",
    subject: "AP Physics 1",
    topic: "Momentum",
    question:
      "A 2 kg object moving at 3 m/s collides and stops. What is the magnitude of its momentum change?",
    visibleSteps: [
      "Define initial momentum p_i = mv_i.",
      "Final momentum p_f = 0.",
      "Find |Δp| = |p_f − p_i|.",
    ],
    blankSteps: ["|Δp| = ______ kg·m/s"],
    hints: [
      "L1: Momentum is a vector; magnitude of change is asked.",
      "L2: Δp = m(v_f − v_i) with signs.",
    ],
  },
  {
    id: "calc-001",
    subject: "AP Calculus AB/BC",
    topic: "Integrals",
    question: "Evaluate ∫₀¹ (2x + 1) dx.",
    visibleSteps: [
      "Find antiderivative of 2x + 1.",
      "Apply FTC: F(1) − F(0).",
    ],
    blankSteps: [
      "Antiderivative F(x) = ____________________",
      "Definite integral = ______",
    ],
    hints: [
      "L1: ∫2x dx = x²; ∫1 dx = x.",
      "L2: Don't forget to evaluate at both bounds.",
    ],
  },
  {
    id: "p1-005",
    subject: "AP Physics 1",
    topic: "Rotational Motion",
    question:
      "A disk with rotational inertia 0.4 kg·m² experiences a net torque of 2.0 N·m. Find its angular acceleration.",
    visibleSteps: ["Recall α = τ_net / I.", "Substitute τ_net and I."],
    blankSteps: ["α = ______ rad/s²"],
    hints: [
      "L1: This is the rotational version of Newton's second law.",
      "L2: Units of I are kg·m², torque is N·m.",
    ],
  },
  {
    id: "p1-006",
    subject: "AP Physics 1",
    topic: "Fluids",
    question:
      "A 0.005 m³ block is fully submerged in water (ρ = 1000 kg/m³). What is the magnitude of the buoyant force? Take g = 10 m/s².",
    visibleSteps: [
      "Recall Archimedes' principle: F_b = ρVg.",
      "V displaced = V block because fully submerged.",
    ],
    blankSteps: ["F_b = ______ N"],
    hints: [
      "L1: Buoyant force equals weight of displaced fluid.",
      "L2: ρ is the fluid density, not the block density.",
    ],
  },
  {
    id: "calc-002",
    subject: "AP Calculus AB/BC",
    topic: "Limits",
    question: "Find lim x→3 (x² − 9)/(x − 3).",
    visibleSteps: [
      "Direct substitution gives 0/0, so factor the numerator.",
      "Cancel the common factor and re-evaluate the limit.",
    ],
    blankSteps: ["Limit = ______"],
    hints: [
      "L1: x² − 9 is a difference of squares.",
      "L2: After canceling, substitute x = 3.",
    ],
  },
  {
    id: "calc-003",
    subject: "AP Calculus AB/BC",
    topic: "Related Rates",
    question:
      "A spherical balloon is inflated so that its volume increases at 8π cm³/s. Find dr/dt when r = 2 cm.",
    visibleSteps: [
      "V = (4/3)πr³. Differentiate with respect to t.",
      "Substitute dV/dt = 8π and r = 2.",
    ],
    blankSteps: ["dr/dt = ______ cm/s"],
    hints: [
      "L1: Use chain rule: dV/dt = dV/dr · dr/dt.",
      "L2: dV/dr = 4πr².",
    ],
  },
];

export function getConceptById(id: string): Concept | undefined {
  return concepts.find((c) => c.id === id);
}
