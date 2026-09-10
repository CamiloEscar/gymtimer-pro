"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Workout } from "@/types";
import { LocalWorkoutRepository } from "@/lib/storage/LocalWorkoutRepository";
import { WorkoutBuilder } from "@/components/workout/WorkoutBuilder";

export default function EditWorkoutPage() {
  const params = useParams<{ id: string }>();
  const [workout, setWorkout] = useState<Workout | null | undefined>(undefined);

  /* eslint-disable react-hooks/set-state-in-effect -- localStorage is the source of truth, intentional reload-on-params-change */
  useEffect(() => {
    const repo = new LocalWorkoutRepository();
    const result = repo.get(params.id);
    setWorkout(result.ok ? result.value : null);
  }, [params.id]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (workout === undefined) return <p className="p-4 text-phosphor">Cargando…</p>;
  if (workout === null) return <p className="p-4 text-phosphor">Entrenamiento no encontrado.</p>;

  return <WorkoutBuilder initialWorkout={workout} />;
}
