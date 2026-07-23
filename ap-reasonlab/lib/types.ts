export interface Concept {
  id: string;
  title: string;
  subject: string;
  summary: string;
  keyPoints: string[];
  commonMistakes: string[];
  example: string;
}

export interface PracticeQuestion {
  id: string;
  subject: string;
  topic: string;
  question: string;
  visibleSteps: string[];
  blankSteps: string[];
  hints: string[];
}

export type HintLevel = 1 | 2 | 3;

/** All public question sets are AI-generated originals (not pasted exam keys). */
export type QuestionSetKind = "generated";

/** Optional future field — three difficulty tiers (not shown in UI yet). */
export type DifficultyTier = 1 | 2 | 3;

export type QuestionFormat =
  | "mcq"
  | "frq_half"
  | "fill_blank"
  | "concept_check"
  | "open";

export interface QuestionnaireItem {
  id: string;
  format: QuestionFormat;
  prompt: string;
  choices?: string[];
  visibleSteps?: string[];
  blankSteps?: string[];
  hints: string[];
  conceptId?: string;
  conceptIntro?: string;
  /** Future: 1 = intro, 2 = standard, 3 = challenge */
  difficultyTier?: DifficultyTier;
}

export interface Questionnaire {
  id: string;
  title: string;
  subject: string;
  kind: QuestionSetKind;
  description: string;
  /** How this set was produced (e.g. Claude prompt + date) */
  generationNote: string;
  estimatedMinutes: number;
  tags: string[];
  items: QuestionnaireItem[];
  /** Future: filter sets by tier */
  difficultyTier?: DifficultyTier;
}

export type GuideCategory = "ap_content" | "ai_for_ap" | "study_skill";

export interface KeyConceptGuide {
  id: string;
  title: string;
  subject: string;
  category: GuideCategory;
  introduction: string;
  howToUseAI: string[];
  conceptQuestions: {
    id: string;
    prompt: string;
    hints: string[];
  }[];
}

export interface Formula {
  id: string;
  subject: string;
  unit: string;
  name: string;
  expression: string;
  /** New managed formulas may use one complete Markdown + LaTeX body instead of split fields. */
  content?: string;
  variables: string;
  whenToUse: string;
  relatedConceptId?: string;
  /** e.g. College Board AP Physics 1 equation sheet */
  sourceNote: string;
}

export type ChecklistStatus = "done" | "in_progress" | "todo";

export interface ChecklistItem {
  id: string;
  status: ChecklistStatus;
  title: string;
  description: string;
  link?: string;
}
