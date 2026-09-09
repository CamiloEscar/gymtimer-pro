import type { WorkoutHistoryEntry } from "@/types";

export interface HistoryStats {
  sessionsThisWeek: number;
  streakDays: number;
  totalTimeMs: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function toLocalDayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function startOfWeek(date: Date): Date {
  // Monday-based week. getDay(): 0=Sun..6=Sat; shift so Monday=0.
  const day = (date.getDay() + 6) % 7;
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate() - day);
  start.setHours(0, 0, 0, 0);
  return start;
}

export function computeHistoryStats(entries: WorkoutHistoryEntry[], now: Date = new Date()): HistoryStats {
  const totalTimeMs = entries.reduce((sum, e) => sum + e.durationMs, 0);

  const weekStart = startOfWeek(now);
  const weekEnd = new Date(weekStart.getTime() + 7 * DAY_MS);
  const sessionsThisWeek = entries.filter((e) => {
    const t = new Date(e.completedAt).getTime();
    return t >= weekStart.getTime() && t < weekEnd.getTime();
  }).length;

  const dayKeys = new Set(entries.map((e) => toLocalDayKey(e.completedAt)));
  let streakDays = 0;
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  // A streak that doesn't include today can still count if it ends yesterday:
  // start the walk from today, but don't require today itself to have an entry
  // before considering yesterday.
  if (!dayKeys.has(`${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`)) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (dayKeys.has(`${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`)) {
    streakDays += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { sessionsThisWeek, streakDays, totalTimeMs };
}
