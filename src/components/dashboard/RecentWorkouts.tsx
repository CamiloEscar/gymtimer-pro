"use client";

import type { Workout } from "@/types";
import { WorkoutCard } from "@/components/workout/WorkoutCard";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

interface RecentWorkoutsProps {
  workouts: Workout[];
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

export function RecentWorkouts({ workouts, onDuplicate, onDelete }: RecentWorkoutsProps) {
  const recent = [...workouts]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);
  const hasMore = workouts.length > recent.length;

  if (recent.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between border-b border-surface-800 pb-2">
        <div>
          <h2 className="font-industrial text-xl leading-none text-phosphor">
            Entrenamientos recientes
          </h2>
          <p className="font-tactical text-xs uppercase tracking-widest text-phosphor-muted mt-1">
            {workouts.length} rutina{workouts.length === 1 ? "" : "s"} guardada{workouts.length === 1 ? "" : "s"}
          </p>
        </div>
        <Link href="/app/workouts">
          <Button size="md" variant="ghost">
            Ver todas
            <Icon name="arrow-left" className="size-4 rotate-180" />
          </Button>
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {recent.map((workout) => (
          <WorkoutCard
            key={workout.id}
            workout={workout}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
          />
        ))}
      </div>
      {hasMore && (
        <p className="font-tactical text-xs uppercase tracking-widest text-phosphor-muted text-center pt-1">
          + {workouts.length - recent.length} más en el listado completo
        </p>
      )}
    </section>
  );
}
