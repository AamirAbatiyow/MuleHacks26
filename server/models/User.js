import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    name: { type: String, trim: true },
    university: { type: String, trim: true },
    major: { type: String, trim: true },
    year: { type: String, trim: true },
    phone: { type: String, trim: true },
    dietaryRestrictions: { type: String, trim: true },
    shirtSize: { type: String, trim: true },
    github: { type: String, trim: true },
    linkedin: { type: String, trim: true },
    hasCompletedOnboarding: { type: Boolean, default: false },
    rulesAcknowledged: { type: Boolean, default: false },
    rulesAcknowledgedAt: { type: Date, default: null },
    studentLevel: { type: String, default: null },
    teamPreference: { type: String, default: null },
    referredBy: { type: String, default: null, trim: true, maxlength: 80 },
    isAdmin: { type: Boolean, default: false },
    isScanner: { type: Boolean, default: false },
    passwordResetTokenHash: { type: String, default: null },
    passwordResetExpiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export function toPublicUser(doc) {
  if (!doc) return null;
  const user = typeof doc.toObject === "function" ? doc.toObject() : doc;
  return {
    email: user.email,
    name: user.name,
    university: user.university,
    major: user.major,
    year: user.year,
    phone: user.phone,
    dietaryRestrictions: user.dietaryRestrictions,
    shirtSize: user.shirtSize,
    github: user.github,
    linkedin: user.linkedin,
    hasCompletedOnboarding: Boolean(user.hasCompletedOnboarding),
    rulesAcknowledged: Boolean(user.rulesAcknowledged),
    rulesAcknowledgedAt: user.rulesAcknowledgedAt
      ? new Date(user.rulesAcknowledgedAt).toISOString()
      : null,
    studentLevel: user.studentLevel || null,
    teamPreference: user.teamPreference || null,
    referredBy: user.referredBy || null,
    isAdmin: Boolean(user.isAdmin),
    isScanner: Boolean(user.isScanner),
  };
}

export const User = mongoose.models.User || mongoose.model("User", userSchema);
