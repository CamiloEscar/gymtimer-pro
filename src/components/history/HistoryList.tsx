"use client";

import { useMemo, useState } from "react";
import type { Workout, WorkoutHistoryEntry } from "@/types";
import {
  useLocalStorageSnapshot,
  notifyLocalStorageChange,
} from "@/hooks/useLocalStorageSnapshot";
import { WorkoutHistoryRepository } from "@/lib/storage/WorkoutHistoryRepository";
import { LocalWorkoutRepository } from "@/lib/storage/LocalWorkoutRepository";
import {
  computeWorkoutRunStats,
  formatLastRun,
} from "@/lib/history/runStats";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
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
  const workouts = useLocalStorageSnapshot<Workout[]>(
    "gymtimer.workouts",
    () => {
      const result = new LocalWorkoutRepository().list();
      return result.ok ? result.value : [];
    },
    []
  );

  const filterOptions = useMemo(() => {
    // Only surface workouts that still exist in the active list — a deleted
    // workout leaves orphan history entries, which stay visible under "Todas"
    // but can't be filtered to a dead workout.
    const activeNames = new Map(workouts.map((w) => [w.id, w.name] as const));
    const counts = new Map<string, number>();
    for (const e of entries) {
      if (activeNames.has(e.workoutId)) {
        counts.set(e.workoutId, (counts.get(e.workoutId) ?? 0) + 1);
      }
    }
    return Array.from(counts, ([id, count]) => ({
      id,
      name: activeNames.get(id)!,
      count,
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [entries, workouts]);

  const [filterId, setFilterId] = useState<string>("");
  const [pendingRemove, setPendingRemove] = useState<WorkoutHistoryEntry | null>(null);

  function confirmRemove() {
    if (!pendingRemove) return;
    new WorkoutHistoryRepository().remove(pendingRemove.id);
    notifyLocalStorageChange();
    setPendingRemove(null);
  }

  const filtered = filterId
    ? entries.filter((e) => e.workoutId === filterId)
    : entries;

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => String(b.completedAt).localeCompare(String(a.completedAt))),
    [filtered]
  );

  const filteredStats = useMemo(
    () => (filterId ? computeWorkoutRunStats(filtered) : null),
    [filterId, filtered]
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
            {filterOptions.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.count})
              </option>
            ))}
          </Select>
        </label>
      </div>

      {filteredStats && sorted.length > 0 && (
        <Card className="p-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <Stat label="Corridas" value={String(filteredStats.totalRuns)} />
          <Stat label="Promedio" value={formatDuration(filteredStats.averageDurationMs)} />
          <Stat
            label="Más rápida"
            value={formatDuration(filteredStats.fastestDurationMs)}
          />
          <Stat
            label="Última"
            value={formatLastRun(filteredStats.lastRunAt)}
          />
        </Card>
      )}

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
              <button
                type="button"
                onClick={() => setPendingRemove(entry)}
                aria-label={`Borrar corrida de ${entry.workoutName}`}
                title="Borrar"
                className="shrink-0 inline-flex items-center justify-center size-11 rounded-md text-phosphor-dim hover:text-danger-500 active:scale-95 transition-colors cursor-pointer"
              >
                <Icon name="trash" className="size-4" />
              </button>
            </Card>
          </li>
        ))}
      </ul>

      {sorted.length === 0 && (
        <p className="text-center text-sm text-phosphor-dim py-4">
          No hay corridas de esa rutina todavía.
        </p>
      )}

      <Modal
        open={pendingRemove !== null}
        onClose={() => setPendingRemove(null)}
        title="¿Borrar esta corrida?"
      >
        <p className="text-phosphor-dim mb-4">
          {pendingRemove && (
            <>
              Vas a borrar la corrida de <strong className="text-phosphor">{pendingRemove.workoutName}</strong> del {new Date(pendingRemove.completedAt).toLocaleString("es", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}. No se puede deshacer.
            </>
          )}
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setPendingRemove(null)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={confirmRemove}>
            Borrar
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="font-industrial text-2xl tabular-nums text-phosphor leading-none">
        {value}
      </p>
      <p className="font-tactical text-xs uppercase tracking-widest text-phosphor-dim">
        {label}
      </p>
    </div>
  );
}