"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Workout } from "@/types";
import { LocalWorkoutRepository } from "@/lib/storage/LocalWorkoutRepository";
import { WorkoutBuilder } from "@/components/workout/WorkoutBuilder";

export default function EditWorkoutPage() {
  const params = useParams<{ id: string }>();
  const [workout, setWorkout] = useState<Workout | null | undefined>(undefined);

  useEffect(() => {
    const repo = new LocalWorkoutRepository();
    const result = repo.get(params.id);
    setWorkout(result.ok ? result.value : null);
  }, [params.id]);

  if (workout === undefined) return <p className="p-4 text-white">Loading…</p>;
  if (workout === null) return <p className="p-4 text-white">Workout not found.</p>;

  return <WorkoutBuilder initialWorkout={workout} />;
}
