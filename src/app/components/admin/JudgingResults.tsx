import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { getJudgeResults, type JudgeResultTeam } from "@/lib/hackathonStorage";
import { RUBRIC, formatLabel, type JudgeFormat } from "@/data/rubric";

export function JudgingResults() {
  const [teams, setTeams] = useState<JudgeResultTeam[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getJudgeResults()
      .then((rows) => {
        if (!cancelled) setTeams(rows);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Could not load scores.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <p className="text-white/60">Loading scores…</p>;
  if (error) return <p className="text-red-300">{error}</p>;
  if (!teams.length) return <p className="text-white/70">No teams have submitted for judging yet.</p>;

  return (
    <div className="space-y-4">
      {teams.map((team) => (
        <article key={team.id} className="bg-black/30 border border-white/20 rounded-xl p-5 space-y-4">
          <div>
            <h2 className="text-xl text-white">{team.name}</h2>
            <p className="text-white/70">{team.project || "Project name not listed"}</p>
            <p className="text-white mt-2">
              Average {team.averageTotal == null ? "—" : `${team.averageTotal} / 30`}
              <span className="text-white/50"> · {team.scores.length} sheet{team.scores.length === 1 ? "" : "s"}</span>
            </p>
          </div>
          {team.averageTotal != null && (
            <dl className="grid sm:grid-cols-2 gap-2 text-sm">
              {RUBRIC.map((item) => (
                <div key={item.key} className="flex justify-between gap-3 border border-white/10 rounded-lg px-3 py-2">
                  <dt className="text-white/70">{item.label}</dt>
                  <dd>{team.categoryAverages[item.key] ?? "—"}</dd>
                </div>
              ))}
            </dl>
          )}
          <div className="space-y-2">
            {team.scores.map((sheet) => (
              <details key={sheet.id} className="border border-white/15 rounded-lg">
                <summary className="cursor-pointer px-3 py-2 text-sm">
                  {sheet.judgeName} · {formatLabel(sheet.format as JudgeFormat)} · {sheet.total}/30
                </summary>
                <div className="px-3 pb-3 space-y-1 text-sm text-white/80">
                  {RUBRIC.map((item) => (
                    <p key={item.key}>
                      {item.label}: {sheet.scores[item.key]}
                    </p>
                  ))}
                  {sheet.notes ? <p className="pt-2 text-white">Notes: {sheet.notes}</p> : null}
                </div>
              </details>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}
