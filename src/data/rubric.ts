export const RUBRIC = [
  {
    key: "innovation",
    label: "Innovation / Creativity",
    description: "Is the idea unique or approached creatively?",
  },
  {
    key: "technical",
    label: "Technical Implementation",
    description: "How well was it built? Does it work?",
  },
  {
    key: "impact",
    label: "Impact / Usefulness",
    description: "Does it solve a meaningful problem?",
  },
  {
    key: "design",
    label: "Design / User Experience",
    description: "Is it intuitive and polished?",
  },
  {
    key: "learning",
    label: "Learning / Growth",
    description: "Did the team learn something new, challenge themselves, or grow technically?",
  },
  {
    key: "presentation",
    label: "Presentation / Demo",
    description: "Did they clearly explain and demonstrate the project?",
  },
] as const;

export type RubricKey = (typeof RUBRIC)[number]["key"];
export type RubricScores = Record<RubricKey, number>;
export type JudgeFormat = "devpost" | "live_demo";

export const JUDGE_FORMATS: { id: JudgeFormat; label: string }[] = [
  { id: "devpost", label: "Devpost" },
  { id: "live_demo", label: "Live demo" },
];

export function formatLabel(format: JudgeFormat) {
  return JUDGE_FORMATS.find((item) => item.id === format)?.label || format;
}

export function rubricTotal(scores: Partial<RubricScores>) {
  return RUBRIC.reduce((sum, item) => sum + (Number(scores[item.key]) || 0), 0);
}
