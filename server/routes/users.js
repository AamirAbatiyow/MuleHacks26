import { Router } from "express";
import { User, toPublicUser } from "../models/User.js";
import { Team } from "../models/Team.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const users = await User.find({ isAdmin: { $ne: true } })
      .sort({ createdAt: -1 })
      .lean();
    return res.json({
      ok: true,
      users: users.map((u) => toPublicUser(u)),
    });
  } catch (error) {
    console.error("List users failed:", error);
    return res.status(500).json({ ok: false, error: "Failed to list users." });
  }
});

router.delete("/:email", requireAuth, requireAdmin, async (req, res) => {
  try {
    const email = decodeURIComponent(String(req.params.email || ""))
      .trim()
      .toLowerCase();
    if (!email) {
      return res.status(400).json({ ok: false, error: "Email is required." });
    }

    const user = await User.findOne({ email });
    if (!user || user.isAdmin) {
      return res.status(404).json({ ok: false, error: "Participant not found." });
    }

    const teams = await Team.find({ memberEmails: email });
    for (const team of teams) {
      team.memberEmails = team.memberEmails.filter((member) => member.toLowerCase() !== email);
      if (team.memberEmails.length === 0) {
        await team.deleteOne();
      } else {
        await team.save();
      }
    }

    await user.deleteOne();
    return res.json({ ok: true });
  } catch (error) {
    console.error("Drop user failed:", error);
    return res.status(500).json({ ok: false, error: "Failed to drop participant." });
  }
});

export default router;
