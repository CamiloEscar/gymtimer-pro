"use client";

import type { Workout } from "@/types";
import { WorkoutCard } from "@/components/workout/WorkoutCard";

interface RecentWorkoutsProps {
  workouts: Workout[];
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

export function RecentWorkouts({ workouts, onDuplicate, onDelete }: RecentWorkoutsProps) {
  const recent = [...workouts]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  if (recent.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-white font-semibold font-industrial">Entrenamientos recientes</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {recent.map((workout) => (
          <WorkoutCard key={workout.id} workout={workout} onDuplicate={onDuplicate} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}
