"use client";

import Link from "next/link";
import type { Workout } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface WorkoutCardProps {
  workout: Workout;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

export function WorkoutCard({ workout, onDuplicate, onDelete }: WorkoutCardProps) {
  const n = workout.blocks.length;
  return (
    <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <p className="text-white font-semibold">{workout.name}</p>
        <p className="text-sm text-gray-400">
          {n} bloque{n === 1 ? "" : "s"}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href={`/app/workouts/${workout.id}/run`}>
          <Button size="md">▶ Iniciar</Button>
        </Link>
        <Link href={`/app/workouts/${workout.id}`}>
          <Button size="md" variant="secondary">
            ✏ Editar
          </Button>
        </Link>
        <Button size="md" variant="secondary" onClick={() => onDuplicate(workout.id)} aria-label="Duplicar entrenamiento">
          📋
        </Button>
        <Button size="md" variant="danger" onClick={() => onDelete(workout.id)} aria-label="Eliminar entrenamiento">
          🗑
        </Button>
      </div>
    </Card>
  );
}
