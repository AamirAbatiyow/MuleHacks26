import { Router } from "express";
import { User, toPublicUser } from "../models/User.js";
import { Team } from "../models/Team.js";
import { CheckInEvent } from "../models/CheckInEvent.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const users = await User.find({
      isAdmin: { $ne: true },
      isScanner: { $ne: true },
      isJudge: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .lean();

    const arrivalEmails = await CheckInEvent.distinct("participantEmail", {
      station: "arrival",
    });
    const arrived = new Set(arrivalEmails.map((email) => String(email).toLowerCase()));
    const counts = await CheckInEvent.aggregate([
      { $group: { _id: "$participantEmail", count: { $sum: 1 } } },
    ]);
    const countByEmail = new Map(
      counts.map((row) => [String(row._id).toLowerCase(), row.count])
    );

    return res.json({
      ok: true,
      users: users.map((u) => {
        const email = String(u.email).toLowerCase();
        return {
          ...toPublicUser(u),
          checkedIn: arrived.has(email),
          checkInCount: countByEmail.get(email) || 0,
        };
      }),
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
    if (!user || user.isAdmin || user.isScanner || user.isJudge) {
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
