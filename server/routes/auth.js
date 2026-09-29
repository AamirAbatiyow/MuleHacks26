import { Router } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { User, toPublicUser } from "../models/User.js";
import { requireAuth, signToken } from "../middleware/auth.js";

function hashResetToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function getAppUrl(req) {
  const configured = String(process.env.APP_URL || "").trim();
  if (configured) return configured.replace(/\/$/, "");

  const origin = String(req.get("origin") || "").trim();
  if (origin) return origin.replace(/\/$/, "");

  const proto = req.get("x-forwarded-proto") || req.protocol;
  const host = req.get("x-forwarded-host") || req.get("host");
  return `${proto}://${host}`;
}

const router = Router();

const STUDENT_LEVELS = new Set(["high_school", "undergraduate", "graduate"]);
const TEAM_PREFERENCES = new Set(["have_team", "solo", "make_team"]);

const PROFILE_FIELDS = [
  "name",
  "university",
  "major",
  "year",
  "phone",
  "dietaryRestrictions",
  "shirtSize",
  "github",
  "linkedin",
  "hasCompletedOnboarding",
];

router.post("/register", async (req, res) => {
  try {
    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();
    const password = String(req.body?.password || "");

    if (!email || !password) {
      return res.status(400).json({ ok: false, error: "Email and password are required." });
    }
    if (password.length < 6) {
      return res.status(400).json({ ok: false, error: "Password must be at least 6 characters." });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ ok: false, error: "User already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      email,
      passwordHash,
      hasCompletedOnboarding: false,
      isAdmin: false,
    });

    const token = signToken(user);
    const publicUser = toPublicUser(user);

    // Fire-and-forget confirmation via sibling email route handler pattern
    if (typeof req.app.locals.sendConfirmationEmail === "function") {
      void req.app.locals.sendConfirmationEmail(email);
    }

    return res.status(201).json({ ok: true, token, user: publicUser });
  } catch (error) {
    console.error("Register failed:", error);
    return res.status(500).json({ ok: false, error: "Registration failed." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();
    const password = String(req.body?.password || "");

    if (!email || !password) {
      return res.status(400).json({ ok: false, error: "Email and password are required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ ok: false, error: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ ok: false, error: "Invalid credentials" });
    }

    const token = signToken(user);
    return res.json({ ok: true, token, user: toPublicUser(user) });
  } catch (error) {
    console.error("Login failed:", error);
    return res.status(500).json({ ok: false, error: "Login failed." });
  }
});

router.post("/forgot-password", async (req, res) => {
  const genericMessage =
    "If an account exists for that email, we sent a password reset link.";

  try {
    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();

    if (!email) {
      return res.status(400).json({ ok: false, error: "Email is required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ ok: true, message: genericMessage });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetTokenHash = hashResetToken(rawToken);
    user.passwordResetExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const resetUrl = `${getAppUrl(req)}/reset-password?token=${rawToken}`;
    if (typeof req.app.locals.sendPasswordResetEmail === "function") {
      await req.app.locals.sendPasswordResetEmail(email, resetUrl);
    }

    return res.json({ ok: true, message: genericMessage });
  } catch (error) {
    console.error("Forgot password failed:", error);
    return res.status(500).json({ ok: false, error: "Failed to send reset email." });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const token = String(req.body?.token || "").trim();
    const password = String(req.body?.password || "");

    if (!token || !password) {
      return res.status(400).json({ ok: false, error: "Token and password are required." });
    }
    if (password.length < 6) {
      return res.status(400).json({ ok: false, error: "Password must be at least 6 characters." });
    }

    const user = await User.findOne({
      passwordResetTokenHash: hashResetToken(token),
      passwordResetExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ ok: false, error: "This reset link is invalid or has expired." });
    }

    user.passwordHash = await bcrypt.hash(password, 12);
    user.passwordResetTokenHash = null;
    user.passwordResetExpiresAt = null;
    await user.save();

    return res.json({ ok: true, message: "Password updated. You can sign in now." });
  } catch (error) {
    console.error("Reset password failed:", error);
    return res.status(500).json({ ok: false, error: "Failed to reset password." });
  }
});

router.get("/me", requireAuth, (req, res) => {
  return res.json({ ok: true, user: req.publicUser });
});

router.patch("/profile", requireAuth, async (req, res) => {
  try {
    const updates = {};
    for (const field of PROFILE_FIELDS) {
      if (req.body?.[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (req.body?.studentLevel !== undefined) {
      const studentLevel = String(req.body.studentLevel);
      if (!STUDENT_LEVELS.has(studentLevel)) {
        return res.status(400).json({ ok: false, error: "Invalid student level." });
      }
      updates.studentLevel = studentLevel;
    }

    if (req.body?.teamPreference !== undefined) {
      const teamPreference = String(req.body.teamPreference);
      if (!TEAM_PREFERENCES.has(teamPreference)) {
        return res.status(400).json({ ok: false, error: "Invalid team preference." });
      }
      updates.teamPreference = teamPreference;
    }

    if (req.body?.referredBy !== undefined) {
      const referredBy = String(req.body.referredBy).trim().slice(0, 80);
      if (!referredBy) {
        return res.status(400).json({ ok: false, error: "Referral is required." });
      }
      updates.referredBy = referredBy.toLowerCase() === "none" ? "none" : referredBy;
    }

    if (req.body?.rulesAcknowledged !== undefined) {
      if (typeof req.body.rulesAcknowledged !== "boolean") {
        return res.status(400).json({ ok: false, error: "Invalid rules acknowledgment." });
      }
      updates.rulesAcknowledged = req.body.rulesAcknowledged;
      updates.rulesAcknowledgedAt = req.body.rulesAcknowledged ? new Date() : null;
    }

    Object.assign(req.user, updates);
    await req.user.save();
    return res.json({ ok: true, user: toPublicUser(req.user) });
  } catch (error) {
    console.error("Profile update failed:", error);
    return res.status(500).json({ ok: false, error: "Failed to update profile." });
  }
});

export default router;
