"use client";

import { useEffect, useState } from "react";
import type { Workout } from "@/types";
import { LocalWorkoutRepository } from "@/lib/storage/LocalWorkoutRepository";
import { WorkoutCard } from "./WorkoutCard";

export function WorkoutList() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const repo = new LocalWorkoutRepository();

  function reload() {
    const result = repo.list();
    setWorkouts(result.ok ? result.value : []);
  }

  useEffect(() => {
    reload();
  }, []);

  if (workouts.length === 0) {
    return <p className="text-gray-400 p-4">No workouts yet. Create your first one.</p>;
  }

  return (
    <div className="space-y-3 p-4">
      {workouts.map((workout) => (
        <WorkoutCard
          key={workout.id}
          workout={workout}
          onDuplicate={(id) => {
            repo.duplicate(id);
            reload();
          }}
          onDelete={(id) => {
            repo.delete(id);
            reload();
          }}
        />
      ))}
    </div>
  );
}
