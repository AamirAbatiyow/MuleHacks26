import mongoose from "mongoose";

export const JUDGE_FORMATS = ["devpost", "live_demo"];

export const RUBRIC_KEYS = [
  "innovation",
  "technical",
  "impact",
  "design",
  "learning",
  "presentation",
];

const scoreFields = Object.fromEntries(
  RUBRIC_KEYS.map((key) => [key, { type: Number, required: true, min: 1, max: 5 }])
);

const judgeScoreSchema = new mongoose.Schema(
  {
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true },
    teamName: { type: String, required: true, trim: true },
    projectName: { type: String, required: true, trim: true },
    judgeName: { type: String, required: true, trim: true },
    judgeNameKey: { type: String, required: true, lowercase: true, trim: true },
    scoredByEmail: { type: String, required: true, lowercase: true, trim: true },
    format: { type: String, required: true, enum: JUDGE_FORMATS },
    scores: scoreFields,
    notes: { type: String, trim: true, default: "", maxlength: 2000 },
    total: { type: Number, required: true, min: 6, max: 30 },
  },
  { timestamps: true }
);

judgeScoreSchema.index({ teamId: 1, judgeNameKey: 1, format: 1 }, { unique: true });

export function toStoredJudgeScore(doc) {
  if (!doc) return null;
  const score = typeof doc.toObject === "function" ? doc.toObject() : doc;
  return {
    id: String(score._id),
    teamId: String(score.teamId),
    teamName: score.teamName,
    projectName: score.projectName,
    judgeName: score.judgeName,
    format: score.format,
    scores: score.scores,
    notes: score.notes || "",
    total: score.total,
    updatedAt: new Date(score.updatedAt).toISOString(),
  };
}

export const JudgeScore =
  mongoose.models.JudgeScore || mongoose.model("JudgeScore", judgeScoreSchema);
