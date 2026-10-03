import jwt from "jsonwebtoken";
import { User, toPublicUser } from "../models/User.js";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is required.");
  }
  return secret;
}

export function signToken(user) {
  return jwt.sign(
    { sub: String(user._id), email: user.email, isAdmin: Boolean(user.isAdmin) },
    getJwtSecret(),
    { expiresIn: "30d" }
  );
}

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
    if (!token) {
      return res.status(401).json({ ok: false, error: "Authentication required." });
    }

    const payload = jwt.verify(token, getJwtSecret());
    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(401).json({ ok: false, error: "Invalid session." });
    }

    req.user = user;
    req.publicUser = toPublicUser(user);
    return next();
  } catch {
    return res.status(401).json({ ok: false, error: "Invalid or expired token." });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ ok: false, error: "Admin access required." });
  }
  return next();
}

export function requireScanner(req, res, next) {
  if (!req.user?.isScanner) {
    return res.status(403).json({ ok: false, error: "Scanner access required." });
  }
  return next();
}
