"use client";

import Link from "next/link";
import type { Workout } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { countBlocksAndExercises } from "@/lib/workout/countBlocksAndExercises";
import { estimateWorkoutDurationSeconds, formatEstimateMinutes } from "@/lib/workout/estimateWorkoutDurationSeconds";

interface WorkoutOfTheDayProps {
  workout: Workout | null;
  // Where this WOD came from. The dashboard resolves three priority levels
  // (weekly plan > pinned > latest) and the trainer benefits from seeing
  // which one is currently winning — otherwise a pinned WOD can get
  // silently overridden by a new entry in the weekly plan with no
  // explanation.
  source?: "weeklyPlan" | "pinned" | "latest";
}

const SOURCE_LABEL: Record<NonNullable<WorkoutOfTheDayProps["source"]>, string> = {
  weeklyPlan: "del plan semanal",
  pinned: "fijado manualmente",
  latest: "último creado",
};

export function WorkoutOfTheDay({ workout, source }: WorkoutOfTheDayProps) {
  if (!workout) {
    return (
      <Card className="space-y-3">
        <p className="text-phosphor-dim">Todavía no hay entrenamiento del día — creá uno.</p>
        <Link href="/app/workouts/new">
          <Button size="md">+ Crear entrenamiento</Button>
        </Link>
      </Card>
    );
  }

  const { blocks, exercises } = countBlocksAndExercises(workout);
  const estimatedSeconds = estimateWorkoutDurationSeconds(workout);

  return (
    <Card className="relative overflow-hidden border-brand-500/40">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        aria-hidden
        style={{
          backgroundImage:
            "linear-gradient(135deg, oklch(0.7 0.19 150 / 0.10) 0%, transparent 60%)",
        }}
      />
      <div className="relative space-y-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-tactical text-xs uppercase tracking-widest text-brand-500">
            ▸ Entrenamiento del día
          </span>
          {source && (
            <span
              data-testid="wod-source"
              className="font-tactical text-[10px] uppercase tracking-widest text-phosphor-muted border border-surface-800 rounded-full px-2 py-0.5"
            >
              {SOURCE_LABEL[source]}
            </span>
          )}
        </div>
        <p className="font-industrial text-2xl md:text-3xl leading-tight text-phosphor">
          {workout.name || "(sin nombre)"}
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 font-tactical text-xs uppercase tracking-widest text-phosphor-dim">
          <span>
            <span className="text-phosphor">{blocks}</span> bloque{blocks === 1 ? "" : "s"}
          </span>
          <span>
            <span className="text-phosphor">{exercises}</span> ejercicio{exercises === 1 ? "" : "s"}
          </span>
          {estimatedSeconds > 0 && (
            <span>
              <span className="text-phosphor">~{formatEstimateMinutes(estimatedSeconds)}</span> estimados
            </span>
          )}
        </div>
        <div className="pt-2">
          <Link href={`/app/workouts/${workout.id}/run`}>
            <Button size="lg" className="w-full sm:w-auto">
              <Icon name="play" />
              Iniciar entrenamiento
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
