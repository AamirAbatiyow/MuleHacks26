import { useEffect, useState } from "react";
import {
  dropRegisteredUser,
  getRegisteredUsersForAdmin,
  type PublicUserRow,
} from "@/lib/hackathonStorage";
import { STUDENT_LEVELS, TEAM_PREFERENCES } from "../RegistrationQuestions";

function toProfileUrl(value: string | undefined, baseUrl: string) {
  const trimmed = value?.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^(www\.|github\.com|linkedin\.com)/i.test(trimmed)) return `https://${trimmed}`;
  return `${baseUrl}${trimmed}`;
}

function labelFor(options: readonly { value: string; label: string }[], value?: string | null) {
  return options.find((option) => option.value === value)?.label || "—";
}

function participantEmails(users: PublicUserRow[]) {
  return users.map((user) => user.email).filter(Boolean).join("\n");
}

export function UsersList() {
  const [users, setUsers] = useState<PublicUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [dropTarget, setDropTarget] = useState<PublicUserRow | null>(null);
  const [dropStep, setDropStep] = useState<1 | 2>(1);
  const [typedEmail, setTypedEmail] = useState("");
  const [dropping, setDropping] = useState(false);
  const [dropError, setDropError] = useState("");

  const load = async () => {
    const list = await getRegisteredUsersForAdmin();
    setUsers(list);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await getRegisteredUsersForAdmin();
        if (!cancelled) setUsers(list);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load users");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const emails = participantEmails(users);
  const emailMatches =
    dropTarget !== null && typedEmail.trim().toLowerCase() === dropTarget.email.toLowerCase();

  const copyEmails = async () => {
    if (!emails) return;
    await navigator.clipboard.writeText(emails);
    setCopyStatus(`Copied ${users.length} email${users.length === 1 ? "" : "s"}.`);
  };

  const downloadEmails = () => {
    if (!emails) return;
    const blob = new Blob([`${emails}\n`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mulehacks-participant-emails.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  const closeDrop = () => {
    setDropTarget(null);
    setDropStep(1);
    setTypedEmail("");
    setDropError("");
    setDropping(false);
  };

  const confirmDrop = async () => {
    if (!dropTarget || !emailMatches) return;
    setDropping(true);
    setDropError("");
    try {
      await dropRegisteredUser(dropTarget.email);
      await load();
      closeDrop();
    } catch (err) {
      setDropError(err instanceof Error ? err.message : "Failed to drop participant.");
      setDropping(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl text-white mb-2">Registered users</h2>
          <p className="text-white/70 text-sm">
            From MongoDB Atlas. Passwords are never shown.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void copyEmails()}
            disabled={users.length === 0}
            className="bg-white/10 hover:bg-white/20 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50"
          >
            Copy emails
          </button>
          <button
            type="button"
            onClick={downloadEmails}
            disabled={users.length === 0}
            className="bg-white/10 hover:bg-white/20 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50"
          >
            Download emails
          </button>
        </div>
      </div>
      {copyStatus && <p className="text-white/70 text-sm">{copyStatus}</p>}
      {loading ? (
        <p className="text-white/60 text-sm">Loading…</p>
      ) : error ? (
        <p className="text-red-300 text-sm">{error}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/20 bg-black/30">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/60">
                <th className="p-3 font-medium">Email</th>
                <th className="p-3 font-medium">Name</th>
                <th className="p-3 font-medium">University</th>
                <th className="p-3 font-medium">T-shirt</th>
                <th className="p-3 font-medium">Dietary</th>
                <th className="p-3 font-medium">Phone</th>
                <th className="p-3 font-medium">GitHub</th>
                <th className="p-3 font-medium">LinkedIn</th>
                <th className="p-3 font-medium">Onboarding</th>
                <th className="p-3 font-medium">Rules</th>
                <th className="p-3 font-medium">Student level</th>
                <th className="p-3 font-medium">Team preference</th>
                <th className="p-3 font-medium">Drop</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={13} className="p-6 text-white/50 text-center">
                    No registered users yet.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const githubUrl = toProfileUrl(u.github, "https://github.com/");
                  const linkedinUrl = toProfileUrl(u.linkedin, "https://linkedin.com/in/");

                  return (
                    <tr key={u.email} className="border-b border-white/5 text-white/90">
                      <td className="p-3">{u.email}</td>
                      <td className="p-3">{u.name || "—"}</td>
                      <td className="p-3">{u.university || "—"}</td>
                      <td className="p-3">{u.shirtSize || "—"}</td>
                      <td className="p-3">{u.dietaryRestrictions || "—"}</td>
                      <td className="p-3">{u.phone || "—"}</td>
                      <td className="p-3">
                        {githubUrl ? (
                          <a
                            href={githubUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-white underline decoration-white/40 underline-offset-4 hover:decoration-white"
                          >
                            GitHub
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="p-3">
                        {linkedinUrl ? (
                          <a
                            href={linkedinUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-white underline decoration-white/40 underline-offset-4 hover:decoration-white"
                          >
                            LinkedIn
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="p-3">{u.hasCompletedOnboarding ? "Done" : "Pending"}</td>
                      <td className="p-3">{u.rulesAcknowledged ? "Yes" : "No"}</td>
                      <td className="p-3">{labelFor(STUDENT_LEVELS, u.studentLevel)}</td>
                      <td className="p-3">{labelFor(TEAM_PREFERENCES, u.teamPreference)}</td>
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() => {
                            setDropTarget(u);
                            setDropStep(1);
                            setTypedEmail("");
                            setDropError("");
                          }}
                          className="text-red-300 hover:text-red-200 border border-red-500/40 rounded-lg px-3 py-1 hover:bg-red-950/40"
                        >
                          Drop
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {dropTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md bg-[#140000] border border-white/20 rounded-2xl p-6"
          >
            {dropStep === 1 ? (
              <>
                <h3 className="text-2xl text-white mb-3">Drop this participant?</h3>
                <p className="text-white/80 mb-6">
                  {dropTarget.name || "This participant"} ({dropTarget.email}) will be removed from
                  registration and any team. This cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={closeDrop}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setDropStep(2)}
                    className="flex-1 bg-[#6b0000] hover:bg-[#8b0000] text-white py-2 rounded-lg"
                  >
                    Continue
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-2xl text-white mb-3">Confirm by typing their email</h3>
                <p className="text-white/80 mb-4">
                  Type <span className="text-white">{dropTarget.email}</span> exactly to drop this
                  participant.
                </p>
                <input
                  type="email"
                  value={typedEmail}
                  onChange={(event) => setTypedEmail(event.target.value)}
                  autoComplete="off"
                  className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white mb-4 focus:outline-none focus:border-white"
                  placeholder="Email address"
                />
                {dropError && <p className="text-red-300 text-sm mb-4">{dropError}</p>}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={closeDrop}
                    disabled={dropping}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void confirmDrop()}
                    disabled={!emailMatches || dropping}
                    className="flex-1 bg-red-800 hover:bg-red-700 text-white py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {dropping ? "Dropping..." : "Drop participant"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
