import { Router } from "express";
import { Team } from "../models/Team.js";
import {
  JudgeScore,
  JUDGE_FORMATS,
  RUBRIC_KEYS,
  toStoredJudgeScore,
} from "../models/JudgeScore.js";
import { requireAuth, requireAdmin, requireJudge } from "../middleware/auth.js";

const router = Router();

function judgeNameKey(name) {
  return String(name || "").trim().toLowerCase();
}

function readScores(body) {
  const scores = {};
  for (const key of RUBRIC_KEYS) {
    const value = Number(body?.scores?.[key]);
    if (!Number.isInteger(value) || value < 1 || value > 5) return null;
    scores[key] = value;
  }
  return scores;
}

function average(values) {
  if (!values.length) return null;
  const sum = values.reduce((total, value) => total + value, 0);
  return Math.round((sum / values.length) * 10) / 10;
}

router.get("/teams", requireAuth, requireJudge, async (req, res) => {
  try {
    const key = judgeNameKey(req.query?.judgeName);
    if (!key) {
      return res.status(400).json({ ok: false, error: "Judge name is required." });
    }

    const teams = await Team.find({ submittedForJudging: true }).sort({ name: 1 }).lean();
    const scores = await JudgeScore.find({
      teamId: { $in: teams.map((team) => team._id) },
      judgeNameKey: key,
    }).lean();

    return res.json({
      ok: true,
      teams: teams.map((team) => {
        const mine = scores.filter((score) => String(score.teamId) === String(team._id));
        return {
          id: String(team._id),
          name: team.name,
          project: team.project || "",
          devpost: toStoredJudgeScore(mine.find((score) => score.format === "devpost")),
          liveDemo: toStoredJudgeScore(mine.find((score) => score.format === "live_demo")),
        };
      }),
    });
  } catch (error) {
    console.error("List judging teams failed:", error);
    return res.status(500).json({ ok: false, error: "Failed to load submitted teams." });
  }
});

router.post("/scores", requireAuth, requireJudge, async (req, res) => {
  try {
    const judgeName = String(req.body?.judgeName || "").trim().slice(0, 80);
    const key = judgeNameKey(judgeName);
    const format = String(req.body?.format || "").trim();
    const teamId = String(req.body?.teamId || "").trim();
    const notes = String(req.body?.notes || "").trim().slice(0, 2000);
    const scores = readScores(req.body);

    if (!key) {
      return res.status(400).json({ ok: false, error: "Judge name is required." });
    }
    if (!JUDGE_FORMATS.includes(format)) {
      return res.status(400).json({ ok: false, error: "Choose Devpost or live demo." });
    }
    if (!scores) {
      return res.status(400).json({ ok: false, error: "Score every category from 1 to 5." });
    }

    const team = await Team.findById(teamId);
    if (!team || !team.submittedForJudging) {
      return res.status(404).json({ ok: false, error: "Submitted team not found." });
    }

    const total = RUBRIC_KEYS.reduce((sum, rubricKey) => sum + scores[rubricKey], 0);
    const score = await JudgeScore.findOneAndUpdate(
      { teamId: team._id, judgeNameKey: key, format },
      {
        $set: {
          teamId: team._id,
          teamName: team.name,
          projectName: team.project || "",
          judgeName,
          judgeNameKey: key,
          scoredByEmail: req.user.email,
          format,
          scores,
          notes,
          total,
        },
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true, runValidators: true }
    );

    return res.json({ ok: true, score: toStoredJudgeScore(score) });
  } catch (error) {
    console.error("Save judge score failed:", error);
    return res.status(500).json({ ok: false, error: "Failed to save score." });
  }
});

router.get("/results", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const [teams, scores] = await Promise.all([
      Team.find({ submittedForJudging: true }).sort({ name: 1 }).lean(),
      JudgeScore.find().sort({ updatedAt: -1 }).lean(),
    ]);

    return res.json({
      ok: true,
      teams: teams.map((team) => {
        const sheets = scores
          .filter((score) => String(score.teamId) === String(team._id))
          .map(toStoredJudgeScore);
        const categoryAverages = {};
        for (const key of RUBRIC_KEYS) {
          categoryAverages[key] = average(sheets.map((sheet) => sheet.scores[key]));
        }
        return {
          id: String(team._id),
          name: team.name,
          project: team.project || "",
          averageTotal: average(sheets.map((sheet) => sheet.total)),
          categoryAverages,
          scores: sheets,
        };
      }),
    });
  } catch (error) {
    console.error("Judge results failed:", error);
    return res.status(500).json({ ok: false, error: "Failed to load judging results." });
  }
});

export default router;
