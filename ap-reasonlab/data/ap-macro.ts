import { Concept, Formula, KeyConceptGuide, Questionnaire } from "@/lib/types";

/** AP Macroeconomics — Units 1–6 (College Board CED). */
export const macroConcepts: Concept[] = [
  {
    id: "macro-basic-concepts",
    title: "Basic Macroeconomic Concepts",
    subject: "AP Macroeconomics",
    summary:
      "Macroeconomics studies economy-wide outcomes: output, unemployment, inflation, and growth. Scarcity, PPC, opportunity cost, and comparative advantage still apply at the national level.",
    keyPoints: [
      "Macro focuses on aggregates: GDP, price level, unemployment rate.",
      "PPC and trade apply to nations as well as individuals.",
      "Growth shifts LRAS and PPC outward.",
    ],
    commonMistakes: [
      "Treating macro variables as if they behave like single markets without AD–AS framework.",
      "Confusing nominal and real values.",
    ],
    example:
      "A country producing below its PPC has unemployed resources — analogous to recessionary output gap.",
  },
  {
    id: "macro-indicators",
    title: "Economic Indicators & Business Cycle",
    subject: "AP Macroeconomics",
    summary:
      "GDP measures total output; CPI tracks consumer prices; unemployment rate measures joblessness. Business cycles show fluctuations in real GDP.",
    keyPoints: [
      "GDP = C + I + G + (X − M); nominal uses current prices, real uses base-year prices.",
      "GDP deflator = (Nominal GDP / Real GDP) × 100.",
      "Inflation π ≈ (CPI_t − CPI_{t−1}) / CPI_{t−1} × 100%.",
      "Unemployment = unemployed / labor force × 100%; types: frictional, structural, cyclical.",
      "Fisher approximation: real interest rate r ≈ i − π.",
    ],
    commonMistakes: [
      "Including transfer payments in G (they are not government purchases).",
      "Counting intermediate goods in GDP (only final goods).",
      "Treating discouraged workers as unemployed (they leave the labor force).",
    ],
    example:
      "If CPI rises from 200 to 210, inflation ≈ (210 − 200) / 200 = 5%.",
  },
  {
    id: "macro-ad-as",
    title: "AD–AS & Fiscal Multipliers",
    subject: "AP Macroeconomics",
    summary:
      "Short-run equilibrium is where AD intersects SRAS. Output gaps occur when equilibrium differs from LRAS (potential output). Fiscal policy shifts AD via multipliers.",
    keyPoints: [
      "AD shifts: C, I, G, NX changes; SRAS shifts with input costs, expectations, productivity.",
      "Recessionary gap: Y < Y*; inflationary gap: Y > Y*.",
      "Spending multiplier k = 1 / (1 − MPC) = 1 / MPS; MPC + MPS = 1.",
      "ΔY from ΔG: ΔY = [1 / (1 − MPC)] × ΔG.",
      "Tax multiplier: ΔY = [−MPC / (1 − MPC)] × ΔT.",
    ],
    commonMistakes: [
      "Shifting SRAS when the shock is to AD (and vice versa).",
      "Using tax multiplier with same sign as spending multiplier.",
      "Forgetting LRAS is vertical at potential output in long run.",
    ],
    example:
      "If MPC = 0.8, spending multiplier = 1 / 0.2 = 5; a $10B increase in G raises Y by $50B (ceteris paribus).",
  },
  {
    id: "macro-financial",
    title: "Financial Sector & Money",
    subject: "AP Macroeconomics",
    summary:
      "Money serves as medium of exchange, store of value, and unit of account. Nominal interest rates are determined in the money market; real rates in the loanable funds market.",
    keyPoints: [
      "Bond prices and interest rates move inversely.",
      "Loanable funds: real interest rate equilibrates saving (supply) and investment (demand).",
      "Simplified money multiplier = 1 / reserve ratio (idealized model only).",
      "Quantity equation: MV = PY.",
    ],
    commonMistakes: [
      "Treating money multiplier as exact in real banking systems.",
      "Confusing nominal and real interest rates.",
      "Assuming expansionary policy always lowers all rates in every market instantly.",
    ],
    example:
      "If bond prices fall, yields (interest rates) rise — investors require higher return.",
  },
  {
    id: "macro-policy",
    title: "Stabilization Policy & Long Run",
    subject: "AP Macroeconomics",
    summary:
      "Fiscal and monetary policy shift AD in the short run. Crowding out, Phillips curve trade-offs, and long-run neutrality of money are key AP themes.",
    keyPoints: [
      "Expansionary fiscal: ↑G or ↓T → AD right; contractionary: opposite.",
      "Expansionary monetary: ↑money supply → ↓nominal interest rate → AD right.",
      "Crowding out: government borrowing may raise real interest rate, reducing I.",
      "Short-run Phillips curve: inflation–unemployment trade-off; long-run Phillips vertical at natural rate.",
      "Long-run money neutrality: money growth affects price level, not real output permanently.",
      "Growth drivers: human capital, physical capital, technology, institutions, resources.",
    ],
    commonMistakes: [
      "Claiming monetary policy permanently raises real GDP in long run.",
      "Ignoring crowding out in loanable funds analysis.",
      "Using short-run Phillips curve for long-run predictions.",
    ],
    example:
      "Central bank buys bonds → money supply up → nominal rate down → investment and AD increase (short run).",
  },
  {
    id: "macro-open-economy",
    title: "Open Economy & Forex",
    subject: "AP Macroeconomics",
    summary:
      "Open economies exchange goods, services, and assets internationally. Exchange rates affect net exports; capital flows shift currency demand and supply.",
    keyPoints: [
      "NX = X − M; current account tracks goods/services/income/transfers; financial account tracks asset flows.",
      "Appreciation: exports costlier abroad, imports cheaper → NX tends to fall.",
      "Depreciation: opposite effect on NX.",
      "Capital inflows increase demand for domestic currency; outflows increase supply.",
    ],
    commonMistakes: [
      "Confusing appreciation with improved trade balance immediately (J-curve / lag).",
      "Forgetting double-entry: current + financial accounts offset (with statistical discrepancy).",
    ],
    example:
      "If the dollar appreciates vs. the euro, U.S. goods become more expensive for Europeans — exports may fall.",
  },
];

export const macroFormulas: Formula[] = [
  {
    id: "macro-gdp",
    subject: "AP Macroeconomics",
    unit: "Unit 2: Economic Indicators",
    name: "GDP expenditure approach",
    expression: "GDP = C + I + G + (X − M)",
    variables: "C = consumption, I = investment, G = gov purchases, X = exports, M = imports",
    whenToUse: "Calculate or analyze components of aggregate output.",
    relatedConceptId: "macro-indicators",
    sourceNote: "AP Macroeconomics CED (College Board)",
  },
  {
    id: "macro-deflator",
    subject: "AP Macroeconomics",
    unit: "Unit 2: Economic Indicators",
    name: "GDP deflator",
    expression: "GDP Deflator = (Nominal GDP / Real GDP) × 100",
    variables: "Measures economy-wide price level relative to base year",
    whenToUse: "Convert nominal to real GDP; compare price levels over time.",
    relatedConceptId: "macro-indicators",
    sourceNote: "AP Macroeconomics CED",
  },
  {
    id: "macro-cpi",
    subject: "AP Macroeconomics",
    unit: "Unit 2: Economic Indicators",
    name: "Consumer Price Index",
    expression: "CPI = (Cost of basket today / Cost of basket base year) × 100",
    variables: "Fixed market basket of consumer goods and services",
    whenToUse: "Measure consumer inflation; compare living costs across years.",
    relatedConceptId: "macro-indicators",
    sourceNote: "AP Macroeconomics CED",
  },
  {
    id: "macro-inflation",
    subject: "AP Macroeconomics",
    unit: "Unit 2: Economic Indicators",
    name: "Inflation rate",
    expression: "π = [(CPI_t − CPI_{t−1}) / CPI_{t−1}] × 100%",
    variables: "π = inflation rate between two periods",
    whenToUse: "Year-over-year or period price level change.",
    relatedConceptId: "macro-indicators",
    sourceNote: "AP Macroeconomics CED",
  },
  {
    id: "macro-unemployment",
    subject: "AP Macroeconomics",
    unit: "Unit 2: Economic Indicators",
    name: "Unemployment rate",
    expression: "Unemployment rate = (Unemployed / Labor force) × 100%",
    variables: "Labor force = employed + unemployed actively seeking work",
    whenToUse: "Labor market conditions; Phillips curve context.",
    relatedConceptId: "macro-indicators",
    sourceNote: "AP Macroeconomics CED",
  },
  {
    id: "macro-fisher",
    subject: "AP Macroeconomics",
    unit: "Unit 2: Economic Indicators",
    name: "Fisher equation (approximation)",
    expression: "r ≈ i − π",
    variables: "r = real interest rate, i = nominal rate, π = inflation rate",
    whenToUse: "Link nominal and real returns; loanable funds analysis.",
    relatedConceptId: "macro-indicators",
    sourceNote: "AP Macroeconomics CED",
  },
  {
    id: "macro-multiplier",
    subject: "AP Macroeconomics",
    unit: "Unit 3: National Income",
    name: "Expenditure multiplier",
    expression: "k = 1 / (1 − MPC) = 1 / MPS",
    variables: "MPC + MPS = 1",
    whenToUse: "Effect of autonomous spending change on equilibrium Y.",
    relatedConceptId: "macro-ad-as",
    sourceNote: "AP Macroeconomics CED",
  },
  {
    id: "macro-tax-mult",
    subject: "AP Macroeconomics",
    unit: "Unit 3: National Income",
    name: "Tax multiplier",
    expression: "ΔY = [−MPC / (1 − MPC)] × ΔT",
    variables: "ΔT = change in lump-sum taxes",
    whenToUse: "Fiscal policy effect of tax changes on output.",
    relatedConceptId: "macro-ad-as",
    sourceNote: "AP Macroeconomics CED",
  },
  {
    id: "macro-money-mult",
    subject: "AP Macroeconomics",
    unit: "Unit 4: Financial Sector",
    name: "Simple money multiplier",
    expression: "Money multiplier = 1 / reserve ratio",
    variables: "Idealized model; real banking is more complex",
    whenToUse: "Illustrate deposit expansion in simplified model only.",
    relatedConceptId: "macro-financial",
    sourceNote: "AP Macroeconomics CED",
  },
  {
    id: "macro-mv-py",
    subject: "AP Macroeconomics",
    unit: "Unit 4: Financial Sector",
    name: "Quantity equation of money",
    expression: "MV = PY",
    variables: "M = money supply, V = velocity, P = price level, Y = real output",
    whenToUse: "Relate money, prices, and output; long-run neutrality discussions.",
    relatedConceptId: "macro-financial",
    sourceNote: "AP Macroeconomics CED",
  },
  {
    id: "macro-nx",
    subject: "AP Macroeconomics",
    unit: "Unit 6: Open Economy",
    name: "Net exports",
    expression: "NX = X − M",
    variables: "X = exports, M = imports",
    whenToUse: "Open economy GDP component; exchange rate effects.",
    relatedConceptId: "macro-open-economy",
    sourceNote: "AP Macroeconomics CED",
  },
];

export const macroGuides: KeyConceptGuide[] = [
  {
    id: "guide-macro-ad-as",
    title: "AD–AS Model",
    subject: "AP Macroeconomics",
    category: "ap_content",
    introduction:
      "The AD–AS model shows short-run and long-run equilibrium. AD shifts with spending; SRAS shifts with supply shocks. Compare equilibrium output to LRAS to identify recessionary or inflationary gaps.",
    howToUseAI: [
      "Ask AI to describe which curve shifts for a given shock (oil price spike vs. tax cut).",
      "Generate a scenario identifying gap type without solving for numbers.",
    ],
    conceptQuestions: [
      {
        id: "gmacro-ad1",
        prompt: "Why is LRAS vertical at potential output?",
        hints: ["In long run, output determined by resources/technology, not price level."],
      },
    ],
  },
  {
    id: "guide-macro-multiplier",
    title: "Fiscal Multipliers",
    subject: "AP Macroeconomics",
    category: "ap_content",
    introduction:
      "An initial change in G or T ripples through rounds of spending. The multiplier depends on MPC. Tax changes have a smaller effect than equal-sized spending changes because households save part of tax relief.",
    howToUseAI: [
      "Ask AI for a numerical MPC scenario and have it hide the final ΔY.",
      "Compare spending vs. tax multiplier signs and magnitudes.",
    ],
    conceptQuestions: [
      {
        id: "gmacro-mult1",
        prompt: "Why is the tax multiplier smaller in absolute value than the spending multiplier?",
        hints: ["Tax cut increases disposable income but only MPC fraction is spent each round."],
      },
    ],
  },
];

export const macroQuestionnaires: Questionnaire[] = [
  {
    id: "macro-gen-ad-as",
    title: "Macro — AD–AS & Multipliers Generated Set",
    subject: "AP Macroeconomics",
    kind: "generated",
    description: "Generated practice on AD–AS shifts, output gaps, and fiscal multipliers.",
    generationNote: "Original items aligned with AP Macroeconomics CED Units 2–3.",
    estimatedMinutes: 25,
    tags: ["AD-AS", "multiplier", "generated"],
    items: [
      {
        id: "macro-ad-1",
        format: "concept_check",
        conceptId: "macro-ad-as",
        conceptIntro: "Recessionary gap: equilibrium Y below LRAS.",
        prompt:
          "An economy is in short-run equilibrium below potential output. Is this a recessionary or inflationary gap? Which direction could expansionary fiscal policy shift AD?",
        hints: ["Below potential → recessionary gap; expansionary policy shifts AD right."],
      },
      {
        id: "macro-ad-2",
        format: "frq_half",
        conceptId: "macro-ad-as",
        conceptIntro: "Spending multiplier k = 1 / (1 − MPC).",
        prompt:
          "MPC = 0.75 and government purchases increase by $20 billion. Find the predicted change in equilibrium GDP (ceteris paribus, simplified multiplier model).",
        visibleSteps: ["Compute k = 1 / (1 − MPC).", "Multiply ΔG by k."],
        blankSteps: ["k = ______", "ΔY = ______ billion"],
        hints: ["L1: MPS = 1 − MPC.", "L2: ΔY = k × ΔG."],
      },
    ],
  },
  {
    id: "macro-gen-indicators",
    title: "Macro — GDP & Inflation Generated Set",
    subject: "AP Macroeconomics",
    kind: "generated",
    description: "Generated practice on GDP components, CPI, and inflation rate.",
    generationNote: "Original items aligned with AP Macroeconomics CED Unit 2.",
    estimatedMinutes: 20,
    tags: ["GDP", "CPI", "inflation", "generated"],
    items: [
      {
        id: "macro-ind-1",
        format: "frq_half",
        conceptId: "macro-indicators",
        conceptIntro: "Inflation rate from CPI.",
        prompt: "CPI was 240 last year and 252 this year. Calculate the inflation rate.",
        visibleSteps: ["Use π = (CPI_t − CPI_{t−1}) / CPI_{t−1} × 100%."],
        blankSteps: ["Inflation rate = ______%"],
        hints: ["L1: Subtract old CPI from new, divide by old.", "L2: Express as percentage."],
      },
    ],
  },
];
