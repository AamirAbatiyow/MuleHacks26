import express from "express";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { User } from "./server/models/User.js";
import { Team } from "./server/models/Team.js";
import authRoutes from "./server/routes/auth.js";
import teamsRoutes from "./server/routes/teams.js";

process.env.JWT_SECRET = "team-roster-regression-secret";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function request(base, path, { method = "GET", token, body } = {}) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  return { status: response.status, data };
}

const memory = await MongoMemoryServer.create();
await mongoose.connect(memory.getUri());

const passwordHash = await bcrypt.hash("password", 4);
await User.create([
  { email: "lead@test.com", passwordHash, name: "Lead", hasCompletedOnboarding: true },
  { email: "mate@test.com", passwordHash, name: "Mate", hasCompletedOnboarding: true },
  { email: "outsider@test.com", passwordHash, name: "Outsider", hasCompletedOnboarding: true },
]);

const team = await Team.create({
  name: "Red Team",
  code: "RED1",
  project: "Campus Map",
  memberEmails: ["lead@test.com", "mate@test.com"],
  submittedForJudging: true,
  submittedAt: new Date(),
  submittedByEmail: "lead@test.com",
});

const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/teams", teamsRoutes);
const server = app.listen(0);
const base = `http://127.0.0.1:${server.address().port}`;

async function tokenFor(email) {
  const login = await request(base, "/api/auth/login", {
    method: "POST",
    body: { email, password: "password" },
  });
  assert(login.status === 200, `login failed for ${email}`);
  return login.data.token;
}

const lead = await tokenFor("lead@test.com");
const mate = await tokenFor("mate@test.com");
const outsider = await tokenFor("outsider@test.com");

const selfRemove = await request(base, `/api/teams/${team.id}`, {
  method: "PATCH",
  token: lead,
  body: { removeEmail: "lead@test.com" },
});
assert(selfRemove.status === 400, "a member cannot drop themselves");

const outsiderRemove = await request(base, `/api/teams/${team.id}`, {
  method: "PATCH",
  token: outsider,
  body: { removeEmail: "mate@test.com" },
});
assert(outsiderRemove.status === 403, "someone outside the team cannot drop a member");

const removed = await request(base, `/api/teams/${team.id}`, {
  method: "PATCH",
  token: lead,
  body: { removeEmail: "Mate@test.com" },
});
assert(removed.status === 200, "a member can drop a teammate");
assert(removed.data.team.memberEmails.length === 1, "dropped teammate is gone");
assert(removed.data.team.memberEmails[0] === "lead@test.com", "the remaining member stays");
assert(removed.data.team.submittedForJudging === false, "dropping a teammate clears the judging submission");

const missing = await request(base, `/api/teams/${team.id}`, {
  method: "PATCH",
  token: lead,
  body: { removeEmail: "nobody@test.com" },
});
assert(missing.status === 404, "unknown teammates cannot be dropped");

const left = await request(base, `/api/teams/${team.id}`, {
  method: "PATCH",
  token: lead,
  body: { leave: true },
});
assert(left.status === 200 && left.data.team === null, "the last member can still leave");
assert((await Team.countDocuments({ _id: team.id })) === 0, "an empty team is deleted");

const mateStillThere = await request(base, "/api/teams", { token: mate });
assert(
  !mateStillThere.data.teams.some((row) => row.memberEmails.includes("mate@test.com")),
  "a dropped teammate is no longer on a team"
);

console.log("team roster regression passed");
server.close();
await mongoose.disconnect();
await memory.stop();
