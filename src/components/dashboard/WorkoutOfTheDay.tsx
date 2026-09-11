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
}

export function WorkoutOfTheDay({ workout }: WorkoutOfTheDayProps) {
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
        <div className="flex items-center gap-2">
          <span className="font-tactical text-xs uppercase tracking-widest text-brand-500">
            ▸ Entrenamiento del día
          </span>
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
