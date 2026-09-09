"use client";

import { useHistoryEntries } from "./useHistoryEntries";

const MAX_ITEMS = 5;

interface UsageCount {
  workoutId: string;
  workoutName: string;
  count: number;
  completedAt: string;
}

export function MostUsedWorkouts() {
  const entries = useHistoryEntries();

  if (entries.length === 0) return null;

  const byId = new Map<string, UsageCount>();
  for (const entry of entries) {
    const current = byId.get(entry.workoutId);
    if (current) {
      current.count += 1;
      if (entry.completedAt > current.completedAt) {
        current.workoutName = entry.workoutName;
        current.completedAt = entry.completedAt;
      }
    } else {
      byId.set(entry.workoutId, {
        workoutId: entry.workoutId,
        workoutName: entry.workoutName,
        count: 1,
        completedAt: entry.completedAt,
      });
    }
  }

  const top = [...byId.values()].sort((a, b) => b.count - a.count).slice(0, MAX_ITEMS);

  return (
    <section className="px-6 md:px-10 lg:px-16 pb-16 lg:pb-24">
      <div className="max-w-5xl mx-auto">
        <h2 className="font-display-condensed font-normal uppercase tracking-[-0.01em] leading-[0.85] text-4xl md:text-5xl text-phosphor">
          Tus más usadas
        </h2>
        <ul className="mt-8 border-t border-surface-800/50">
          {top.map(({ workoutId, workoutName, count }) => (
            <li
              key={workoutId}
              className="flex items-baseline justify-between gap-4 border-b border-surface-800/50 py-4"
            >
              <span className="font-sans text-lg text-phosphor">{workoutName}</span>
              <span className="font-tactical text-brand-500 whitespace-nowrap">
                ×{count}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}