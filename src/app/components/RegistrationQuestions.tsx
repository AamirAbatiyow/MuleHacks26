export const RULES_PDF_URL = "/mulehacks-2026-rules.pdf";

export const STUDENT_LEVELS = [
  { value: "high_school", label: "High school" },
  { value: "undergraduate", label: "Undergraduate" },
  { value: "graduate", label: "Graduate" },
] as const;

export const TEAM_PREFERENCES = [
  { value: "have_team", label: "I already have a team" },
  { value: "solo", label: "I want to go solo" },
  { value: "make_team", label: "I want to make a team" },
] as const;

export type StudentLevel = (typeof STUDENT_LEVELS)[number]["value"];
export type TeamPreference = (typeof TEAM_PREFERENCES)[number]["value"];

const inputClass =
  "w-full bg-black/30 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white transition-colors";

export function RegistrationQuestions({
  rulesAcknowledged,
  studentLevel,
  teamPreference,
  onRulesChange,
  onStudentLevelChange,
  onTeamPreferenceChange,
}: {
  rulesAcknowledged: boolean;
  studentLevel: string;
  teamPreference: string;
  onRulesChange: (value: boolean) => void;
  onStudentLevelChange: (value: string) => void;
  onTeamPreferenceChange: (value: string) => void;
}) {
  return (
    <div className="space-y-6 text-left">
      <div>
        <p className="text-white/90 mb-3">
          Read the{" "}
          <a
            href={RULES_PDF_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-white/50 underline-offset-4 hover:decoration-white"
          >
            Mule Hacks 2026 Rules & Guidelines
          </a>
          .
        </p>
        <label className="flex items-start gap-3 text-white/90">
          <input
            type="checkbox"
            checked={rulesAcknowledged}
            onChange={(event) => onRulesChange(event.target.checked)}
            className="mt-1 h-4 w-4 accent-[#6b0000]"
          />
          <span>I have read and agree to the Mule Hacks 2026 Rules & Guidelines.</span>
        </label>
      </div>

      <div>
        <label className="block text-white/90 mb-2">Are you a high school, undergraduate, or graduate student?</label>
        <select
          value={studentLevel}
          onChange={(event) => onStudentLevelChange(event.target.value)}
          className={inputClass}
        >
          <option value="" className="bg-gray-900">
            Select one
          </option>
          {STUDENT_LEVELS.map((option) => (
            <option key={option.value} value={option.value} className="bg-gray-900">
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-white/90 mb-2">What is your team status?</label>
        <select
          value={teamPreference}
          onChange={(event) => onTeamPreferenceChange(event.target.value)}
          className={inputClass}
        >
          <option value="" className="bg-gray-900">
            Select one
          </option>
          {TEAM_PREFERENCES.map((option) => (
            <option key={option.value} value={option.value} className="bg-gray-900">
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function registrationAnswersComplete(
  rulesAcknowledged: boolean,
  studentLevel: string,
  teamPreference: string
) {
  return (
    rulesAcknowledged &&
    STUDENT_LEVELS.some((option) => option.value === studentLevel) &&
    TEAM_PREFERENCES.some((option) => option.value === teamPreference)
  );
}
