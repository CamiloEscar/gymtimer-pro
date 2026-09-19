"use client";

import { useMemo, useState } from "react";
import type { Exercise, Workout, WorkoutHistoryEntry } from "@/types";
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
import { BLOCK_TYPE_INFO } from "@/lib/workout/blockTypeInfo";
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

function formatExerciseAmounts(exercise: Exercise): string {
  const parts: string[] = [];
  if (exercise.sets) parts.push(`${exercise.sets}×`);
  if (exercise.reps) parts.push(`${exercise.reps} reps`);
  if (exercise.weightKg) parts.push(`${exercise.weightKg} kg`);
  if (exercise.timeSeconds) parts.push(`${exercise.timeSeconds} s`);
  if (exercise.distanceMeters) parts.push(`${exercise.distanceMeters} m`);
  if (exercise.calories) parts.push(`${exercise.calories} kcal`);
  return parts.join(" · ");
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
  const [detail, setDetail] = useState<WorkoutHistoryEntry | null>(null);

  const detailWorkout = detail
    ? workouts.find((w) => w.id === detail.workoutId)
    : undefined;

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
            <Card className="p-0 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDetail(entry)}
                aria-label={`Ver detalle de la corrida de ${entry.workoutName}`}
                className="flex-1 min-w-0 flex items-center gap-3 p-3 text-left cursor-pointer transition-colors hover:bg-surface-800/50 rounded-l-2xl"
              >
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
                <Icon
                  name="chevron-down"
                  className="size-4 shrink-0 text-phosphor-muted -rotate-90"
                />
              </button>
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

      <Modal
        open={detail !== null}
        onClose={() => setDetail(null)}
        title={detail ? `Corrida de ${detail.workoutName}` : ""}
      >
        {detail && (
          <div className="max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between gap-3 border-b border-surface-800 pb-3 mb-3">
              <p className="text-sm text-phosphor-dim">
                <time dateTime={detail.completedAt} className="tabular-nums">
                  {new Date(detail.completedAt).toLocaleString("es", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </p>
              <p className="font-industrial text-2xl tabular-nums text-phosphor leading-none">
                {formatDuration(detail.durationMs)}
              </p>
            </div>

            {detail.reps !== undefined && (
              <p className="mb-3 font-tactical text-sm uppercase tracking-widest text-brand">
                RM: {detail.reps} reps
              </p>
            )}

            {detailWorkout && detailWorkout.blocks.length > 0 ? (
              <div className="space-y-3">
                {detailWorkout.blocks.map((block, index) => (
                  <div key={block.id}>
                    <p className="font-tactical text-xs uppercase tracking-widest text-phosphor-dim mb-1">
                      <span className="text-phosphor-muted">{index + 1}.</span>{" "}
                      {BLOCK_TYPE_INFO[block.type].label}
                      {block.label ? ` · ${block.label}` : ""}
                      <span aria-hidden> · </span>
                      {formatDuration(block.durationSeconds * 1000)}
                    </p>
                    {block.exercises.length > 0 && (
                      <ul className="space-y-1">
                        {block.exercises.map((exercise) => (
                          <li
                            key={exercise.id}
                            className="flex items-baseline gap-2 text-sm"
                          >
                            <span className="text-phosphor flex-1 min-w-0 truncate">
                              {exercise.name}
                            </span>
                            <span className="text-phosphor-dim tabular-nums shrink-0">
                              {formatExerciseAmounts(exercise)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-phosphor-muted">
                {detailWorkout
                  ? "Esta rutina no tiene bloques definidos."
                  : "La rutina de esta corrida fue eliminada — no hay detalle de bloques."}
              </p>
            )}
          </div>
        )}
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