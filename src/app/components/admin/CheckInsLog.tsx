import { useEffect, useState } from "react";
import {
  CHECK_IN_STATIONS,
  getCheckInEvents,
  type StoredCheckIn,
} from "@/lib/hackathonStorage";

function stationLabel(station: string) {
  return CHECK_IN_STATIONS.find((item) => item.id === station)?.label || station;
}

export function CheckInsLog() {
  const [events, setEvents] = useState<StoredCheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await getCheckInEvents();
        if (!cancelled) setEvents(list);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load check-ins");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl text-white mb-2">Check-ins</h2>
        <p className="text-white/70 text-sm">Recent station scans from the organizer scanner.</p>
      </div>
      {loading ? (
        <p className="text-white/60 text-sm">Loading…</p>
      ) : error ? (
        <p className="text-red-300 text-sm">{error}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/20 bg-black/30">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/60">
                <th className="p-3 font-medium">Time</th>
                <th className="p-3 font-medium">Participant</th>
                <th className="p-3 font-medium">Email</th>
                <th className="p-3 font-medium">Station</th>
                <th className="p-3 font-medium">Organizer</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-white/50 text-center">
                    No check-ins yet.
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr key={event.id} className="border-b border-white/5 text-white/90">
                    <td className="p-3 whitespace-nowrap">
                      {new Date(event.createdAt).toLocaleString()}
                    </td>
                    <td className="p-3">{event.participantName || "—"}</td>
                    <td className="p-3">{event.participantEmail}</td>
                    <td className="p-3">{stationLabel(event.station)}</td>
                    <td className="p-3">{event.organizerName}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
