import { Router } from "express";
import { Team, toStoredTeam } from "../models/Team.js";
import { CheckInEvent } from "../models/CheckInEvent.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

function randomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

async function arrivalEmailSet() {
  const emails = await CheckInEvent.distinct("participantEmail", { station: "arrival" });
  return new Set(emails.map((email) => normalizeEmail(email)));
}

function pendingCheckInEmails(team, arrived) {
  return (team.memberEmails || [])
    .map(normalizeEmail)
    .filter((email) => email && !arrived.has(email));
}

function withCheckInStatus(team, arrived) {
  const stored = toStoredTeam(team);
  stored.pendingCheckInEmails = pendingCheckInEmails(team, arrived);
  return stored;
}

function clearSubmission(team) {
  team.submittedForJudging = false;
  team.submittedAt = null;
  team.submittedByEmail = null;
}

router.get("/", requireAuth, async (_req, res) => {
  try {
    const [teams, arrived] = await Promise.all([Team.find().sort({ createdAt: -1 }), arrivalEmailSet()]);
    return res.json({ ok: true, teams: teams.map((team) => withCheckInStatus(team, arrived)) });
  } catch (error) {
    console.error("List teams failed:", error);
    return res.status(500).json({ ok: false, error: "Failed to list teams." });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const email = req.user.email;
    const existing = await Team.findOne({ memberEmails: email });
    if (existing) {
      const arrived = await arrivalEmailSet();
      return res.status(409).json({
        ok: false,
        error: "You are already on a team.",
        team: withCheckInStatus(existing, arrived),
      });
    }

    const name = String(req.body?.name || "").trim() || "My Team";
    const project = String(req.body?.project || "").trim();
    let code = String(req.body?.code || "")
      .trim()
      .toUpperCase();
    if (!code) code = randomCode();

    const team = await Team.create({
      name,
      code,
      project,
      memberEmails: [email],
    });

    const arrived = await arrivalEmailSet();
    return res.status(201).json({ ok: true, team: withCheckInStatus(team, arrived) });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ ok: false, error: "Team code already in use." });
    }
    console.error("Create team failed:", error);
    return res.status(500).json({ ok: false, error: "Failed to create team." });
  }
});

router.post("/join", requireAuth, async (req, res) => {
  try {
    const email = req.user.email;
    const code = String(req.body?.code || "")
      .trim()
      .toUpperCase();
    if (!code) {
      return res.status(400).json({ ok: false, error: "Team code is required." });
    }

    const already = await Team.findOne({ memberEmails: email });
    if (already) {
      const arrived = await arrivalEmailSet();
      return res.status(409).json({
        ok: false,
        error: "You are already on a team.",
        team: withCheckInStatus(already, arrived),
      });
    }

    const team = await Team.findOne({ code });
    if (!team) {
      return res.status(404).json({ ok: false, error: "Team not found." });
    }
    if (team.memberEmails.length >= 4) {
      return res.status(400).json({ ok: false, error: "This team is full." });
    }

    team.memberEmails.push(email);
    if (team.submittedForJudging) clearSubmission(team);
    await team.save();
    const arrived = await arrivalEmailSet();
    return res.json({ ok: true, team: withCheckInStatus(team, arrived) });
  } catch (error) {
    console.error("Join team failed:", error);
    return res.status(500).json({ ok: false, error: "Failed to join team." });
  }
});

router.post("/:id/submit", requireAuth, async (req, res) => {
  try {
    if (req.user.isAdmin || req.user.isScanner) {
      return res.status(403).json({ ok: false, error: "Only team members can submit for judging." });
    }

    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ ok: false, error: "Team not found." });
    }

    const email = normalizeEmail(req.user.email);
    const isMember = team.memberEmails.map(normalizeEmail).includes(email);
    if (!isMember) {
      return res.status(403).json({ ok: false, error: "Not a member of this team." });
    }

    if (!team.memberEmails.length) {
      return res.status(400).json({ ok: false, error: "This team has no members." });
    }

    const arrived = await arrivalEmailSet();
    const pending = pendingCheckInEmails(team, arrived);
    if (pending.length > 0) {
      return res.status(400).json({
        ok: false,
        error: "Every team member must check in before you can submit for judging.",
        team: withCheckInStatus(team, arrived),
        pendingCheckInEmails: pending,
      });
    }

    const project = String(req.body?.project || "").trim().slice(0, 120);
    if (!project) {
      return res.status(400).json({ ok: false, error: "Project name is required." });
    }

    team.project = project;
    if (!team.submittedForJudging) {
      team.submittedForJudging = true;
      team.submittedAt = new Date();
      team.submittedByEmail = email;
    }
    await team.save();

    return res.json({ ok: true, team: withCheckInStatus(team, arrived) });
  } catch (error) {
    console.error("Submit team failed:", error);
    return res.status(500).json({ ok: false, error: "Failed to submit team." });
  }
});

router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ ok: false, error: "Team not found." });
    }

    const email = req.user.email;
    const isMember = team.memberEmails.includes(email);
    if (!isMember && !req.user.isAdmin) {
      return res.status(403).json({ ok: false, error: "Not a member of this team." });
    }

    if (req.body?.name !== undefined) {
      team.name = String(req.body.name).trim() || team.name;
    }
    if (req.body?.project !== undefined) {
      team.project = String(req.body.project).trim();
    }
    if (Array.isArray(req.body?.memberEmails) && req.user.isAdmin) {
      team.memberEmails = req.body.memberEmails
        .map((e) => String(e).trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 4);
      if (team.submittedForJudging) clearSubmission(team);
    }

    if (req.body?.leave === true) {
      team.memberEmails = team.memberEmails.filter((e) => e !== email);
      if (team.submittedForJudging) clearSubmission(team);
      if (team.memberEmails.length === 0) {
        await team.deleteOne();
        return res.json({ ok: true, team: null });
      }
    }

    await team.save();
    const arrived = await arrivalEmailSet();
    return res.json({ ok: true, team: withCheckInStatus(team, arrived) });
  } catch (error) {
    console.error("Update team failed:", error);
    return res.status(500).json({ ok: false, error: "Failed to update team." });
  }
});

router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const deleted = await Team.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ ok: false, error: "Team not found." });
    }
    return res.json({ ok: true });
  } catch (error) {
    console.error("Delete team failed:", error);
    return res.status(500).json({ ok: false, error: "Failed to delete team." });
  }
});

export default router;
