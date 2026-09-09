"use client";

import Link from "next/link";
import type { Workout } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { countBlocksAndExercises } from "@/lib/workout/countBlocksAndExercises";
import { estimateWorkoutDurationSeconds } from "@/lib/workout/estimateWorkoutDurationSeconds";

interface WorkoutOfTheDayProps {
  workout: Workout | null;
}

function formatEstimateMinutes(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  return `${minutes}m`;
}

export function WorkoutOfTheDay({ workout }: WorkoutOfTheDayProps) {
  if (!workout) {
    return (
      <Card className="space-y-3">
        <p className="text-gray-400">Todavía no hay entrenamiento del día — creá uno.</p>
        <Link href="/app/workouts/new">
          <Button size="md">+ Crear entrenamiento</Button>
        </Link>
      </Card>
    );
  }

  const { blocks } = countBlocksAndExercises(workout);
  const estimatedSeconds = estimateWorkoutDurationSeconds(workout);

  return (
    <Card className="space-y-2">
      <p className="text-sm uppercase text-brand-500 tracking-wide">Entrenamiento del día</p>
      <p className="text-2xl font-bold text-white">{workout.name}</p>
      <p className="text-sm text-gray-400 font-tactical">
        {blocks} bloque{blocks === 1 ? "" : "s"}
        {estimatedSeconds > 0 && ` · ~${formatEstimateMinutes(estimatedSeconds)}`}
      </p>
      <Link href={`/app/workouts/${workout.id}/run`}>
        <Button size="lg">Iniciar</Button>
      </Link>
    </Card>
  );
}
