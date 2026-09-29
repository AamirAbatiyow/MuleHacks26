import { Router } from "express";
import { User } from "../models/User.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/top-referrer", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const users = await User.find({
      isAdmin: { $ne: true },
      referredBy: { $exists: true, $nin: [null, ""] },
    })
      .select("referredBy")
      .lean();

    const counts = new Map();
    for (const user of users) {
      const raw = String(user.referredBy || "").trim();
      const key = raw.toLowerCase();
      if (!key || key === "none") continue;
      const current = counts.get(key) || { name: raw, count: 0 };
      current.count += 1;
      counts.set(key, current);
    }

    const ranked = [...counts.values()].sort((a, b) => b.count - a.count);
    const leader = ranked[0];
    const tied = ranked[1] && ranked[1].count === leader.count;
    if (!leader || tied) {
      return res.json({ ok: true, referrer: null });
    }

    return res.json({ ok: true, referrer: { name: leader.name, count: leader.count } });
  } catch (error) {
    console.error("Top referrer failed:", error);
    return res.status(500).json({ ok: false, error: "Failed to load top referrer." });
  }
});

export default router;
