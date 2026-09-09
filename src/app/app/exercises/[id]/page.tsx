"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { CatalogExercise } from "@/lib/workout/exerciseCatalog";
import { EXERCISE_CATALOG, getEffectiveCatalog } from "@/lib/workout/exerciseCatalog";
import { CROSSFIT_CATALOG } from "@/lib/workout/exerciseCatalogCrossfit";
import { UserExerciseOverrideRepository } from "@/lib/storage/UserExerciseOverrideRepository";
import { ExerciseDetail } from "@/components/library/ExerciseDetail";

export default function ExerciseDetailPage() {
  const params = useParams<{ id: string }>();
  const [exercise, setExercise] = useState<CatalogExercise | null | undefined>(undefined);

  /* eslint-disable react-hooks/set-state-in-effect -- localStorage is the source of truth, intentional reload-on-mount */
  useEffect(() => {
    const result = new UserExerciseOverrideRepository().list();
    const overrides = result.ok ? result.value : [];
    const all = [
      ...getEffectiveCatalog(EXERCISE_CATALOG, overrides),
      ...getEffectiveCatalog(CROSSFIT_CATALOG, overrides),
    ];
    setExercise(all.find((ex) => ex.id === params.id) ?? null);
  }, [params.id]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (exercise === undefined) return <p className="p-4 text-phosphor">Cargando…</p>;
  if (exercise === null) return <p className="p-4 text-phosphor">Ejercicio no encontrado.</p>;

  return <ExerciseDetail exercise={exercise} />;
}