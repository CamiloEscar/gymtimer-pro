"use client";

import { useMemo, useState } from "react";
import type { WorkoutHistoryEntry } from "@/types";
import { useLocalStorageSnapshot } from "@/hooks/useLocalStorageSnapshot";
import { WorkoutHistoryRepository } from "@/lib/storage/WorkoutHistoryRepository";
import { formatLastRun } from "@/lib/history/runStats";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";

function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function HistoryList() {
  const repo = new WorkoutHistoryRepository();
  const entries = useLocalStorageSnapshot<WorkoutHistoryEntry[]>(
    "gymtimer.history",
    () => {
      const result = repo.list();
      return result.ok ? result.value : [];
    },
    []
  );

  const uniqueWorkouts = useMemo(() => {
    const map = new Map<string, string>();
    for (const e of entries) map.set(e.workoutId, e.workoutName);
    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [entries]);

  const [filterId, setFilterId] = useState<string>("");

  const filtered = filterId
    ? entries.filter((e) => e.workoutId === filterId)
    : entries;

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => b.completedAt.localeCompare(a.completedAt)),
    [filtered]
  );

  if (entries.length === 0) {
    return (
      <Card className="text-center p-4 space-y-2 border-dashed">
        <p className="font-industrial text-xl text-phosphor">Sin historial todavía</p>
        <p className="text-sm text-phosphor-dim">
          Cuando completes un entrenamiento va a aparecer acá.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="flex-1 flex items-center gap-3">
          <span className="font-tactical text-xs uppercase tracking-widest text-phosphor-dim shrink-0">
            Rutina
          </span>
          <Select
            value={filterId}
            onChange={(e) => setFilterId(e.target.value)}
            aria-label="Filtrar historial por rutina"
            className="flex-1"
          >
            <option value="">Todas ({entries.length})</option>
            {uniqueWorkouts.map((w) => {
              const count = entries.filter((e) => e.workoutId === w.id).length;
              return (
                <option key={w.id} value={w.id}>
                  {w.name} ({count})
                </option>
              );
            })}
          </Select>
        </label>
      </div>

      <ul className="space-y-2">
        {sorted.map((entry) => (
          <li key={entry.id}>
            <Card className="p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-industrial text-base text-phosphor truncate">
                  {entry.workoutName}
                </p>
                <p className="text-xs text-phosphor-muted">
                  {formatLastRun(entry.completedAt)}
                  <span aria-hidden> · </span>
                  <time dateTime={entry.completedAt} className="tabular-nums">
                    {new Date(entry.completedAt).toLocaleString("es", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-industrial text-lg tabular-nums text-phosphor">
                  {formatDuration(entry.durationMs)}
                </p>
                {entry.reps !== undefined && (
                  <p className="text-xs uppercase tracking-widest text-phosphor-dim">
                    {entry.reps} reps
                  </p>
                )}
              </div>
            </Card>
          </li>
        ))}
      </ul>

      {sorted.length === 0 && (
        <p className="text-center text-sm text-phosphor-dim py-4">
          No hay corridas de esa rutina todavía.
        </p>
      )}
    </div>
  );
}