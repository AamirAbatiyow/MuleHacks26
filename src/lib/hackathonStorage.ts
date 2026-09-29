import { apiFetch } from "@/lib/api";

export type AnnouncementComment = {
  author: string;
  message: string;
  time: string;
};

export type StoredAnnouncement = {
  id: string;
  title: string;
  message: string;
  author: string;
  createdAt: string;
  comments: AnnouncementComment[];
};

export type StoredTeam = {
  id: string;
  name: string;
  code: string;
  project?: string;
  memberEmails: string[];
};

export type PublicUserRow = {
  email: string;
  name?: string;
  university?: string;
  major?: string;
  year?: string;
  phone?: string;
  dietaryRestrictions?: string;
  shirtSize?: string;
  github?: string;
  linkedin?: string;
  hasCompletedOnboarding: boolean;
  rulesAcknowledged?: boolean;
  studentLevel?: "high_school" | "undergraduate" | "graduate" | null;
  teamPreference?: "have_team" | "solo" | "make_team" | null;
};

export async function getAnnouncements(): Promise<StoredAnnouncement[]> {
  const data = await apiFetch<{ announcements: StoredAnnouncement[] }>("/api/announcements");
  return data.announcements ?? [];
}

export async function addAnnouncement(
  title: string,
  message: string
): Promise<StoredAnnouncement> {
  const data = await apiFetch<{ announcement: StoredAnnouncement }>("/api/announcements", {
    method: "POST",
    body: JSON.stringify({ title, message }),
  });
  return data.announcement;
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await apiFetch(`/api/announcements/${id}`, { method: "DELETE" });
}

export async function getTeams(): Promise<StoredTeam[]> {
  const data = await apiFetch<{ teams: StoredTeam[] }>("/api/teams");
  return data.teams ?? [];
}

export async function createTeam(input: {
  name?: string;
  project?: string;
  code?: string;
}): Promise<StoredTeam> {
  const data = await apiFetch<{ team: StoredTeam }>("/api/teams", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.team;
}

export async function joinTeam(code: string): Promise<StoredTeam> {
  const data = await apiFetch<{ team: StoredTeam }>("/api/teams/join", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
  return data.team;
}

export async function leaveTeam(teamId: string): Promise<void> {
  await apiFetch(`/api/teams/${teamId}`, {
    method: "PATCH",
    body: JSON.stringify({ leave: true }),
  });
}

export async function getTopReferrer(): Promise<{ name: string; count: number } | null> {
  const data = await apiFetch<{ referrer: { name: string; count: number } | null }>(
    "/api/stats/top-referrer"
  );
  return data.referrer ?? null;
}

export async function getRegisteredUsersForAdmin(): Promise<PublicUserRow[]> {
  const data = await apiFetch<{ users: PublicUserRow[] }>("/api/users");
  return data.users ?? [];
}

export async function dropRegisteredUser(email: string): Promise<void> {
  await apiFetch(`/api/users/${encodeURIComponent(email)}`, { method: "DELETE" });
}

export function formatAnnouncementTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Recently";
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}
