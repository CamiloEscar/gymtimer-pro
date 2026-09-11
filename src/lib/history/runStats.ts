import type { WorkoutHistoryEntry } from "@/types";

export interface RunStats {
  count: number;
  lastRunAt: string | null;
}

/**
 * Pure aggregation of history entries into per-workout run stats.
 * `lastRunAt` is the ISO string of the most recent entry (string compare on
 * ISO timestamps is monotonic, no Date parsing needed for the comparison).
 */
export function aggregateRunStats(entries: WorkoutHistoryEntry[]): Map<string, RunStats> {
  const result = new Map<string, RunStats>();
  for (const entry of entries) {
    const current = result.get(entry.workoutId);
    if (!current) {
      result.set(entry.workoutId, { count: 1, lastRunAt: entry.completedAt });
      continue;
    }
    current.count += 1;
    if (entry.completedAt > (current.lastRunAt ?? "")) {
      current.lastRunAt = entry.completedAt;
    }
  }
  return result;
}

const RTF = new Intl.RelativeTimeFormat("es", { numeric: "auto" });

/**
 * Format the relative time since the last run, matching the format used in
 * the landing page's recent-history list so the UI is consistent across
 * surfaces. Falls back to "nunca" when there's no prior run.
 */
export function formatLastRun(lastRunAt: string | null, now: Date = new Date()): string {
  if (!lastRunAt) return "nunca";
  const diffMs = now.getTime() - new Date(lastRunAt).getTime();
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
  return RTF.format(-Math.floor(diffMs / ms), unit);
}
