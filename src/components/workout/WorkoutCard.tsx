"use client";

import Link from "next/link";
import type { Workout } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { countBlocksAndExercises } from "@/lib/workout/countBlocksAndExercises";
import {
  estimateWorkoutDurationSeconds,
  formatEstimateMinutes,
} from "@/lib/workout/estimateWorkoutDurationSeconds";
import { BLOCK_TYPE_INFO } from "@/lib/workout/blockTypeInfo";
import { useRunStats } from "@/hooks/useRunStats";
import { formatLastRun } from "@/lib/history/runStats";

interface WorkoutCardProps {
  workout: Workout;
  code?: string;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

export function WorkoutCard({ workout, code, onDuplicate, onDelete }: WorkoutCardProps) {
  const { blocks, exercises } = countBlocksAndExercises(workout);
  const estimatedSeconds = estimateWorkoutDurationSeconds(workout);
  const runStatsMap = useRunStats();
  const runStats = runStatsMap.get(workout.id);
  const runCount = runStats?.count ?? 0;
  const lastRunAt = runStats?.lastRunAt ?? null;
  // Show the block types the workout is built from as small chips so the
  // trainer can scan the list and pick the right one fast (AMRAP vs Tabata
  // reads very differently on a card).
  const blockTypes = Array.from(new Set(workout.blocks.map((b) => b.type)));
  const runHref = code
    ? `/app/workouts/${workout.id}/run?code=${code}`
    : `/app/workouts/${workout.id}/run`;

  return (
    <Card className="group relative overflow-hidden flex flex-col gap-3 hover:border-surface-700 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-industrial text-lg leading-tight text-phosphor truncate">
            {workout.name || "(sin nombre)"}
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-tactical text-[10px] uppercase tracking-widest text-phosphor-dim">
            <span>
              <span className="text-phosphor">{blocks}</span> bloque{blocks === 1 ? "" : "s"}
            </span>
            <span>
              <span className="text-phosphor">{exercises}</span> ejercicio{exercises === 1 ? "" : "s"}
            </span>
            {estimatedSeconds > 0 && (
              <span>
                <span className="text-phosphor">~{formatEstimateMinutes(estimatedSeconds)}</span>
              </span>
            )}
          </div>
          <p className="font-tactical text-[10px] uppercase tracking-widest text-phosphor-muted">
            {runCount === 0
              ? "Sin correr todavía"
              : `Corrida ${runCount} ${runCount === 1 ? "vez" : "veces"} · última ${formatLastRun(lastRunAt)}`}
          </p>
        </div>
        <div className="flex gap-1 shrink-0">
          <Button
            variant="ghost"
            size="md"
            onClick={() => onDuplicate(workout.id)}
            aria-label="Duplicar entrenamiento"
          >
            <Icon name="copy" />
          </Button>
          <Button
            variant="ghost"
            size="md"
            onClick={() => onDelete(workout.id)}
            aria-label="Eliminar entrenamiento"
          >
            <Icon name="trash" />
          </Button>
        </div>
      </div>
      {blockTypes.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {blockTypes.map((type) => (
            <span
              key={type}
              className="font-tactical text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-md bg-surface-800 text-phosphor-dim border border-surface-700"
            >
              {BLOCK_TYPE_INFO[type].label}
            </span>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-2 pt-1 border-t border-surface-800 mt-auto">
        <Link href={runHref} className="flex-1 sm:flex-none">
          <Button size="md" aria-label="Iniciar" className="w-full sm:w-auto">
            <Icon name="play" />
            Iniciar
          </Button>
        </Link>
        <Link href={`/app/workouts/${workout.id}`} className="flex-1 sm:flex-none">
          <Button size="md" variant="secondary" aria-label="Editar" className="w-full sm:w-auto">
            <Icon name="pencil" />
            Editar
          </Button>
        </Link>
      </div>
    </Card>
  );
}
