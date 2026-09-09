"use client";

import { useHistoryEntries } from "./useHistoryEntries";

const MAX_ITEMS = 5;

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  if (diffMs < 60_000) return "recién";
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 31_536_000_000],
    ["month", 2_592_000_000],
    ["week", 604_800_000],
    ["day", 86_400_000],
    ["hour", 3_600_000],
    ["minute", 60_000],
  ];
  const [unit, ms] = units.find(([, ms]) => diffMs >= ms) ?? ["minute", 60_000];
  const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" });
  return rtf.format(-Math.floor(diffMs / ms), unit);
}

export function RecentWorkouts() {
  const entries = useHistoryEntries();

  if (entries.length === 0) return null;

  const recent = [...entries]
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
    .slice(0, MAX_ITEMS);

  return (
    <section className="px-6 md:px-10 lg:px-16 py-16 lg:py-24">
      <div className="max-w-5xl mx-auto">
        <h2 className="font-display-condensed font-normal uppercase tracking-[-0.01em] leading-[0.85] text-4xl md:text-5xl text-phosphor">
          Tus últimas rutinas
        </h2>
        <ul className="mt-8 border-t border-surface-800/50">
          {recent.map((entry) => (
            <li
              key={entry.id}
              className="flex items-baseline justify-between gap-4 border-b border-surface-800/50 py-4"
            >
              <span className="font-sans text-lg text-phosphor">{entry.workoutName}</span>
              <time className="font-tactical text-sm text-phosphor-muted whitespace-nowrap">
                {formatRelativeTime(entry.completedAt)}
              </time>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}