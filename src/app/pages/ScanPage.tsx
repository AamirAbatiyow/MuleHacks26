import { FormEvent, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Html5Qrcode } from "html5-qrcode";
import { LogOut, QrCode } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { SeoHead } from "../components/SeoHead";
import { ApiError } from "@/lib/api";
import {
  CHECK_IN_STATIONS,
  lookupParticipantForScan,
  logCheckIn,
  type CheckInParticipant,
  type CheckInStation,
} from "@/lib/hackathonStorage";

const ORGANIZER_KEY = "mh_scanner_organizer_name";
const SCANNER_ELEMENT_ID = "mh-qr-reader";

type Step = "name" | "scan" | "success" | "logged";

function hasDietaryRestriction(value?: string | null) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return false;
  const normalized = trimmed.toLowerCase();
  return normalized !== "none" && normalized !== "n/a" && normalized !== "na" && normalized !== "-";
}

export function ScanPage() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [organizerName, setOrganizerName] = useState("");
  const [nameDraft, setNameDraft] = useState("");
  const [step, setStep] = useState<Step>("name");
  const [manualQuery, setManualQuery] = useState("");
  const [participant, setParticipant] = useState<CheckInParticipant | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [loggedStation, setLoggedStation] = useState<CheckInStation | null>(null);
  const [recentNote, setRecentNote] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const handlingScan = useRef(false);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(ORGANIZER_KEY)?.trim() || "";
      if (saved) {
        setOrganizerName(saved);
        setStep("scan");
      }
    } catch {
      // ignore
    }
  }, []);

  const stopCamera = async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (!scanner) return;
    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
      scanner.clear();
    } catch {
      // ignore stop errors
    }
  };

  const lookup = async (query: string) => {
    const q = query.trim();
    if (!q || handlingScan.current) return;
    handlingScan.current = true;
    setBusy(true);
    setError("");
    try {
      await stopCamera();
      const found = await lookupParticipantForScan(q);
      setParticipant(found);
      setStep("success");
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Lookup failed.");
      handlingScan.current = false;
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (step !== "scan") {
      void stopCamera();
      return;
    }

    let cancelled = false;
    const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
    scannerRef.current = scanner;
    setCameraError("");

    (async () => {
      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 8, qrbox: { width: 240, height: 240 } },
          (decoded) => {
            if (cancelled) return;
            void lookup(decoded);
          },
          () => undefined
        );
      } catch {
        if (!cancelled) {
          setCameraError("Camera unavailable. Use the email or QR text field below.");
        }
      }
    })();

    return () => {
      cancelled = true;
      void stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const saveOrganizerName = (event: FormEvent) => {
    event.preventDefault();
    const name = nameDraft.trim();
    if (!name) {
      setError("Organizer name is required.");
      return;
    }
    try {
      sessionStorage.setItem(ORGANIZER_KEY, name);
    } catch {
      // ignore
    }
    setOrganizerName(name);
    setError("");
    setStep("scan");
  };

  const resetToScan = () => {
    setParticipant(null);
    setLoggedStation(null);
    setRecentNote("");
    setError("");
    setManualQuery("");
    handlingScan.current = false;
    setStep("scan");
  };

  const confirmStation = async (station: CheckInStation) => {
    if (!participant || !organizerName) return;
    setBusy(true);
    setError("");
    try {
      const result = await logCheckIn({
        email: participant.email,
        station,
        organizerName,
      });
      setLoggedStation(station);
      setRecentNote(
        result.recentDuplicate
          ? "Note: this station was already logged for this person in the last few minutes."
          : ""
      );
      setStep("logged");
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Failed to log check-in.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand px-4 py-6">
      <SeoHead
        title="Scan | Mule Hacks 2026"
        description="Organizer QR check-in scanner for Mule Hacks 2026."
        noIndex
      />
      <div className="max-w-lg mx-auto space-y-6">
        <header className="flex items-center justify-between gap-3">
          <div>
            <p className="text-white/50 text-xs uppercase tracking-wider">Mule Hacks</p>
            <h1 className="text-2xl text-white">Check-in scanner</h1>
            <p className="text-white/60 text-sm truncate">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate("/auth");
            }}
            className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm"
          >
            <LogOut className="w-4 h-4" />
            Log out
          </button>
        </header>

        {step === "name" && (
          <form
            onSubmit={saveOrganizerName}
            className="bg-black/30 border border-white/20 rounded-2xl p-6 space-y-4"
          >
            <h2 className="text-xl text-white">Who is scanning?</h2>
            <p className="text-white/70 text-sm">
              Enter your name once for this session. It is saved with every check-in you log.
            </p>
            <input
              type="text"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              required
              autoFocus
              className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white"
              placeholder="Organizer name"
            />
            {error && <p className="text-red-300 text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full bg-[#6b0000] hover:bg-[#8b0000] text-white py-3 rounded-lg"
            >
              Continue
            </button>
          </form>
        )}

        {step === "scan" && (
          <div className="space-y-4">
            <div className="bg-black/30 border border-white/20 rounded-2xl p-4">
              <p className="text-white/70 text-sm mb-1">Scanning as</p>
              <div className="flex items-center justify-between gap-3">
                <p className="text-white text-lg">{organizerName}</p>
                <button
                  type="button"
                  onClick={() => {
                    setNameDraft(organizerName);
                    setStep("name");
                  }}
                  className="text-white/70 hover:text-white text-sm underline"
                >
                  Change
                </button>
              </div>
            </div>

            <div className="bg-black/30 border border-white/20 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-white">
                <QrCode className="w-5 h-5" />
                <h2 className="text-lg">Scan participant QR</h2>
              </div>
              <div id={SCANNER_ELEMENT_ID} className="overflow-hidden rounded-xl bg-black" />
              {cameraError && <p className="text-amber-200 text-sm">{cameraError}</p>}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void lookup(manualQuery);
              }}
              className="bg-black/30 border border-white/20 rounded-2xl p-4 space-y-3"
            >
              <label className="block text-white/80 text-sm">Or enter email / QR text</label>
              <input
                type="text"
                value={manualQuery}
                onChange={(e) => setManualQuery(e.target.value)}
                className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white"
                placeholder="student@email.com or MULEHACKS2026-..."
              />
              {error && <p className="text-red-300 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={busy || !manualQuery.trim()}
                className="w-full bg-[#6b0000] hover:bg-[#8b0000] text-white py-3 rounded-lg disabled:opacity-50"
              >
                {busy ? "Looking up…" : "Look up participant"}
              </button>
            </form>
          </div>
        )}

        {step === "success" && participant && (
          <div className="space-y-4">
            {hasDietaryRestriction(participant.dietaryRestrictions) && (
              <div className="bg-amber-400 text-black rounded-2xl p-5 border-4 border-amber-200 shadow-[0_0_30px_rgba(251,191,36,0.45)]">
                <p className="text-xs font-bold uppercase tracking-wider mb-1">Dietary flag</p>
                <p className="text-2xl font-bold leading-tight">Send them to Aamir</p>
                <p className="mt-2 text-sm font-medium">
                  Restriction: {participant.dietaryRestrictions.trim()}
                </p>
              </div>
            )}
            <div className="bg-emerald-950/50 border border-emerald-400/40 rounded-2xl p-6 space-y-3">
              <p className="text-emerald-300 text-sm uppercase tracking-wider">Valid participant</p>
              <h2 className="text-2xl text-white">{participant.name || "Unnamed participant"}</h2>
              <p className="text-white/80">{participant.email}</p>
              {participant.university && (
                <p className="text-white/70 text-sm">{participant.university}</p>
              )}
              {participant.teamName && (
                <p className="text-white/70 text-sm">Team: {participant.teamName}</p>
              )}
              {participant.shirtSize && (
                <p className="text-white/70 text-sm">Shirt: {participant.shirtSize}</p>
              )}
            </div>

            <div className="bg-black/30 border border-white/20 rounded-2xl p-4 space-y-3">
              <h3 className="text-white text-lg">Choose station</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {CHECK_IN_STATIONS.map((station) => (
                  <button
                    key={station.id}
                    type="button"
                    disabled={busy}
                    onClick={() => void confirmStation(station.id)}
                    className="bg-[#6b0000] hover:bg-[#8b0000] text-white py-3 px-4 rounded-lg text-left disabled:opacity-50"
                  >
                    {station.label}
                  </button>
                ))}
              </div>
              {error && <p className="text-red-300 text-sm">{error}</p>}
              <button
                type="button"
                onClick={resetToScan}
                className="w-full bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg"
              >
                Cancel / scan another
              </button>
            </div>
          </div>
        )}

        {step === "logged" && participant && loggedStation && (
          <div className="bg-black/30 border border-white/20 rounded-2xl p-6 space-y-4">
            <p className="text-emerald-300 text-sm uppercase tracking-wider">Logged</p>
            <h2 className="text-2xl text-white">
              {CHECK_IN_STATIONS.find((s) => s.id === loggedStation)?.label || loggedStation}
            </h2>
            <p className="text-white/80">
              {participant.name || participant.email} · {new Date().toLocaleTimeString()}
            </p>
            <p className="text-white/60 text-sm">Organizer: {organizerName}</p>
            {recentNote && <p className="text-amber-200 text-sm">{recentNote}</p>}
            <button
              type="button"
              onClick={resetToScan}
              className="w-full bg-[#6b0000] hover:bg-[#8b0000] text-white py-3 rounded-lg"
            >
              Scan next participant
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
