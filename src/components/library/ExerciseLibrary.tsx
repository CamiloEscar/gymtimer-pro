"use client";

import { useState } from "react";
import Link from "next/link";
import type { CatalogExercise } from "@/lib/workout/exerciseCatalog";
import { EXERCISE_CATALOG, getEffectiveCatalog } from "@/lib/workout/exerciseCatalog";
import { CROSSFIT_CATALOG } from "@/lib/workout/exerciseCatalogCrossfit";
import type { UserExerciseOverride } from "@/types";
import { UserExerciseOverrideRepository } from "@/lib/storage/UserExerciseOverrideRepository";
import { useLocalStorageSnapshot } from "@/hooks/useLocalStorageSnapshot";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export function ExerciseLibrary() {
  const [query, setQuery] = useState("");
  const overrides = useLocalStorageSnapshot<UserExerciseOverride[]>(
    "gymtimer.exerciseOverrides",
    () => {
      const result = new UserExerciseOverrideRepository().list();
      return result.ok ? result.value : [];
    },
    []
  );

  const exercises: CatalogExercise[] = [
    ...getEffectiveCatalog(EXERCISE_CATALOG, overrides),
    ...getEffectiveCatalog(CROSSFIT_CATALOG, overrides),
  ];

  const normalized = query.trim().toLowerCase();
  const filtered = normalized
    ? exercises.filter((ex) => ex.name.toLowerCase().includes(normalized))
    : exercises;

  return (
    <div>
      <div className="px-4 pb-4">
        <Input
          type="search"
          aria-label="Buscar ejercicio"
          placeholder="Buscar ejercicio"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {filtered.length === 0 ? (
        <p className="p-4 text-phosphor-dim">Sin resultados.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 px-4 pb-4">
          {filtered.map((exercise) => (
            <Link key={exercise.id} href={`/app/exercises/${exercise.id}`}>
              <Card>
                <p className="text-phosphor font-semibold text-sm">{exercise.name}</p>
                <p className="font-tactical text-xs uppercase tracking-widest text-brand-500">
                  {exercise.category}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}