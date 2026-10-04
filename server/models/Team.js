import mongoose from "mongoose";

const teamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    project: { type: String, trim: true, default: "" },
    memberEmails: {
      type: [String],
      default: [],
      validate: {
        validator(emails) {
          return Array.isArray(emails) && emails.length <= 4;
        },
        message: "Teams can have at most 4 members.",
      },
    },
    submittedForJudging: { type: Boolean, default: false },
    submittedAt: { type: Date, default: null },
    submittedByEmail: { type: String, default: null, lowercase: true, trim: true },
  },
  { timestamps: true }
);

export function toStoredTeam(doc) {
  if (!doc) return null;
  const t = typeof doc.toObject === "function" ? doc.toObject() : doc;
  return {
    id: String(t._id),
    name: t.name,
    code: t.code,
    project: t.project || "",
    memberEmails: Array.isArray(t.memberEmails) ? t.memberEmails : [],
    submittedForJudging: Boolean(t.submittedForJudging),
    submittedAt: t.submittedAt ? new Date(t.submittedAt).toISOString() : null,
    submittedByEmail: t.submittedByEmail || null,
    pendingCheckInEmails: Array.isArray(t.pendingCheckInEmails) ? t.pendingCheckInEmails : [],
  };
}

export const Team = mongoose.models.Team || mongoose.model("Team", teamSchema);
