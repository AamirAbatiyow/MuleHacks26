import "dotenv/config";
import express from "express";
import fs from "fs";
import path from "path";
import { Resend } from "resend";
import { fileURLToPath } from "url";
import { connectDb, ensureAdminUser } from "./server/db.js";
import authRoutes from "./server/routes/auth.js";
import usersRoutes from "./server/routes/users.js";
import announcementsRoutes from "./server/routes/announcements.js";
import teamsRoutes from "./server/routes/teams.js";
import statsRoutes from "./server/routes/stats.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.join(__dirname, "dist");
const port = Number(process.env.PORT) || 3000;
const emailFrom = process.env.EMAIL_FROM || "Mule Hacks <hello@mulehacks.com>";
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const app = express();

app.use(express.json());

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function uniqueEmails(emails = []) {
  if (!Array.isArray(emails)) return [];
  return [...new Set(emails.map((email) => String(email).trim()).filter(Boolean))];
}

async function sendConfirmationEmail(email, name = "") {
  if (!resend) {
    console.warn("RESEND_API_KEY is not set. Skipping registration confirmation email.");
    return { ok: true, skipped: true };
  }

  await resend.emails.send({
    from: emailFrom,
    to: email,
    subject: "Registration confirmed for Mule Hacks 2026",
    html: `
      <h1>You're registered for Mule Hacks 2026!</h1>
      <p>Hi ${escapeHtml(name || "there")},</p>
      <p>Your registration is confirmed. Complete onboarding in your dashboard so organizers have your event details.</p>
      <p>We will send important announcements to this email as the event gets closer.</p>
    `,
    text: `You're registered for Mule Hacks 2026!\n\nHi ${name || "there"},\n\nYour registration is confirmed. Complete onboarding in your dashboard so organizers have your event details.\n\nWe will send important announcements to this email as the event gets closer.`,
  });

  return { ok: true, sent: 1 };
}

app.locals.sendConfirmationEmail = (email, name) => {
  void sendConfirmationEmail(email, name).catch((error) => {
    console.error("Failed to send registration confirmation email:", error);
  });
};

async function sendPasswordResetEmail(email, resetUrl) {
  if (!resend) {
    console.warn("RESEND_API_KEY is not set. Skipping password reset email.");
    return { ok: true, skipped: true };
  }

  await resend.emails.send({
    from: emailFrom,
    to: email,
    subject: "Reset your Mule Hacks password",
    html: `
      <h1>Reset your password</h1>
      <p>We received a request to reset the password for this Mule Hacks account.</p>
      <p><a href="${escapeHtml(resetUrl)}">Set a new password</a></p>
      <p>This link expires in 1 hour. If you did not request a reset, you can ignore this email.</p>
    `,
    text: `Reset your Mule Hacks password\n\nOpen this link to set a new password:\n${resetUrl}\n\nThis link expires in 1 hour. If you did not request a reset, you can ignore this email.`,
  });

  return { ok: true, sent: 1 };
}

app.locals.sendPasswordResetEmail = (email, resetUrl) => {
  return sendPasswordResetEmail(email, resetUrl).catch((error) => {
    console.error("Failed to send password reset email:", error);
    throw error;
  });
};

app.post("/api/send-confirmation", async (req, res) => {
  const email = String(req.body?.email || "").trim();
  const name = String(req.body?.name || "").trim();

  if (!email) {
    return res.status(400).json({ ok: false, error: "Email is required." });
  }

  try {
    const result = await sendConfirmationEmail(email, name);
    return res.json(result);
  } catch (error) {
    console.error("Failed to send registration confirmation email:", error);
    return res.status(500).json({ ok: false, error: "Failed to send email." });
  }
});

app.post("/api/send-announcement", async (req, res) => {
  const title = String(req.body?.title || "").trim();
  const message = String(req.body?.message || "").trim();
  const recipients = uniqueEmails(req.body?.recipients);

  if (!title || !message) {
    return res.status(400).json({ ok: false, error: "Title and message are required." });
  }

  if (recipients.length === 0) {
    return res.json({ ok: true, sent: 0 });
  }

  if (!resend) {
    console.warn("RESEND_API_KEY is not set. Skipping announcement email.");
    return res.json({ ok: true, skipped: true, sent: 0, recipients: recipients.length });
  }

  try {
    const batchSize = 50;
    let sent = 0;

    for (let index = 0; index < recipients.length; index += batchSize) {
      const batch = recipients.slice(index, index + batchSize);
      await resend.emails.send({
        from: emailFrom,
        to: emailFrom,
        bcc: batch,
        subject: `Mule Hacks announcement: ${title}`,
        html: `
          <h1>${escapeHtml(title)}</h1>
          <p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>
        `,
        text: `${title}\n\n${message}`,
      });
      sent += batch.length;
    }

    return res.json({ ok: true, sent });
  } catch (error) {
    console.error("Failed to send announcement email:", error);
    return res.status(500).json({ ok: false, error: "Failed to send announcement email." });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/announcements", announcementsRoutes);
app.use("/api/teams", teamsRoutes);
app.use("/api/stats", statsRoutes);

const distExists = fs.existsSync(distPath);
if (distExists) {
  app.use(express.static(distPath, { index: false }));
  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    return res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  console.warn(`dist/ not found at ${distPath}. Serving API only (run Vite for the frontend).`);
}

async function start() {
  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is required.");
    process.exit(1);
  }

  await connectDb(process.env.MONGODB_URI);
  await ensureAdminUser();

  app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
