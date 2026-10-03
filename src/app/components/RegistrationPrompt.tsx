import { useEffect, useState } from "react";
import type { User } from "../context/AuthContext";
import {
  RegistrationQuestions,
  registrationAnswersComplete,
  type StudentLevel,
  type TeamPreference,
} from "./RegistrationQuestions";

export function needsRegistrationAnswers(user: User) {
  return (
    !user.isAdmin &&
    !user.isScanner &&
    (!user.rulesAcknowledged || !user.studentLevel || !user.teamPreference)
  );
}

export function RegistrationPrompt({
  onSubmit,
}: {
  onSubmit: (profile: {
    rulesAcknowledged: true;
    studentLevel: StudentLevel;
    teamPreference: TeamPreference;
  }) => Promise<void>;
}) {
  const [rulesAcknowledged, setRulesAcknowledged] = useState(false);
  const [studentLevel, setStudentLevel] = useState("");
  const [teamPreference, setTeamPreference] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const canSubmit = registrationAnswersComplete(rulesAcknowledged, studentLevel, teamPreference);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    setError("");
    try {
      await onSubmit({
        rulesAcknowledged: true,
        studentLevel: studentLevel as StudentLevel,
        teamPreference: teamPreference as TeamPreference,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save your answers.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="registration-prompt-title"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#140000] border border-white/20 rounded-2xl p-8 shadow-2xl"
      >
        <h2 id="registration-prompt-title" className="text-3xl text-white mb-3">
          Before you continue
        </h2>
        <p className="text-white/80 mb-8">
          Please confirm the event rules and answer a couple of questions. This stays on screen until you finish.
        </p>
        <RegistrationQuestions
          rulesAcknowledged={rulesAcknowledged}
          studentLevel={studentLevel}
          teamPreference={teamPreference}
          onRulesChange={setRulesAcknowledged}
          onStudentLevelChange={setStudentLevel}
          onTeamPreferenceChange={setTeamPreference}
        />
        {error && <p className="text-red-300 text-sm mt-4">{error}</p>}
        <button
          type="submit"
          disabled={!canSubmit || saving}
          className="w-full mt-8 bg-[#6b0000] hover:bg-[#8b0000] text-white py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Continue"}
        </button>
      </form>
    </div>
  );
}
