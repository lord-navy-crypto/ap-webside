import { Concept, Formula, KeyConceptGuide, Questionnaire } from "@/lib/types";

/** AP Microeconomics — Units 1–6 (College Board CED). */
export const microConcepts: Concept[] = [
  {
    id: "micro-basic-concepts",
    title: "Basic Economic Concepts",
    subject: "AP Microeconomics",
    summary:
      "Scarcity forces choice. Opportunity cost is the value of the next-best alternative. Marginal analysis compares MB and MC at the margin.",
    keyPoints: [
      "Optimal decision when MB = MC (compare at the margin, not totals).",
      "PPC: inside = inefficient, on curve = efficient, outside = unattainable; outward shift = growth.",
      "Comparative advantage: lower opportunity cost; absolute advantage ≠ comparative advantage.",
      "Mutually beneficial trade requires terms of trade between both parties' opportunity costs.",
    ],
    commonMistakes: [
      "Confusing absolute advantage with comparative advantage.",
      "Using total benefit/cost instead of marginal benefit/cost.",
      "Assuming any trade is win-win without checking opportunity costs.",
    ],
    example:
      "If producing 1 more widget costs 2 gadgets forgone (MC = 2 gadgets), produce only when MB of that widget ≥ 2 gadgets.",
  },
  {
    id: "micro-supply-demand",
    title: "Supply & Demand",
    subject: "AP Microeconomics",
    summary:
      "Markets reach equilibrium where quantity demanded equals quantity supplied. Price changes move along curves; non-price factors shift curves.",
    keyPoints: [
      "Price change → movement along curve; non-price factor → curve shift.",
      "Binding price ceiling below equilibrium → shortage; binding price floor above → surplus.",
      "Tax wedge: buyer pays more than seller receives; burden falls more on the inelastic side.",
      "Elasticity Ed = %ΔQd / %ΔP; TR rises when elastic demand price falls, falls when inelastic.",
      "Consumer surplus + producer surplus = total surplus (triangle areas: ½ × base × height).",
    ],
    commonMistakes: [
      "Shifting both curves when only one factor changed.",
      "Saying a price ceiling always causes shortage (only if binding).",
      "Forgetting cross-price elasticity sign: positive = substitutes, negative = complements.",
    ],
    example:
      "If Ed = −2 (elastic), a 10% price cut raises quantity demanded ~20% and total revenue increases.",
  },
  {
    id: "micro-production-costs",
    title: "Production, Costs & Perfect Competition",
    subject: "AP Microeconomics",
    summary:
      "Firms face diminishing marginal product in the short run. Cost curves relate to production; perfectly competitive firms are price takers with P = MR = D.",
    keyPoints: [
      "MP = ΔTP / Δinput; eventually MP falls (diminishing marginal returns).",
      "TC = FC + VC; MC = ΔTC / ΔQ; MC crosses AVC and ATC at their minimums.",
      "Profit max: MR = MC; short-run shutdown if P < AVC; long-run exit if P < ATC.",
      "Long-run competitive equilibrium: P = MC = ATC (zero economic profit).",
      "Profit π = TR − TC = (P − ATC) × Q.",
    ],
    commonMistakes: [
      "Confusing accounting profit with economic profit (economic includes opportunity cost).",
      "Using MC = MR to find price directly in perfect competition (price is given).",
      "Forgetting shutdown rule uses AVC, not ATC.",
    ],
    example:
      "A competitive firm with P = $10, ATC = $8, AVC = $6 earns positive profit and should stay open in the short run.",
  },
  {
    id: "micro-imperfect-competition",
    title: "Imperfect Competition",
    subject: "AP Microeconomics",
    summary:
      "Monopolies set MR = MC then read price from demand; P > MC causes deadweight loss. Monopolistic competition has differentiation and excess capacity; oligopolies show strategic interdependence.",
    keyPoints: [
      "Monopoly: single seller, barriers to entry, downward-sloping D; profit max MR = MC → Q, then P from D.",
      "Price discrimination requires market power and ability to separate markets.",
      "Monopolistic competition: free entry/exit → long-run zero economic profit, excess capacity.",
      "Oligopoly: prisoners' dilemma, collusion vs. Nash equilibrium.",
    ],
    commonMistakes: [
      "Setting P = MC for a monopolist (that's perfect competition).",
      "Assuming monopolies always earn profit (can break even or lose in long run with regulation).",
      "Treating oligopoly as independent decision-making.",
    ],
    example:
      "A monopolist finds Q where MR = MC = $4, then charges P = $9 from the demand curve — P > MC.",
  },
  {
    id: "micro-factor-markets",
    title: "Factor Markets",
    subject: "AP Microeconomics",
    summary:
      "Competitive firms hire labor until MRP = MRC (= wage). Labor demand is derived from product demand and marginal product.",
    keyPoints: [
      "MRP = MP_L × MR; hire until MRP = MRC = w in perfect competition.",
      "Labor supply, wage determination, and binding minimum wage can create surplus (unemployment).",
    ],
    commonMistakes: [
      "Confusing MRP with MP alone (need MR for imperfect competition).",
      "Assuming minimum wage always reduces employment (depends on starting equilibrium).",
    ],
    example:
      "If the 4th worker adds $15/hr to revenue and wage is $12/hr, hire that worker (MRP > w).",
  },
  {
    id: "micro-market-failure",
    title: "Market Failure & Government",
    subject: "AP Microeconomics",
    summary:
      "Externalities, public goods, common resources, and asymmetric information cause inefficient market outcomes. Social optimum: SMB = SMC.",
    keyPoints: [
      "Negative externality: SMC > PMC → overproduction; positive externality: SMB > PMB → underproduction.",
      "Policies: Pigouvian tax/subsidy, tradable permits, regulation.",
      "Public goods: non-rival, non-excludable → free-rider problem.",
      "Common resources: rival, non-excludable → tragedy of the commons.",
      "Asymmetric information: adverse selection (before), moral hazard (after).",
    ],
    commonMistakes: [
      "Using PMC = PMB for social optimum (should be SMC = SMB).",
      "Calling any government-provided good a public good.",
    ],
    example:
      "A factory's pollution creates SMC > PMC; a Pigouvian tax shifts supply toward the social optimum.",
  },
];

export const microFormulas: Formula[] = [
  {
    id: "micro-mb-mc",
    subject: "AP Microeconomics",
    unit: "Unit 1: Basic Concepts",
    name: "Optimal marginal decision",
    expression: "MB = MC",
    variables: "MB = marginal benefit, MC = marginal cost",
    whenToUse: "Find optimal quantity or activity level at the margin.",
    relatedConceptId: "micro-basic-concepts",
    sourceNote: "AP Microeconomics CED (College Board)",
  },
  {
    id: "micro-ed",
    subject: "AP Microeconomics",
    unit: "Unit 2: Supply & Demand",
    name: "Price elasticity of demand",
    expression: "E_d = (%ΔQ_d) / (%ΔP)",
    variables: "E_d < 0 for normal goods; |E_d| > 1 elastic, < 1 inelastic",
    whenToUse: "Predict quantity response to price changes; analyze tax burden and TR.",
    relatedConceptId: "micro-supply-demand",
    sourceNote: "AP Microeconomics CED",
  },
  {
    id: "micro-es",
    subject: "AP Microeconomics",
    unit: "Unit 2: Supply & Demand",
    name: "Price elasticity of supply",
    expression: "E_s = (%ΔQ_s) / (%ΔP)",
    variables: "E_s > 0; larger |E_s| means more responsive supply",
    whenToUse: "Predict producer response to price changes.",
    relatedConceptId: "micro-supply-demand",
    sourceNote: "AP Microeconomics CED",
  },
  {
    id: "micro-ei",
    subject: "AP Microeconomics",
    unit: "Unit 2: Supply & Demand",
    name: "Income elasticity of demand",
    expression: "E_I = (%ΔQ_d) / (%ΔIncome)",
    variables: "E_I > 0 normal good; E_I < 0 inferior good",
    whenToUse: "Classify goods and predict demand shifts from income changes.",
    relatedConceptId: "micro-supply-demand",
    sourceNote: "AP Microeconomics CED",
  },
  {
    id: "micro-exy",
    subject: "AP Microeconomics",
    unit: "Unit 2: Supply & Demand",
    name: "Cross-price elasticity",
    expression: "E_xy = (%ΔQ_x) / (%ΔP_y)",
    variables: "E_xy > 0 substitutes; E_xy < 0 complements",
    whenToUse: "Identify relationship between two goods.",
    relatedConceptId: "micro-supply-demand",
    sourceNote: "AP Microeconomics CED",
  },
  {
    id: "micro-tr",
    subject: "AP Microeconomics",
    unit: "Unit 2: Supply & Demand",
    name: "Total revenue",
    expression: "TR = P × Q",
    variables: "P = price, Q = quantity sold",
    whenToUse: "Analyze effect of price changes on firm revenue.",
    relatedConceptId: "micro-supply-demand",
    sourceNote: "AP Microeconomics CED",
  },
  {
    id: "micro-ts",
    subject: "AP Microeconomics",
    unit: "Unit 2: Supply & Demand",
    name: "Total surplus",
    expression: "TS = CS + PS",
    variables: "CS = consumer surplus, PS = producer surplus",
    whenToUse: "Evaluate market efficiency; measure deadweight loss.",
    relatedConceptId: "micro-supply-demand",
    sourceNote: "AP Microeconomics CED",
  },
  {
    id: "micro-mp",
    subject: "AP Microeconomics",
    unit: "Unit 3: Production & Costs",
    name: "Marginal product",
    expression: "MP = ΔTP / Δinput",
    variables: "TP = total product from additional input",
    whenToUse: "Short-run production; links to diminishing returns.",
    relatedConceptId: "micro-production-costs",
    sourceNote: "AP Microeconomics CED",
  },
  {
    id: "micro-tc",
    subject: "AP Microeconomics",
    unit: "Unit 3: Production & Costs",
    name: "Total cost",
    expression: "TC = FC + VC",
    variables: "FC = fixed cost, VC = variable cost",
    whenToUse: "Decompose costs; find AFC, AVC, ATC.",
    relatedConceptId: "micro-production-costs",
    sourceNote: "AP Microeconomics CED",
  },
  {
    id: "micro-mc",
    subject: "AP Microeconomics",
    unit: "Unit 3: Production & Costs",
    name: "Marginal cost",
    expression: "MC = ΔTC / ΔQ",
    variables: "Cost of producing one more unit",
    whenToUse: "Profit-max output with MR; crosses AVC/ATC at minimums.",
    relatedConceptId: "micro-production-costs",
    sourceNote: "AP Microeconomics CED",
  },
  {
    id: "micro-profit",
    subject: "AP Microeconomics",
    unit: "Unit 3: Perfect Competition",
    name: "Economic profit",
    expression: "π = TR − TC = (P − ATC) × Q",
    variables: "π = profit; include opportunity costs in economic profit",
    whenToUse: "Evaluate firm performance; compare to shutdown/exit rules.",
    relatedConceptId: "micro-production-costs",
    sourceNote: "AP Microeconomics CED",
  },
  {
    id: "micro-mrp",
    subject: "AP Microeconomics",
    unit: "Unit 5: Factor Markets",
    name: "Marginal revenue product of labor",
    expression: "MRP = MP_L × MR",
    variables: "MP_L = marginal product of labor; MR = marginal revenue",
    whenToUse: "Labor demand; hire until MRP = wage in perfect competition.",
    relatedConceptId: "micro-factor-markets",
    sourceNote: "AP Microeconomics CED",
  },
  {
    id: "micro-smb-smc",
    subject: "AP Microeconomics",
    unit: "Unit 6: Market Failure",
    name: "Socially optimal allocation",
    expression: "SMB = SMC",
    variables: "SMB = social marginal benefit, SMC = social marginal cost",
    whenToUse: "Efficient quantity with externalities; compare to market PMC = PMB.",
    relatedConceptId: "micro-market-failure",
    sourceNote: "AP Microeconomics CED",
  },
];

export const microGuides: KeyConceptGuide[] = [
  {
    id: "guide-micro-supply-demand",
    title: "Supply & Demand Equilibrium",
    subject: "AP Microeconomics",
    category: "ap_content",
    introduction:
      "Supply and demand determine equilibrium price and quantity. Always separate a movement along a curve (price change) from a shift (non-price factor). Draw the graph, mark equilibrium, then analyze policy or shocks.",
    howToUseAI: [
      "Ask AI: “Explain why a binding price ceiling causes shortage using a graph description.”",
      "Ask AI to generate a new elasticity scenario with different numbers.",
      "Ask AI to check whether you shifted the correct curve for an income increase.",
    ],
    conceptQuestions: [
      {
        id: "gmicro-sd1",
        prompt: "Why does a tax create a wedge between buyer price and seller price?",
        hints: ["Tax raises cost to sellers and/or lowers net price received; burden splits by elasticity."],
      },
    ],
  },
  {
    id: "guide-micro-monopoly",
    title: "Monopoly vs. Perfect Competition",
    subject: "AP Microeconomics",
    category: "ap_content",
    introduction:
      "Perfect competitors take price as given (P = MR). Monopolists face downward-sloping demand, so MR < P. Always find Q with MR = MC, then read P from demand — never set P = MC for a monopolist.",
    howToUseAI: [
      "Ask AI to walk through MR = MC → Q → P steps without giving final numbers.",
      "Generate a deadweight-loss shading exercise description.",
    ],
    conceptQuestions: [
      {
        id: "gmicro-mono1",
        prompt: "Why is MR below demand for a monopolist?",
        hints: ["To sell one more unit, price must fall on all units sold (for uniform pricing)."],
      },
    ],
  },
];

export const microQuestionnaires: Questionnaire[] = [
  {
    id: "micro-gen-supply-demand",
    title: "Micro — Supply & Demand Generated Set",
    subject: "AP Microeconomics",
    kind: "generated",
    description:
      "Generated practice on equilibrium, shifts, elasticity, and surplus. Hints only.",
    generationNote: "Original items aligned with AP Microeconomics CED Units 1–2.",
    estimatedMinutes: 25,
    tags: ["supply", "demand", "elasticity", "generated"],
    items: [
      {
        id: "micro-sd-1",
        format: "concept_check",
        conceptId: "micro-supply-demand",
        conceptIntro: "Binding price ceiling: set below equilibrium → shortage.",
        prompt:
          "A city sets a rent ceiling below the free-market equilibrium rent. What happens to quantity demanded, quantity supplied, and whether the ceiling is binding?",
        hints: [
          "Qd rises and Qs falls when ceiling is below equilibrium.",
          "Shortage = Qd − Qs at the controlled price.",
        ],
      },
      {
        id: "micro-sd-2",
        format: "frq_half",
        conceptId: "micro-supply-demand",
        conceptIntro: "Total revenue and elasticity: elastic → price cut raises TR.",
        prompt:
          "Demand for a good has |E_d| = 3. The firm lowers price by 5%. Predict the direction of change in total revenue and explain using elasticity.",
        visibleSteps: [
          "|E_d| > 1 means demand is elastic.",
          "Relate %ΔQ to %ΔP using Ed.",
        ],
        blankSteps: [
          "Quantity changes by about ______%",
          "Total revenue will ______ (rise/fall)",
        ],
        hints: ["L1: %ΔQ ≈ Ed × %ΔP in magnitude.", "L2: Elastic + price down → TR up."],
      },
    ],
  },
  {
    id: "micro-gen-costs",
    title: "Micro — Costs & Perfect Competition Generated Set",
    subject: "AP Microeconomics",
    kind: "generated",
    description: "Generated practice on MC, profit max, shutdown, and long-run equilibrium.",
    generationNote: "Original items aligned with AP Microeconomics CED Unit 3.",
    estimatedMinutes: 25,
    tags: ["costs", "perfect competition", "generated"],
    items: [
      {
        id: "micro-cost-1",
        format: "concept_check",
        conceptId: "micro-production-costs",
        conceptIntro: "Shutdown rule: P < AVC in the short run.",
        prompt:
          "A competitive firm has P = $5, AVC = $6, ATC = $8. Should it produce in the short run? Explain.",
        hints: ["Compare P to AVC for shutdown; P < ATC means loss but may still produce if P ≥ AVC."],
      },
    ],
  },
];
