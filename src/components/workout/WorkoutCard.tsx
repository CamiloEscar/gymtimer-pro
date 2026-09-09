"use client";

import Link from "next/link";
import type { Workout } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

interface WorkoutCardProps {
  workout: Workout;
  code?: string;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

export function WorkoutCard({ workout, code, onDuplicate, onDelete }: WorkoutCardProps) {
  const n = workout.blocks.length;
  const runHref = code
    ? `/app/workouts/${workout.id}/run?code=${code}`
    : `/app/workouts/${workout.id}/run`;

  return (
    <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <p className="text-phosphor font-semibold">{workout.name}</p>
        <p className="text-sm text-phosphor-dim">
          {n} bloque{n === 1 ? "" : "s"}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href={runHref}>
          <Button size="md" aria-label="Iniciar">
            <Icon name="play" />
            Iniciar
          </Button>
        </Link>
        <Link href={`/app/workouts/${workout.id}`}>
          <Button size="md" variant="secondary" aria-label="Editar">
            <Icon name="pencil" />
            Editar
          </Button>
        </Link>
        <Button
          size="md"
          variant="secondary"
          onClick={() => onDuplicate(workout.id)}
          aria-label="Duplicar entrenamiento"
        >
          <Icon name="copy" />
          Duplicar
        </Button>
        <Button
          size="md"
          variant="danger"
          onClick={() => onDelete(workout.id)}
          aria-label="Eliminar entrenamiento"
        >
          <Icon name="trash" />
          Eliminar
        </Button>
      </div>
    </Card>
  );
}
