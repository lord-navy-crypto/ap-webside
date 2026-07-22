import { Concept, Formula, KeyConceptGuide, Questionnaire } from "@/lib/types";

/**
 * AP Statistics — Units 1–9 (College Board CED).
 * Questionnaires are ORIGINAL AI-generated FRQ-style practice.
 * Do not paste College Board exam text verbatim.
 *
 * Patterned on fixed FRQ templates:
 * Topic 1 Exploring Data | Topic 2 Collecting Data |
 * Topic 3 Probability & RVs | Topic 4 Statistical Inference
 */

export const statsConcepts: Concept[] = [
  {
    id: "stats-one-var",
    title: "One-Variable Data (SOCS)",
    subject: "AP Statistics",
    summary:
      "Describe distributions with Shape, Outliers, Center, and Spread. Choose mean/SD vs median/IQR based on skew and outliers.",
    keyPoints: [
      "SOCS: shape (skew/modes), outliers, center, spread — always in context.",
      "Mean and SD are pulled by skew/outliers; median and IQR are resistant.",
      "1.5 × IQR rule: outliers below Q1 − 1.5·IQR or above Q3 + 1.5·IQR.",
      "Five-number summary: Min, Q1, Median, Q3, Max → boxplot.",
    ],
    commonMistakes: [
      "Describing graphs without context (units / variable name).",
      "Using mean as “typical” for strongly skewed data.",
      "Forgetting to justify outlier fences with calculation.",
    ],
    example:
      "Right-skewed commute times: report median and IQR, not mean and SD, as primary summaries.",
  },
  {
    id: "stats-two-var",
    title: "Two-Variable Data & Regression",
    subject: "AP Statistics",
    summary:
      "Scatterplots, correlation, least-squares regression, residuals, and r². Interpret slope, intercept, and predictions in context.",
    keyPoints: [
      "Describe association: direction, form, strength, outliers — in context.",
      "ŷ = a + bx: slope b = predicted change in y per 1-unit increase in x.",
      "Residual = y − ŷ; positive residual ⇒ model underestimated.",
      "r² = percent of variation in y explained by the linear model with x.",
      "Extrapolation beyond the data range is risky.",
    ],
    commonMistakes: [
      "Saying slope is the actual change (it is predicted/average change).",
      "Interpreting r² without “percent of variation explained.”",
      "Claiming causation from observational association alone.",
    ],
    example:
      "If ŷ = 12 + 3.4x for study hours x and quiz score ŷ, slope 3.4 means predicted score rises ~3.4 points per extra study hour.",
  },
  {
    id: "stats-sampling-design",
    title: "Sampling Methods & Bias",
    subject: "AP Statistics",
    summary:
      "SRS, stratified, cluster, and systematic samples. Bias comes from bad design (voluntary response, convenience, undercoverage, nonresponse), not from small n alone.",
    keyPoints: [
      "SRS: every sample of size n equally likely.",
      "Stratified: sample within homogeneous strata → often more precise.",
      "Cluster: sample whole clusters (convenient; may be less precise).",
      "Larger biased samples are still biased; randomness reduces sampling variability, not bias.",
    ],
    commonMistakes: [
      "Confusing stratification (within groups) with clustering (whole groups).",
      "Thinking “n = 1000” automatically makes a convenience sample valid.",
      "Using median vs mean without linking to skew when estimating typical values.",
    ],
    example:
      "Emailing all alumni and using only responders is voluntary response — often overrepresents extreme opinions.",
  },
  {
    id: "stats-experiments",
    title: "Experiments & Causal Inference",
    subject: "AP Statistics",
    summary:
      "Treatments, experimental units, response. Random assignment enables causal claims. Matched pairs, blocking, control, replication, and blinding reduce confounding.",
    keyPoints: [
      "Random assignment balances lurking variables → causal conclusions.",
      "Observational studies show association, not causation (confounding).",
      "Matched pairs / blocking reduce variability from known factors.",
      "Control group (placebo or standard treatment) provides comparison baseline.",
      "Replication: enough units per treatment to estimate variability.",
    ],
    commonMistakes: [
      "Claiming causation without random assignment.",
      "Confusing experimental units with treatments.",
      "Saying a study proves equality to an untested alternative treatment.",
    ],
    example:
      "Randomly assign 40 plants to fertilizer A or B; compare growth. Random assignment supports a causal claim for plants like those studied.",
  },
  {
    id: "stats-probability",
    title: "Probability, Independence & Conditioning",
    subject: "AP Statistics",
    summary:
      "Basic rules, conditional probability, independence checks, and counting for without-replacement selections.",
    keyPoints: [
      "P(A or B) = P(A) + P(B) − P(A and B).",
      "P(A|B) = P(A and B) / P(B).",
      "Independent if P(A|B) = P(A) (or P(A and B) = P(A)P(B)).",
      "Without replacement: use combinations / changing denominators.",
    ],
    commonMistakes: [
      "Adding probabilities of overlapping events without subtracting intersection.",
      "Treating without-replacement selections as independent trials.",
      "Confusing P(A and B) with P(A|B).",
    ],
    example:
      "If P(never)=0.12 and P(never|woman)=0.12, then “never” and “woman” are independent.",
  },
  {
    id: "stats-random-vars",
    title: "Random Variables & Common Distributions",
    subject: "AP Statistics",
    summary:
      "Discrete RVs (expected value), Binomial, Geometric, and Normal calculations. Define the RV and distribution before computing.",
    keyPoints: [
      "E(X) = Σ x·P(x) for discrete X.",
      "Binomial: fixed n, two outcomes, independence, constant p; X = # successes.",
      "Geometric: trials until first success; P(X = k) = (1−p)^{k−1}p.",
      "Normal: standardize z = (x − μ)/σ; use table/calculator for probabilities.",
      "Combining independent Normals: means add; variances add.",
    ],
    commonMistakes: [
      "Calling something Binomial without checking independence / constant p.",
      "Using Normal when skewed and n is small.",
      "Forgetting to define the random variable in words.",
    ],
    example:
      "X = # gift cards an employee wins in 52 weeks; if p = 1/200 each week independent, X ~ Bin(52, 1/200).",
  },
  {
    id: "stats-ci-prop-mean",
    title: "Confidence Intervals (Means & Proportions)",
    subject: "AP Statistics",
    summary:
      "One- and two-sample intervals for proportions and means. State parameter, check conditions, compute, interpret in context.",
    keyPoints: [
      "Form: estimate ± critical value × SE.",
      "Interpret: “We are C% confident that the true [parameter] is between … and ….”",
      "Conditions: random, independent (10% rule), Normal/Large Counts as required.",
      "If a claimed value is outside the CI, that is evidence against it (at matching α).",
    ],
    commonMistakes: [
      "Saying the interval is a probability for the parameter.",
      "Using z* with s/√n when SD is unknown (use t for means).",
      "Skipping Large Counts: n p̂ ≥ 10 and n(1−p̂) ≥ 10.",
    ],
    example:
      "ˆp = 0.59, n = 920 → 95% CI ≈ 0.59 ± 1.96√(0.59·0.41/920).",
  },
  {
    id: "stats-hypothesis-tests",
    title: "Hypothesis Tests (Means & Proportions)",
    subject: "AP Statistics",
    summary:
      "State H₀/Hₐ, check conditions, compute test statistic and p-value, conclude in context. Know Type I / Type II errors.",
    keyPoints: [
      "p-value = P(as or more extreme | H₀ true).",
      "Reject H₀ when p-value < α; otherwise fail to reject (never “accept H₀”).",
      "One-proportion z uses p₀ in SE; two-proportion z often uses pooled ˆp_c under H₀: p₁ = p₂.",
      "Type I: reject true H₀; Type II: fail to reject false H₀.",
    ],
    commonMistakes: [
      "Writing Hₐ as equality.",
      "Using ˆp in the SE for a one-proportion test of H₀: p = p₀.",
      "Concluding causation from a significant observational test.",
    ],
    example:
      "H₀: p = 0.40 vs Hₐ: p > 0.40; z = (ˆp − 0.40)/√(0.40·0.60/n); compare p-value to α.",
  },
  {
    id: "stats-chi-square",
    title: "Chi-Square Tests",
    subject: "AP Statistics",
    summary:
      "Goodness-of-fit, homogeneity, and independence. Same χ² statistic; different hypotheses and sampling stories.",
    keyPoints: [
      "χ² = Σ (O − E)² / E; all expected counts ≥ 5 for Normal approximation.",
      "GOF: one sample vs claimed distribution; df = #categories − 1.",
      "Homogeneity: compare distributions across groups (independent samples).",
      "Independence: association in one sample cross-classified two ways.",
    ],
    commonMistakes: [
      "Mixing up homogeneity vs independence wording.",
      "Using row totals as “expected” without E = (row total)(col total)/n.",
      "Forgetting df for two-way tables: (r−1)(c−1).",
    ],
    example:
      "To compare soft-drink yes/no proportions across three cities’ independent samples → χ² test of homogeneity.",
  },
  {
    id: "stats-slope-inference",
    title: "Inference for Regression Slope",
    subject: "AP Statistics",
    summary:
      "t-interval and t-test for the true slope β of the population regression line. Conditions: linear, independent, Normal residuals, equal variance, random.",
    keyPoints: [
      "CI for slope: b ± t* · SE_b with df = n − 2.",
      "Test H₀: β = 0 (or other value) with t = (b − β₀)/SE_b.",
      "Interpret slope CI in context (units of y per unit of x).",
    ],
    commonMistakes: [
      "Using df = n − 1 instead of n − 2.",
      "Interpreting the interval for the intercept when asked about slope.",
      "Ignoring LINER residual conditions.",
    ],
    example:
      "b = −2.16, SE_b = 0.15, n = 20 → 95% CI uses t* with df = 18.",
  },
];

export const statsFormulas: Formula[] = [
  {
    id: "stats-iqr-fence",
    subject: "AP Statistics",
    unit: "Unit 1: Exploring One-Variable Data",
    name: "1.5 × IQR outlier fences",
    expression: "Q_1 - 1.5\\,\\mathrm{IQR},\\quad Q_3 + 1.5\\,\\mathrm{IQR}",
    variables: "IQR = Q₃ − Q₁",
    whenToUse: "Identify potential outliers for a quantitative distribution.",
    relatedConceptId: "stats-one-var",
    sourceNote: "AP Statistics CED",
  },
  {
    id: "stats-residual",
    subject: "AP Statistics",
    unit: "Unit 2: Exploring Two-Variable Data",
    name: "Residual",
    expression: "\\text{residual} = y - \\hat{y}",
    variables: "y = observed, ŷ = predicted from LSRL",
    whenToUse: "Measure how far a point is above/below the regression line.",
    relatedConceptId: "stats-two-var",
    sourceNote: "AP Statistics CED",
  },
  {
    id: "stats-lsrl",
    subject: "AP Statistics",
    unit: "Unit 2: Exploring Two-Variable Data",
    name: "Least-squares regression line",
    expression: "\\hat{y} = a + bx",
    variables: "a = intercept, b = slope",
    whenToUse: "Predict y from x; interpret a and b in context.",
    relatedConceptId: "stats-two-var",
    sourceNote: "AP Statistics CED",
  },
  {
    id: "stats-cond-prob",
    subject: "AP Statistics",
    unit: "Unit 4: Probability",
    name: "Conditional probability",
    expression: "P(A\\mid B) = \\frac{P(A\\cap B)}{P(B)}",
    variables: "P(B) > 0",
    whenToUse: "Probability of A given that B occurred.",
    relatedConceptId: "stats-probability",
    sourceNote: "AP Statistics CED",
  },
  {
    id: "stats-binomial-pmf",
    subject: "AP Statistics",
    unit: "Unit 4: Probability",
    name: "Binomial probability",
    expression: "P(X=k)=\\binom{n}{k}p^k(1-p)^{n-k}",
    variables: "n trials, p success probability, k successes",
    whenToUse: "Fixed n independent Bernoulli trials; X = number of successes.",
    relatedConceptId: "stats-random-vars",
    sourceNote: "AP Statistics CED",
  },
  {
    id: "stats-normal-z",
    subject: "AP Statistics",
    unit: "Unit 1 / Unit 5",
    name: "z-score (Normal)",
    expression: "z = \\frac{x-\\mu}{\\sigma}",
    variables: "μ = mean, σ = SD",
    whenToUse: "Standardize a Normal value to find probabilities or percentiles.",
    relatedConceptId: "stats-random-vars",
    sourceNote: "AP Statistics CED",
  },
  {
    id: "stats-one-prop-ci",
    subject: "AP Statistics",
    unit: "Unit 6: Inference for Categorical Data",
    name: "One-proportion z-interval",
    expression: "\\hat{p}\\pm z^*\\sqrt{\\frac{\\hat{p}(1-\\hat{p})}{n}}",
    variables: "ˆp = sample proportion, z* = critical value",
    whenToUse: "Estimate a population proportion with a CI.",
    relatedConceptId: "stats-ci-prop-mean",
    sourceNote: "AP Statistics CED",
  },
  {
    id: "stats-one-prop-z",
    subject: "AP Statistics",
    unit: "Unit 6: Inference for Categorical Data",
    name: "One-proportion z-test statistic",
    expression: "z=\\frac{\\hat{p}-p_0}{\\sqrt{p_0(1-p_0)/n}}",
    variables: "p₀ = hypothesized proportion",
    whenToUse: "Test H₀: p = p₀ for a single proportion.",
    relatedConceptId: "stats-hypothesis-tests",
    sourceNote: "AP Statistics CED",
  },
  {
    id: "stats-two-prop-z",
    subject: "AP Statistics",
    unit: "Unit 6",
    name: "Two-proportion z (pooled)",
    expression:
      "z=\\frac{\\hat{p}_1-\\hat{p}_2}{\\sqrt{\\hat{p}_c(1-\\hat{p}_c)(1/n_1+1/n_2)}},\\ \\hat{p}_c=\\frac{x_1+x_2}{n_1+n_2}",
    variables: "Under H₀: p₁ = p₂",
    whenToUse: "Compare two population proportions.",
    relatedConceptId: "stats-hypothesis-tests",
    sourceNote: "AP Statistics CED",
  },
  {
    id: "stats-two-mean-t",
    subject: "AP Statistics",
    unit: "Unit 7: Inference for Quantitative Data",
    name: "Two-sample t statistic",
    expression:
      "t=\\frac{(\\bar{x}_1-\\bar{x}_2)-0}{\\sqrt{s_1^2/n_1+s_2^2/n_2}}",
    variables: "s₁, s₂ = sample SDs",
    whenToUse: "Compare two means (independent samples / CRD).",
    relatedConceptId: "stats-hypothesis-tests",
    sourceNote: "AP Statistics CED",
  },
  {
    id: "stats-paired-t",
    subject: "AP Statistics",
    unit: "Unit 7",
    name: "Paired t statistic",
    expression: "t=\\frac{\\bar{d}-0}{s_d/\\sqrt{n}}",
    variables: "d̄ = mean difference, s_d = SD of differences",
    whenToUse: "Matched pairs / before-after differences.",
    relatedConceptId: "stats-hypothesis-tests",
    sourceNote: "AP Statistics CED",
  },
  {
    id: "stats-chi-sq",
    subject: "AP Statistics",
    unit: "Unit 8",
    name: "Chi-square statistic",
    expression: "\\chi^2=\\sum\\frac{(O-E)^2}{E}",
    variables: "O = observed, E = expected count",
    whenToUse: "GOF, homogeneity, or independence tests.",
    relatedConceptId: "stats-chi-square",
    sourceNote: "AP Statistics CED",
  },
  {
    id: "stats-slope-ci",
    subject: "AP Statistics",
    unit: "Unit 9",
    name: "CI for regression slope",
    expression: "b\\pm t^*\\,SE_b\\quad (\\mathrm{df}=n-2)",
    variables: "b = sample slope, SE_b from computer output",
    whenToUse: "Estimate the true slope β of the population LSRL.",
    relatedConceptId: "stats-slope-inference",
    sourceNote: "AP Statistics CED",
  },
];

export const statsGuides: KeyConceptGuide[] = [
  {
    id: "guide-stats-frq-templates",
    title: "AP Stats FRQ Fixed Templates",
    subject: "AP Statistics",
    category: "ap_content",
    introduction:
      "Many AP Stats FRQs recycle fixed templates with new contexts: describe a distribution (SOCS), interpret regression, critique sampling, design/identify experiment parts, compute conditional/Binomial/Normal probabilities, then write a full inference procedure. Master the template language so context swaps do not slow you down.",
    howToUseAI: [
      "Paste a topic (e.g. “one-proportion z-test”) and ask AI for a NEW context with different numbers — no College Board text.",
      "Ask AI to grade your written conclusion sentence for “in context + link to p-value/α.”",
      "Ask AI for three parallel FRQs that all test residual interpretation with different stories.",
    ],
    conceptQuestions: [
      {
        id: "gstats-t1",
        prompt:
          "Name the four big FRQ topic buckets in AP Statistics and one classic ask from each.",
        hints: [
          "Exploring data; collecting data; probability/RVs; inference.",
          "Examples: SOCS; bias vs SRS; Binomial setup; full significance test.",
        ],
      },
    ],
  },
  {
    id: "guide-stats-inference-writeup",
    title: "Inference Write-Up Checklist",
    subject: "AP Statistics",
    category: "study_skill",
    introduction:
      "Every inference FRQ wants the same skeleton: parameter/hypotheses in context → procedure name → conditions → mechanics (stat, SE, test statistic/interval) → conclusion in context. Conditions fail? Say so and state what that implies.",
    howToUseAI: [
      "Ask AI: “Check whether my conditions paragraph names Random / Independent / Normal correctly for a two-proportion z-test.”",
      "Generate a half-process FRQ: show hypotheses + conditions, leave blank for z and conclusion.",
    ],
    conceptQuestions: [
      {
        id: "gstats-inf1",
        prompt:
          "Why do we use p₀ (not ˆp) in the standard error of a one-proportion z-test?",
        hints: [
          "Under H₀ we assume p = p₀, so the sampling SD of ˆp uses p₀.",
        ],
      },
    ],
  },
  {
    id: "guide-stats-ai-generate",
    title: "Using AI to Generate Stats Practice",
    subject: "AP Statistics",
    category: "ai_for_ap",
    introduction:
      "AI is best for original practice clones of fixed FRQ templates — new stories, new numbers — not for pasting real exam keys. Always attempt first; use hints, not answer dumps.",
    howToUseAI: [
      "Prompt: “Write an original AP Stats FRQ on matched-pairs experiments about sleep apps. Include (a)(b)(c). No answers.”",
      "Prompt: “Same template as a one-prop CI FRQ but about transit card usage; change n and ˆp.”",
      "Prompt: “Give Level-1/2/3 hints only for my draft solution.”",
    ],
    conceptQuestions: [
      {
        id: "gstats-ai1",
        prompt:
          "Why should you avoid asking AI to paste a specific year’s AP Stats FRQ verbatim?",
        hints: [
          "Copyright / exam security; better to generate original isomorphic practice.",
        ],
      },
    ],
  },
];

export const statsQuestionnaires: Questionnaire[] = [
  {
    id: "stats-gen-exploring-data",
    title: "Stats — Exploring Data Generated FRQ Set",
    subject: "AP Statistics",
    kind: "generated",
    description:
      "Original SOCS, outlier rules, boxplots vs histograms, and regression interpretation drills.",
    generationNote:
      "AI-generated from Topic 1 fixed FRQ templates (one-var + two-var). Original contexts/numbers. 2026-07-22.",
    estimatedMinutes: 35,
    tags: ["SOCS", "outliers", "regression", "residuals", "generated", "FRQ"],
    items: [
      {
        id: "stats-ed-1",
        format: "frq_half",
        conceptId: "stats-one-var",
        conceptIntro: "Five-number summary + 1.5×IQR outlier rule.",
        difficultyTier: 2,
        prompt:
          "A random sample of 40 delivery times (minutes) for a campus food app has five-number summary: Min = 8, Q1 = 14, Median = 18, Q3 = 25, Max = 52. (i) Calculate the IQR and the 1.5×IQR outlier fences. (ii) Is 52 a potential outlier? Justify.",
        visibleSteps: [
          "IQR = Q3 − Q1.",
          "Lower fence = Q1 − 1.5·IQR; upper fence = Q3 + 1.5·IQR.",
          "Compare Max = 52 to the upper fence.",
        ],
        blankSteps: [
          "IQR = ______",
          "Fences: (______ , ______)",
          "52 outlier? Yes/No + reason: ____________________",
        ],
        hints: [
          "L1: IQR = 25 − 14.",
          "L2: Upper fence = 25 + 1.5×IQR.",
          "L3: Any value above the upper fence is a potential outlier.",
        ],
      },
      {
        id: "stats-ed-2",
        format: "concept_check",
        conceptId: "stats-one-var",
        conceptIntro: "Mean/SD vs median/IQR under right skew.",
        difficultyTier: 2,
        prompt:
          "Commute times for 200 workers are strongly skewed right with a few very long delays. Method A uses the 1.5×IQR rule; Method B flags points more than 2 sample SDs from the sample mean. Explain why Method A may flag more high outliers than Method B.",
        hints: [
          "Right skew pulls mean and SD upward.",
          "IQR/quartiles are resistant; fences stay lower than a 2-SD cutoff inflated by the tail.",
        ],
      },
      {
        id: "stats-ed-3",
        format: "frq_half",
        conceptId: "stats-two-var",
        conceptIntro: "Interpret slope and r² in context.",
        difficultyTier: 2,
        prompt:
          "For 15 hiking trails, a biologist fits ŷ = 4.2 + 0.85x predicting trail rating ŷ (1–10) from length x (km). Given r² = 0.64: (i) Interpret the slope. (ii) Interpret r².",
        visibleSteps: [
          "Slope: predicted change in y per 1-unit increase in x.",
          "r²: percent of variation in y explained by the linear model with x.",
        ],
        blankSteps: [
          "Slope interpretation: ____________________",
          "r² interpretation: ____________________",
        ],
        hints: [
          "L1: Include “predicted” and units (rating points per km).",
          "L2: r² = 64% of variation in ratings…",
          "L3: Do not claim causation.",
        ],
      },
      {
        id: "stats-ed-4",
        format: "frq_half",
        conceptId: "stats-two-var",
        conceptIntro: "Residual = observed − predicted.",
        difficultyTier: 2,
        prompt:
          "Using ŷ = −16.5 + 35.0x for wolf weight (kg) from length x (m), one wolf with length 1.3 m has residual −8.2 kg. Find the wolf’s actual weight.",
        visibleSteps: [
          "Compute ŷ at x = 1.3.",
          "Use residual = y − ŷ ⇒ y = ŷ + residual.",
        ],
        blankSteps: ["ŷ = ______ kg", "Actual weight y = ______ kg"],
        hints: [
          "L1: ŷ = −16.5 + 35.0(1.3).",
          "L2: Negative residual means actual is below predicted.",
        ],
      },
      {
        id: "stats-ed-5",
        format: "mcq",
        conceptId: "stats-one-var",
        conceptIntro: "Histogram vs boxplot information.",
        difficultyTier: 1,
        prompt:
          "A histogram of dorm room sizes is clearly bimodal. A boxplot of the same data is drawn. Which feature is apparent in the histogram but NOT in the boxplot?",
        choices: [
          "A) The median room size",
          "B) The presence of two peaks (bimodality)",
          "C) The maximum room size",
          "D) The interquartile range",
        ],
        hints: [
          "Boxplots summarize quartiles; they do not show multiple modes.",
        ],
      },
      {
        id: "stats-ed-6",
        format: "concept_check",
        conceptId: "stats-two-var",
        conceptIntro: "Changing one point: mean vs median.",
        difficultyTier: 1,
        prompt:
          "Among 60 tip amounts, one tip of $9 is changed to $19. What happens to the mean and to the median? Justify briefly.",
        hints: [
          "Mean uses the sum → increases.",
          "Median depends on middle order stats; one point moving within the same half often leaves median unchanged.",
        ],
      },
    ],
  },
  {
    id: "stats-gen-collecting-data",
    title: "Stats — Collecting Data Generated FRQ Set",
    subject: "AP Statistics",
    kind: "generated",
    description:
      "Original sampling-bias, SRS/stratified, and experiment-design FRQ clones.",
    generationNote:
      "AI-generated from Topic 2 fixed templates (sampling + experiments). Original contexts. 2026-07-22.",
    estimatedMinutes: 30,
    tags: ["sampling", "bias", "experiments", "matched pairs", "generated", "FRQ"],
    items: [
      {
        id: "stats-cd-1",
        format: "frq_half",
        conceptId: "stats-sampling-design",
        conceptIntro: "Voluntary response vs SRS with follow-up.",
        difficultyTier: 2,
        prompt:
          "A city wants to estimate average annual income of 12,000 alumni. Method 1: email all alumni an online form (expect ~800 replies). Method 2: select an SRS of 120 alumni and phone until all respond. Which method would you choose for estimating the mean income? Compare bias.",
        visibleSteps: [
          "Identify the sampling/response mechanism for each method.",
          "Link mechanism to bias in the income estimate.",
        ],
        blankSteps: [
          "Preferred method: ______",
          "Reasoning: ____________________",
        ],
        hints: [
          "L1: Method 1 is voluntary response / nonresponse.",
          "L2: Higher earners may be more/less likely to reply → bias.",
          "L3: Smaller n can still beat a large biased sample.",
        ],
      },
      {
        id: "stats-cd-2",
        format: "concept_check",
        conceptId: "stats-sampling-design",
        conceptIntro: "Convenience sample bias.",
        difficultyTier: 1,
        prompt:
          "To estimate the proportion of students satisfied with campus landscaping, an admin surveys the first 400 students entering a sold-out basketball game. Why might this be biased?",
        hints: [
          "Game attendees are not a random cross-section of all students.",
          "Interest in athletics may correlate with opinions about grounds.",
        ],
      },
      {
        id: "stats-cd-3",
        format: "frq_half",
        conceptId: "stats-experiments",
        conceptIntro: "Identify treatments, units, response.",
        difficultyTier: 1,
        prompt:
          "Researchers test four fungus concentrations (0, 1.0, 2.0, 3.0 ml/L) sprayed on beetles in 24 jars (6 jars each). After one week they record how many beetles remain alive in each jar. Identify treatments, experimental units, and response variable. Does the study have a control group?",
        visibleSteps: [
          "Treatments = levels of the explanatory factor.",
          "Units = what is randomly assigned a treatment.",
          "Response = measured outcome.",
        ],
        blankSteps: [
          "Treatments: ____________________",
          "Experimental units: ____________________",
          "Response: ____________________",
          "Control group? ____________________",
        ],
        hints: [
          "L1: 0 ml/L is a control (no fungus).",
          "L2: Units are the jars (groups of beetles), not individual concentrations.",
        ],
      },
      {
        id: "stats-cd-4",
        format: "concept_check",
        conceptId: "stats-experiments",
        conceptIntro: "Matched pairs advantage.",
        difficultyTier: 2,
        prompt:
          "A dermatologist recruits 30 pairs of identical twins with similar acne severity (severity differs across pairs). Why is a matched-pairs design (twins paired) statistically advantageous vs a completely randomized design?",
        hints: [
          "Pairing controls genetic/severity similarity.",
          "Reduces variability → more power to detect treatment differences.",
        ],
      },
      {
        id: "stats-cd-5",
        format: "frq_half",
        conceptId: "stats-experiments",
        conceptIntro: "Observational study + confounding.",
        difficultyTier: 2,
        prompt:
          "A 20-year health study finds adults who drink ≥3 cups of coffee daily have 1.8× the rate of sleep complaints of non-coffee drinkers. (i) Explanatory and response variables? (ii) Observational study or experiment? (iii) Explain how “late work shifts” could be a confounding variable.",
        visibleSteps: [
          "Explanatory predicts; response is the outcome.",
          "Was a treatment assigned by researchers?",
          "Confounder associated with both explanatory and response.",
        ],
        blankSteps: [
          "Explanatory: ______  Response: ______",
          "Study type: ______",
          "Confounding explanation: ____________________",
        ],
        hints: [
          "L1: No assignment ⇒ observational.",
          "L2: Shift workers may drink more coffee AND sleep worse.",
        ],
      },
      {
        id: "stats-cd-6",
        format: "mcq",
        conceptId: "stats-experiments",
        conceptIntro: "Scope of conclusions.",
        difficultyTier: 2,
        prompt:
          "In a randomized experiment, drug + 2 therapy sessions beats placebo + 2 sessions (statistically significant). Researchers conclude “drug + 2 sessions is as good as 8 sessions without drug.” What is the best critique?",
        choices: [
          "A) The sample size was too small to ever conclude anything",
          "B) The study never compared to an 8-session no-drug group",
          "C) Significance proves the treatments are identical",
          "D) Placebos cannot be used in experiments",
        ],
        hints: [
          "Conclusions are limited to the treatments actually compared.",
        ],
      },
    ],
  },
  {
    id: "stats-gen-probability",
    title: "Stats — Probability & RVs Generated FRQ Set",
    subject: "AP Statistics",
    kind: "generated",
    description:
      "Original conditional probability, independence, Binomial/Normal, and expected-value FRQs.",
    generationNote:
      "AI-generated from Topic 3 fixed templates. Original numbers/contexts. 2026-07-22.",
    estimatedMinutes: 40,
    tags: ["conditional probability", "binomial", "normal", "expected value", "generated", "FRQ"],
    items: [
      {
        id: "stats-pr-1",
        format: "frq_half",
        conceptId: "stats-probability",
        conceptIntro: "Two-way relative frequency table.",
        difficultyTier: 2,
        prompt:
          "Relative frequencies for survey responses (Never / Sometimes / Always) by gender:\nNever∩Men=0.05, Never∩Women=0.07, Never total=0.12; Women total=0.55; Always∩Women=0.30; Always total=0.52.\nOne person selected at random. Find: (i) P(Never and Woman); (ii) P(Never or Woman); (iii) P(Never | Woman). Are Never and Woman independent?",
        visibleSteps: [
          "Read joint from table for (i).",
          "P(A or B) = P(A)+P(B)−P(A and B).",
          "P(A|B)=P(A and B)/P(B); compare to P(A).",
        ],
        blankSteps: [
          "(i) ______",
          "(ii) ______",
          "(iii) ______",
          "Independent? ______",
        ],
        hints: [
          "L1: (i) is the joint 0.07.",
          "L2: P(Woman)=0.55; P(Never)=0.12.",
          "L3: Independent iff P(Never|Woman)=P(Never).",
        ],
      },
      {
        id: "stats-pr-2",
        format: "frq_half",
        conceptId: "stats-random-vars",
        conceptIntro: "Independent trials success probability.",
        difficultyTier: 2,
        prompt:
          "A new rocket igniter fails with probability 0.12 each launch (independent). Engineers test igniters until the first failure or 25 successes, whichever comes first. (a) If failure rate is truly 0.12, find P(first 20 succeed). (b) Given first 20 succeed, find P(first failure is on the 21st or 22nd test).",
        visibleSteps: [
          "Success probability = 0.88 per trial.",
          "Part (a): (0.88)^20.",
          "Part (b): fail on 21 OR (success on 21 and fail on 22).",
        ],
        blankSteps: [
          "(a) P = ______",
          "(b) P = ______",
        ],
        hints: [
          "L1: Independent identical trials.",
          "L2: (b) = 0.12 + 0.88×0.12.",
        ],
      },
      {
        id: "stats-pr-3",
        format: "frq_half",
        conceptId: "stats-probability",
        conceptIntro: "Combinations without replacement.",
        difficultyTier: 2,
        prompt:
          "A club has 7 juniors and 4 seniors. Three members are chosen at random to attend a conference; all 3 selected are seniors. (a) Find P(all 3 seniors). (b) Based on (a), is there reason to doubt “random selection”? (c) A simulation rolls 3 fair six-sided dice each trial, treating {1–4}=junior and {5–6}=senior, and counts trials with three “seniors.” Why is this simulation incorrect?",
        visibleSteps: [
          "P = C(4,3)/C(11,3) (or sequential without replacement).",
          "Judge if probability is unusually small.",
          "Check replacement and probability of “senior” on each die.",
        ],
        blankSteps: [
          "(a) P = ______",
          "(b) Doubt? ______",
          "(c) Flaw: ____________________",
        ],
        hints: [
          "L1: C(11,3)=165; C(4,3)=4.",
          "L2: Simulation allows repeats and wrong P(senior)=1/3 each roll.",
        ],
      },
      {
        id: "stats-pr-4",
        format: "frq_half",
        conceptId: "stats-random-vars",
        conceptIntro: "Normal + Binomial rejection rule.",
        difficultyTier: 3,
        prompt:
          "Fill volume A ~ N(μ=0.60 L, σ=0.04 L). A bottle is underfilled if A < 0.50. Boxes hold 10 independent bottles; a crate is rejected if a randomly chosen box has ≥2 underfilled bottles. (a) Find P(a bottle is underfilled). (b) Define the RV for # underfilled in a box and its distribution; find P(crate rejected).",
        visibleSteps: [
          "Standardize: z = (0.50 − 0.60)/0.04.",
          "Let X = # underfilled in 10 bottles; X ~ Bin(10, p).",
          "P(X ≥ 2) = 1 − P(0) − P(1).",
        ],
        blankSteps: [
          "(a) z = ______ , P ≈ ______",
          "(b) X ~ ______ ; P(reject) ≈ ______",
        ],
        hints: [
          "L1: z = −2.5 → use Normal table/calculator.",
          "L2: Independence + constant p ⇒ Binomial.",
        ],
      },
      {
        id: "stats-pr-5",
        format: "frq_half",
        conceptId: "stats-random-vars",
        conceptIntro: "Binomial expected value + rare event.",
        difficultyTier: 2,
        prompt:
          "Each week one of 250 employees is chosen uniformly at random for a gift card (with replacement across weeks; independent). (a) Define X = # cards a particular employee gets in 52 weeks and state the distribution. (b) Find P(X ≥ 1). (c) Find and interpret E(X). (d) An employee gets 0 cards all year — strong evidence of non-randomness?",
        visibleSteps: [
          "X ~ Bin(n=52, p=1/250).",
          "P(X≥1)=1−(1−p)^52.",
          "E(X)=np; compare P(X=0) to decide if 0 is surprising.",
        ],
        blankSteps: [
          "(a) X ~ ______",
          "(b) P ≈ ______",
          "(c) E(X)= ______ interpretation: ______",
          "(d) ______",
        ],
        hints: [
          "L1: p = 1/250 each week.",
          "L2: P(X=0)=(249/250)^52 is not small.",
        ],
      },
      {
        id: "stats-pr-6",
        format: "frq_half",
        conceptId: "stats-random-vars",
        conceptIntro: "Normal percentile + expected gain.",
        difficultyTier: 2,
        prompt:
          "Phone battery life ~ N(μ=28 months, σ=7 months). A $40 warranty replaces the phone if life < 24 months (company loss $160 including the $40). If no claim, company gains $40. (a) Find the 30th percentile of battery life. (b) P(claim). (c) Expected gain per warranty.",
        visibleSteps: [
          "Percentile: x = μ + z_p σ.",
          "P(X<24) via z-score.",
          "E(gain)=40(1−p)+(−160)p.",
        ],
        blankSteps: [
          "(a) ≈ ______ months",
          "(b) P ≈ ______",
          "(c) E(gain) ≈ ______",
        ],
        hints: [
          "L1: z_0.30 ≈ −0.52.",
          "L2: z=(24−28)/7 = −4/7.",
        ],
      },
    ],
  },
  {
    id: "stats-gen-inference",
    title: "Stats — Statistical Inference Generated FRQ Set",
    subject: "AP Statistics",
    kind: "generated",
    description:
      "Original CI, significance tests, chi-square, paired t, and slope-interval FRQs.",
    generationNote:
      "AI-generated from Topic 4 fixed inference templates. Original data/contexts. 2026-07-22.",
    estimatedMinutes: 45,
    tags: ["confidence interval", "hypothesis test", "chi-square", "regression slope", "generated", "FRQ"],
    items: [
      {
        id: "stats-inf-1",
        format: "frq_half",
        conceptId: "stats-ci-prop-mean",
        conceptIntro: "One-proportion z-interval + using CI for a claim.",
        difficultyTier: 2,
        prompt:
          "In a random sample of 800 U.S. teens, 62% say they use noise-cancelling headphones daily. (a) Construct and interpret a 95% CI for the true proportion. (b) Does the interval provide convincing evidence that the true proportion is not 0.50? Justify.",
        visibleSteps: [
          "ˆp ± 1.96√(ˆp(1−ˆp)/n).",
          "Interpret “95% confident … true proportion … between …”.",
          "See whether 0.50 lies in the interval.",
        ],
        blankSteps: [
          "(a) CI ≈ (______ , ______); interpretation: ______",
          "(b) Evidence against 0.50? ______",
        ],
        hints: [
          "L1: ˆp=0.62, n=800.",
          "L2: If 0.50 is outside, yes — evidence it differs from 0.50.",
        ],
      },
      {
        id: "stats-inf-2",
        format: "frq_half",
        conceptId: "stats-hypothesis-tests",
        conceptIntro: "One-proportion z-test + Type I/II.",
        difficultyTier: 2,
        prompt:
          "A café manager believes that with a $2 coupon, more than 35% of past customers will reorder within 30 days. Of 120 randomly selected past customers emailed the coupon, 48 reorder. (a) At α=0.05, is there convincing evidence the manager is correct? (b) Based on your conclusion, which error (Type I or II) is possible? Interpret in context.",
        visibleSteps: [
          "H₀: p=0.35 vs Hₐ: p>0.35.",
          "z=(ˆp−0.35)/√(0.35·0.65/120); find p-value.",
          "If fail to reject, Type II is the possible error.",
        ],
        blankSteps: [
          "(a) ˆp=______ z≈______ p-value≈______ conclusion:______",
          "(b) Possible error:______ meaning:______",
        ],
        hints: [
          "L1: ˆp=48/120=0.40.",
          "L2: Use p₀=0.35 in the SE.",
          "L3: Type II = fail to reject false H₀.",
        ],
      },
      {
        id: "stats-inf-3",
        format: "frq_half",
        conceptId: "stats-chi-square",
        conceptIntro: "Homogeneity vs counts misconception.",
        difficultyTier: 2,
        prompt:
          "Independent random samples of teens in three cities report soft-drink use in the past week:\nCity A: Yes 210 / No 90 (n=300)\nCity B: Yes 360 / No 240 (n=600)\nCity C: Yes 400 / No 350 (n=750)\n(a) A researcher claims City A has the lowest likelihood of “Yes” because 210 is the smallest Yes count. Is this correct? (b) Which city has the smallest Yes proportion? (c) Name the appropriate test to compare Yes proportions across cities and state hypotheses.",
        visibleSteps: [
          "Compare proportions, not raw counts.",
          "Compute Yes/n for each city.",
          "Independent samples → χ² test of homogeneity.",
        ],
        blankSteps: [
          "(a) ______",
          "(b) City ______ proportion ______",
          "(c) Procedure:______  H₀:______  Hₐ:______",
        ],
        hints: [
          "L1: A: 210/300=0.70; B: 0.60; C: 400/750≈0.533.",
          "L2: Homogeneity: H₀ says the Yes probability is the same in all three city populations.",
        ],
      },
      {
        id: "stats-inf-4",
        format: "frq_half",
        conceptId: "stats-hypothesis-tests",
        conceptIntro: "Two-proportion z-test for an increase.",
        difficultyTier: 3,
        prompt:
          "In 2022, 14 of 70 randomly sampled roadside weeds were herbicide-resistant. In 2025, 22 of 65 were resistant. Do the data provide convincing evidence at α=0.05 that the proportion resistant has increased?",
        visibleSteps: [
          "H₀: p₂₅=p₂₂ vs Hₐ: p₂₅>p₂₂.",
          "Pooled ˆp_c=(14+22)/(70+65); compute z and p-value.",
          "Conclude in context vs α=0.05.",
        ],
        blankSteps: [
          "ˆp₂₂=______ ˆp₂₅=______ ˆp_c=______",
          "z≈______ p-value≈______",
          "Conclusion: ____________________",
        ],
        hints: [
          "L1: ˆp₂₂=0.2; ˆp₂₅≈0.338.",
          "L2: SE uses pooled ˆp_c under H₀.",
        ],
      },
      {
        id: "stats-inf-5",
        format: "frq_half",
        conceptId: "stats-hypothesis-tests",
        conceptIntro: "Two-sample t + causation from design.",
        difficultyTier: 3,
        prompt:
          "210 patients with similar knee injuries are randomly assigned to standard (n=110, x̄=210 days, s=32) or new surgery (n=100, x̄=182 days, s=28). (a) Does a significant result allow a causal claim that the new procedure reduces mean recovery for patients like these? (b) Test whether the new procedure has smaller mean recovery (α=0.05).",
        visibleSteps: [
          "Random assignment ⇒ causal for this population.",
          "H₀: μ_n=μ_s vs Hₐ: μ_n<μ_s; two-sample t.",
          "t=(182−210)/√(32²/110+28²/100).",
        ],
        blankSteps: [
          "(a) ______",
          "(b) t≈______ conclusion:______",
        ],
        hints: [
          "L1: Design → causation; observational would not.",
          "L2: Large |t| ⇒ tiny p-value ⇒ reject H₀.",
        ],
      },
      {
        id: "stats-inf-6",
        format: "frq_half",
        conceptId: "stats-hypothesis-tests",
        conceptIntro: "Paired t-test on differences.",
        difficultyTier: 3,
        prompt:
          "For 8 car models, one woman and one man bought the same equipped model from the same dealer. Differences (woman − man) have d̄ = $520 and s_d = $480. Do the data provide convincing evidence that women pay more on average (α=0.05)?",
        visibleSteps: [
          "Paired data ⇒ one-sample t on differences.",
          "H₀: μ_d=0 vs Hₐ: μ_d>0.",
          "t = d̄ / (s_d/√n), df = n−1.",
        ],
        blankSteps: [
          "t≈______ df=______",
          "Conclusion: ____________________",
        ],
        hints: [
          "L1: SE = 480/√8.",
          "L2: Compare p-value for t with df=7 to α=0.05.",
        ],
      },
      {
        id: "stats-inf-7",
        format: "frq_half",
        conceptId: "stats-ci-prop-mean",
        conceptIntro: "CI for proportion → interval for cost.",
        difficultyTier: 2,
        prompt:
          "Of 90 random customers who asked for a water cup, 27 filled it with soda. (a) 95% CI for the true proportion who do this. (b) If 2,400 customers ask for water cups in July and each soda-fill costs $0.30, use your CI to give an interval estimate for July’s cost.",
        visibleSteps: [
          "ˆp=27/90; one-prop z-interval.",
          "Multiply interval endpoints by 2400×0.30.",
        ],
        blankSteps: [
          "(a) CI ≈ (______ , ______)",
          "(b) Cost interval ≈ (______ , ______)",
        ],
        hints: [
          "L1: ˆp=0.30.",
          "L2: Cost = (proportion)×2400×0.30.",
        ],
      },
      {
        id: "stats-inf-8",
        format: "frq_half",
        conceptId: "stats-slope-inference",
        conceptIntro: "CI for slope from computer output.",
        difficultyTier: 2,
        prompt:
          "For n=22 houses, regression of selling price (thousands of $) on distance from downtown (miles) gives slope b=−1.95 with SE_b=0.22. Assume inference conditions hold. (a) Construct and interpret a 95% CI for the true slope (t*≈2.086 for df=20). (b) An agent believes price drops about $2,000 per mile (slope −2). Does the CI contradict that belief?",
        visibleSteps: [
          "b ± t* SE_b.",
          "Interpret in thousands of $ per mile.",
          "See if −2 is inside the interval.",
        ],
        blankSteps: [
          "(a) CI ≈ (______ , ______); interpretation:______",
          "(b) Contradict? ______",
        ],
        hints: [
          "L1: df=n−2=20.",
          "L2: If −2 is inside, it does not contradict.",
        ],
      },
      {
        id: "stats-inf-9",
        format: "frq_half",
        conceptId: "stats-chi-square",
        conceptIntro: "Chi-square goodness-of-fit.",
        difficultyTier: 2,
        prompt:
          "A bank’s acceptable wait-time probabilities are 0.30, 0.25, 0.20, 0.15, 0.10 across five categories. In a random sample of 100 customers the observed counts are 28, 22, 19, 18, 13. Conduct a χ² GOF test to see if wait times are inconsistent with the acceptable probabilities.",
        visibleSteps: [
          "H₀: true proportions equal the claimed ones; Hₐ: at least one differs.",
          "Expected = 100×p_i; χ²=Σ(O−E)²/E; df=4.",
          "Compare p-value to α (e.g. 0.05).",
        ],
        blankSteps: [
          "Expected counts: ____________________",
          "χ²≈______ df=______",
          "Conclusion: ____________________",
        ],
        hints: [
          "L1: E = 30, 25, 20, 15, 10.",
          "L2: Moderate χ² with df=4 often means fail to reject.",
        ],
      },
    ],
  },
  {
    id: "stats-gen-mixed-frq",
    title: "Stats — Mixed Mini-FRQ Sprint (Generated)",
    subject: "AP Statistics",
    kind: "generated",
    description:
      "Short mixed drills across all four FRQ topics — quick template recognition practice.",
    generationNote:
      "AI-generated mixed sprint from FRQ专项突破 topic map. Original items. 2026-07-22.",
    estimatedMinutes: 20,
    tags: ["mixed", "sprint", "generated", "FRQ"],
    difficultyTier: 2,
    items: [
      {
        id: "stats-mix-1",
        format: "fill_blank",
        conceptId: "stats-two-var",
        conceptIntro: "r² template sentence.",
        prompt:
          "Complete: “About ____% of the variation in ______ is explained by the linear relationship with ______.” for a model predicting exam score from hours studied with r²=0.71.",
        blankSteps: [
          "71% / exam scores / hours studied (order may vary but must be correct)",
        ],
        hints: ["r²×100 with response variable first, explanatory second."],
      },
      {
        id: "stats-mix-2",
        format: "concept_check",
        conceptId: "stats-sampling-design",
        conceptIntro: "When stratification helps.",
        prompt:
          "A university has two campuses. When would stratifying by campus give a more precise estimate of overall satisfaction than stratifying by gender?",
        hints: [
          "When satisfaction differs more between campuses than between genders (within-campus homogeneity).",
        ],
      },
      {
        id: "stats-mix-3",
        format: "mcq",
        conceptId: "stats-hypothesis-tests",
        conceptIntro: "Type I vs Type II.",
        prompt:
          "A test of H₀: p=0.5 vs Hₐ: p≠0.5 fails to reject H₀. Which error is possible?",
        choices: [
          "A) Type I only",
          "B) Type II only",
          "C) Both Type I and Type II",
          "D) Neither — failing to reject prevents all errors",
        ],
        hints: ["You can only make the error consistent with your decision."],
      },
      {
        id: "stats-mix-4",
        format: "open",
        conceptId: "stats-experiments",
        conceptIntro: "Random assignment procedure.",
        prompt:
          "Describe a valid method to randomly assign 24 students to two equal lab groups (physical dissection vs simulation) for comparing learning gains.",
        hints: [
          "Label 1–24, use RNG / shuffle, first 12 → Group A, rest → Group B.",
          "Mention equal size and chance assignment.",
        ],
      },
      {
        id: "stats-mix-5",
        format: "frq_half",
        conceptId: "stats-random-vars",
        conceptIntro: "Geometric / “first success after”.",
        difficultyTier: 2,
        prompt:
          "An airline upgrades a frequent flyer with probability 0.08 on each flight (independent). Find the probability that the flyer’s first upgrade occurs after the 4th flight (i.e., flights 1–4 are not upgrades).",
        visibleSteps: ["Need 4 consecutive non-upgrades.", "P(no upgrade)=0.92."],
        blankSteps: ["P = ______"],
        hints: ["L1: (0.92)^4.", "L2: “After the 4th” means first four fail."],
      },
    ],
  },
];
