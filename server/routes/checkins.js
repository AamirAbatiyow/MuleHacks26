import { Router } from "express";
import { User } from "../models/User.js";
import { Team } from "../models/Team.js";
import {
  CheckInEvent,
  CHECK_IN_STATIONS,
  toStoredCheckIn,
} from "../models/CheckInEvent.js";
import { requireAuth, requireAdmin, requireScanner } from "../middleware/auth.js";

const router = Router();
const RECENT_MS = 5 * 60 * 1000;

export function parseParticipantQuery(raw) {
  const value = String(raw || "").trim();
  if (!value) return "";
  const match = value.match(/^MULEHACKS2026-(.+)$/i);
  const email = (match ? match[1] : value).trim().toLowerCase();
  return email;
}

async function findParticipant(email) {
  if (!email) return null;
  const user = await User.findOne({ email }).lean();
  if (!user || user.isAdmin || user.isScanner) return null;
  return user;
}

async function participantSummary(user) {
  const team = await Team.findOne({ memberEmails: user.email }).lean();
  return {
    email: user.email,
    name: user.name || "",
    university: user.university || "",
    dietaryRestrictions: user.dietaryRestrictions || "",
    shirtSize: user.shirtSize || "",
    teamName: team?.name || "",
    hasCompletedOnboarding: Boolean(user.hasCompletedOnboarding),
  };
}

router.get("/lookup", requireAuth, requireScanner, async (req, res) => {
  try {
    const email = parseParticipantQuery(req.query?.q);
    if (!email) {
      return res.status(400).json({ ok: false, error: "Email or QR code is required." });
    }

    const user = await findParticipant(email);
    if (!user) {
      return res.status(404).json({ ok: false, error: "Participant not found." });
    }

    return res.json({ ok: true, participant: await participantSummary(user) });
  } catch (error) {
    console.error("Check-in lookup failed:", error);
    return res.status(500).json({ ok: false, error: "Failed to look up participant." });
  }
});

router.post("/", requireAuth, requireScanner, async (req, res) => {
  try {
    const email = parseParticipantQuery(req.body?.qrPayload || req.body?.email || req.body?.q);
    const station = String(req.body?.station || "").trim();
    const organizerName = String(req.body?.organizerName || "").trim().slice(0, 80);

    if (!email) {
      return res.status(400).json({ ok: false, error: "Email or QR code is required." });
    }
    if (!CHECK_IN_STATIONS.includes(station)) {
      return res.status(400).json({ ok: false, error: "Invalid station." });
    }
    if (!organizerName) {
      return res.status(400).json({ ok: false, error: "Organizer name is required." });
    }

    const user = await findParticipant(email);
    if (!user) {
      return res.status(404).json({ ok: false, error: "Participant not found." });
    }

    const recent = await CheckInEvent.findOne({
      participantEmail: email,
      station,
      createdAt: { $gte: new Date(Date.now() - RECENT_MS) },
    })
      .sort({ createdAt: -1 })
      .lean();

    const event = await CheckInEvent.create({
      participantEmail: email,
      participantName: user.name || "",
      station,
      organizerName,
      scannedByEmail: req.user.email,
    });

    return res.status(201).json({
      ok: true,
      event: toStoredCheckIn(event),
      participant: await participantSummary(user),
      recentDuplicate: Boolean(recent),
    });
  } catch (error) {
    console.error("Check-in create failed:", error);
    return res.status(500).json({ ok: false, error: "Failed to log check-in." });
  }
});

router.get("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const filter = {};
    const email = String(req.query?.email || "")
      .trim()
      .toLowerCase();
    if (email) filter.participantEmail = email;

    const events = await CheckInEvent.find(filter).sort({ createdAt: -1 }).limit(500).lean();
    return res.json({
      ok: true,
      events: events.map(toStoredCheckIn),
    });
  } catch (error) {
    console.error("List check-ins failed:", error);
    return res.status(500).json({ ok: false, error: "Failed to list check-ins." });
  }
});

export default router;
