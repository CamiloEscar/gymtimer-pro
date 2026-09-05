"use client";

import Link from "next/link";
import type { Workout } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface WorkoutOfTheDayProps {
  workout: Workout | null;
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

  return (
    <Card className="space-y-2">
      <p className="text-sm uppercase text-brand-500 tracking-wide">Entrenamiento del día</p>
      <p className="text-2xl font-bold text-white">{workout.name}</p>
      <Link href={`/app/workouts/${workout.id}/run`}>
        <Button size="lg">Iniciar</Button>
      </Link>
    </Card>
  );
}
