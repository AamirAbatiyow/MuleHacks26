import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { SeoHead } from "../components/SeoHead";
import { ApiError } from "@/lib/api";
import {
  getJudgeTeams,
  saveJudgeScore,
  type JudgeTeamRow,
} from "@/lib/hackathonStorage";
import {
  JUDGE_FORMATS,
  RUBRIC,
  formatLabel,
  rubricTotal,
  type JudgeFormat,
  type RubricScores,
} from "@/data/rubric";

const JUDGE_KEY = "mh_judge_name";

type Step = "name" | "list" | "score" | "saved";

const emptyScores = () =>
  Object.fromEntries(RUBRIC.map((item) => [item.key, 0])) as RubricScores;

export function JudgePage() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [judgeName, setJudgeName] = useState("");
  const [nameDraft, setNameDraft] = useState("");
  const [step, setStep] = useState<Step>("name");
  const [teams, setTeams] = useState<JudgeTeamRow[]>([]);
  const [team, setTeam] = useState<JudgeTeamRow | null>(null);
  const [format, setFormat] = useState<JudgeFormat | null>(null);
  const [scores, setScores] = useState<RubricScores>(emptyScores);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem(JUDGE_KEY) || "";
    if (saved) {
      setJudgeName(saved);
      setStep("list");
    }
  }, []);

  useEffect(() => {
    if (!judgeName || step !== "list") return;
    let cancelled = false;
    setBusy(true);
    setError("");
    getJudgeTeams(judgeName)
      .then((rows) => {
        if (!cancelled) setTeams(rows);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Could not load teams.");
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [judgeName, step]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const saveName = (event: FormEvent) => {
    event.preventDefault();
    const name = nameDraft.trim();
    if (!name) {
      setError("Enter your name.");
      return;
    }
    sessionStorage.setItem(JUDGE_KEY, name);
    setJudgeName(name);
    setError("");
    setStep("list");
  };

  const openFormat = (row: JudgeTeamRow, nextFormat: JudgeFormat) => {
    const existing = nextFormat === "devpost" ? row.devpost : row.liveDemo;
    const nextScores = emptyScores();
    if (existing) {
      for (const item of RUBRIC) {
        nextScores[item.key] = Number(existing.scores[item.key]) || 0;
      }
    }
    setTeam(row);
    setFormat(nextFormat);
    setScores(nextScores);
    setNotes(existing?.notes || "");
    setError("");
    setStep("score");
  };

  const submitScore = async (event: FormEvent) => {
    event.preventDefault();
    if (!team || !format) return;
    if (RUBRIC.some((item) => scores[item.key] < 1)) {
      setError("Score every category from 1 to 5.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await saveJudgeScore({
        teamId: team.id,
        judgeName,
        format,
        scores,
        notes,
      });
      setStep("saved");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save this score.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand text-white">
      <SeoHead title="Judging" description="Score submitted Mule Hacks teams." />
      <header className="border-b border-white/10 px-4 py-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-white/50">Mule Hacks judging</p>
          <h1 className="text-xl">{judgeName || "Judge"}</h1>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {user?.email ? <p className="text-white/40 text-xs">Signed in as {user.email}</p> : null}
        {error ? <p className="text-red-300">{error}</p> : null}

        {step === "name" && (
          <form onSubmit={saveName} className="bg-black/30 border border-white/20 rounded-xl p-6 space-y-4">
            <h2 className="text-2xl">What is your name?</h2>
            <p className="text-white/70">This name is stored with every score you submit.</p>
            <input
              value={nameDraft}
              onChange={(event) => setNameDraft(event.target.value)}
              className="w-full rounded-lg bg-black/40 border border-white/20 px-3 py-3"
              placeholder="Judge name"
              autoFocus
            />
            <button type="submit" className="bg-white text-black rounded-lg px-4 py-3 font-medium">
              Continue
            </button>
          </form>
        )}

        {step === "list" && (
          <section className="space-y-4">
            <h2 className="text-2xl">Submitted teams</h2>
            {busy && !teams.length ? <p className="text-white/60">Loading teams…</p> : null}
            {!busy && !teams.length ? (
              <p className="text-white/70">No teams have submitted for judging yet.</p>
            ) : null}
            {teams.map((row) => (
              <article key={row.id} className="bg-black/30 border border-white/20 rounded-xl p-5 space-y-3">
                <div>
                  <h3 className="text-xl">{row.name}</h3>
                  <p className="text-white/70">{row.project || "Project name not listed"}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {JUDGE_FORMATS.map((item) => {
                    const existing = item.id === "devpost" ? row.devpost : row.liveDemo;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => openFormat(row, item.id)}
                        className="rounded-lg border border-white/20 px-4 py-2 hover:border-white"
                      >
                        {item.label}
                        {existing ? ` · ${existing.total}/30` : ""}
                      </button>
                    );
                  })}
                </div>
              </article>
            ))}
          </section>
        )}

        {step === "score" && team && format && (
          <form onSubmit={submitScore} className="space-y-5">
            <button
              type="button"
              onClick={() => setStep("list")}
              className="text-white/70 hover:text-white"
            >
              Back to teams
            </button>
            <div>
              <h2 className="text-2xl">{team.name}</h2>
              <p className="text-white/70">{team.project}</p>
              <p className="text-white/50 text-sm mt-1">{formatLabel(format)} · {judgeName}</p>
            </div>
            <p className="text-white/80">1 = poor, 3 = solid, 5 = exceptional</p>
            {RUBRIC.map((item) => (
              <fieldset key={item.key} className="bg-black/30 border border-white/20 rounded-xl p-4">
                <legend className="px-1 font-medium">{item.label}</legend>
                <p className="text-white/70 text-sm mb-3">{item.description}</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <label
                      key={value}
                      className={`flex-1 text-center rounded-lg border px-2 py-3 cursor-pointer ${
                        scores[item.key] === value ? "bg-white text-black border-white" : "border-white/20"
                      }`}
                    >
                      <input
                        type="radio"
                        name={item.key}
                        value={value}
                        checked={scores[item.key] === value}
                        onChange={() => setScores((current) => ({ ...current, [item.key]: value }))}
                        className="sr-only"
                      />
                      {value}
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
            <p className="text-xl">Total {rubricTotal(scores)} / 30</p>
            <label className="block space-y-2">
              <span>Notes</span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={4}
                className="w-full rounded-lg bg-black/40 border border-white/20 px-3 py-3"
                placeholder="Optional notes for the organizers"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="bg-white text-black rounded-lg px-4 py-3 font-medium disabled:opacity-60"
            >
              {busy ? "Saving…" : "Submit score"}
            </button>
          </form>
        )}

        {step === "saved" && (
          <section className="bg-black/30 border border-white/20 rounded-xl p-6 space-y-4">
            <h2 className="text-2xl">Score saved</h2>
            <p className="text-white/70">
              {team?.name} · {format ? formatLabel(format) : ""} · {rubricTotal(scores)} / 30
            </p>
            <button
              type="button"
              onClick={() => setStep("list")}
              className="bg-white text-black rounded-lg px-4 py-3 font-medium"
            >
              Back to teams
            </button>
          </section>
        )}
      </main>
    </div>
  );
}
