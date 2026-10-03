import { day1, day2, type ScheduleItem } from "@/data/schedule";

const DAYS: { label: string; date: string; items: ScheduleItem[] }[] = [
  { label: "Saturday", date: "October 3", items: day1 },
  { label: "Sunday", date: "October 4", items: day2 },
];

export function ScheduleAgenda() {
  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {DAYS.map((day) => (
        <div
          key={day.label}
          className="bg-black/30 border border-white/20 rounded-xl p-6"
        >
          <h3 className="text-2xl text-white mb-1">{day.label}</h3>
          <p className="text-white/60 text-sm mb-6">{day.date}</p>
          <div className="space-y-5">
            {day.items.map((item) => (
              <div key={`${day.label}-${item.time}-${item.event}`} className="flex gap-4">
                <span className="text-white/70 font-mono text-sm min-w-[7.5rem] sm:min-w-36 shrink-0 whitespace-nowrap">
                  {item.time}
                </span>
                <div className="min-w-0">
                  <p className="text-white">{item.event}</p>
                  {item.details && item.details.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {item.details.map((detail) => (
                        <li key={detail} className="text-white/70 text-sm list-disc ml-4">
                          {detail}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
