"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { UserExerciseOverride, Workout, WorkoutBlock } from "@/types";
import { LocalWorkoutRepository } from "@/lib/storage/LocalWorkoutRepository";
import { UserExerciseOverrideRepository } from "@/lib/storage/UserExerciseOverrideRepository";
import { useLocalStorageSnapshot, notifyLocalStorageChange } from "@/hooks/useLocalStorageSnapshot";
import { validateWorkout, type ValidationError } from "@/lib/workout/validateWorkout";
import { countBlocksAndExercises } from "@/lib/workout/countBlocksAndExercises";
import { estimateWorkoutDurationSeconds, formatEstimateMinutes } from "@/lib/workout/estimateWorkoutDurationSeconds";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { BlockEditor } from "./BlockEditor";

export function emptyBlock(): WorkoutBlock {
  return { id: crypto.randomUUID(), type: "amrap", durationSeconds: 0, exercises: [] };
}

interface WorkoutBuilderProps {
  initialWorkout?: Workout;
  code?: string;
}

const NEW_ROUTINE_VALUE = "__new__";

export function WorkoutBuilder({ initialWorkout, code }: WorkoutBuilderProps) {
  const router = useRouter();
  const repo = new LocalWorkoutRepository();
  const workouts = useLocalStorageSnapshot<Workout[]>(
    "gymtimer.workouts",
    () => {
      const result = repo.list();
      return result.ok ? result.value : [];
    },
    []
  );
  const [workout, setWorkout] = useState<Workout>(
    initialWorkout ?? {
      id: crypto.randomUUID(),
      name: "",
      createdAt: new Date().toISOString(),
      favorite: false,
      blocks: [emptyBlock()],
    }
  );
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [showExerciseList, setShowExerciseList] = useState(false);
  const overrides = useLocalStorageSnapshot<UserExerciseOverride[]>(
    "gymtimer.exerciseOverrides",
    () => {
      const result = new UserExerciseOverrideRepository().list();
      return result.ok ? result.value : [];
    },
    []
  );
  const counts = countBlocksAndExercises(workout);
  const generalErrors = errors.filter((error) => !error.blockId).map((error) => error.message);
  const allExercises = workout.blocks.flatMap((block) => block.exercises);

  function handleSave() {
    const validationErrors = validateWorkout(workout);
    setErrors(validationErrors);
    if (validationErrors.length > 0) return;

    const result = repo.save(workout);
    if (!result.ok) {
      setErrors([{ message: result.error.message }]);
      return;
    }
    notifyLocalStorageChange();
    if (code) {
      router.push(`/app/workouts/${result.value.id}/run?code=${code}`);
      return;
    }
    router.push("/app/workouts");
  }

  function handleSwitchRoutine(targetId: string) {
    if (targetId === NEW_ROUTINE_VALUE) {
      if (initialWorkout) {
        router.push(code ? `/app/workouts/new?code=${code}` : "/app/workouts/new");
      }
      return;
    }
    if (initialWorkout && targetId === initialWorkout.id) return;
    router.push(code ? `/app/workouts/${targetId}?code=${code}` : `/app/workouts/${targetId}`);
  }

  const estimatedSeconds = estimateWorkoutDurationSeconds(workout);
  const selectValue = initialWorkout?.id ?? NEW_ROUTINE_VALUE;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <div className="border-b border-surface-800 pb-3 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-phosphor font-industrial">
            {initialWorkout ? "Editar rutina" : "Nueva rutina"}
          </h1>
          <div className="w-56 shrink-0">
            <Select
              aria-label="Cambiar de rutina"
              value={selectValue}
              onChange={(e) => handleSwitchRoutine(e.target.value)}
            >
              <option value={NEW_ROUTINE_VALUE}>+ Nueva rutina</option>
              {workouts
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name || "(sin nombre)"}
                  </option>
                ))}
            </Select>
          </div>
        </div>
        <p className="text-xs text-phosphor-dim font-tactical uppercase tracking-widest">
          {counts.blocks} bloque{counts.blocks === 1 ? "" : "s"} ·{" "}
          {counts.exercises} ejercicio{counts.exercises === 1 ? "" : "s"}
          {estimatedSeconds > 0 && ` · ~${formatEstimateMinutes(estimatedSeconds)} totales`}
        </p>
      </div>

      <Input
        aria-label="Nombre del entrenamiento"
        value={workout.name}
        onChange={(e) => setWorkout({ ...workout, name: e.target.value })}
        placeholder="Nombre del entrenamiento (ej: Entrenamiento de Murph)"
      />

      {generalErrors.length > 0 && (
        <ul className="text-danger-500 text-sm space-y-1">
          {generalErrors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}

      {allExercises.length > 0 && (
        <div className="rounded-lg border border-surface-800 bg-surface-900/50">
          <button
            type="button"
            className="w-full px-3 py-2 flex items-center justify-between text-left font-tactical text-xs uppercase tracking-widest text-phosphor-dim hover:text-phosphor"
            aria-expanded={showExerciseList}
            aria-controls="routine-exercise-list"
            onClick={() => setShowExerciseList((prev) => !prev)}
          >
            <span>[ Ver {allExercises.length} ejercicio{allExercises.length === 1 ? "" : "s"} de la rutina ]</span>
            <span aria-hidden className={showExerciseList ? "rotate-180 transition-transform" : "transition-transform"}>
              ▾
            </span>
          </button>
          {showExerciseList && (
            <ul id="routine-exercise-list" className="divide-y divide-surface-800 border-t border-surface-800">
              {allExercises.map((exercise, index) => (
                <li key={exercise.id} className="px-3 py-2 text-sm text-phosphor flex items-center gap-3">
                  <span className="font-tactical text-xs text-phosphor-muted w-6 shrink-0">
                    {(index + 1).toString().padStart(2, "0")}
                  </span>
                  <span className="flex-1">{exercise.name}</span>
                  <span className="font-tactical text-xs text-phosphor-dim shrink-0">
                    {[
                      exercise.reps != null ? `${exercise.reps} reps` : null,
                      exercise.sets != null ? `${exercise.sets}× series` : null,
                      exercise.weightKg != null ? `${exercise.weightKg} kg` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="space-y-3">
        {workout.blocks.map((block, index) => (
          <div key={block.id} className="space-y-2">
            <div className="flex items-center gap-2">
              <a
                href={`#block-${block.id}`}
                className="font-tactical text-xs uppercase tracking-widest text-phosphor-muted hover:text-brand-500"
              >
                ↓ Bloque {index + 1} · {block.label?.trim() || block.type.toUpperCase()}
              </a>
            </div>
            <BlockEditor
              block={block}
              index={index + 1}
              errors={errors.filter((error) => error.blockId === block.id).map((error) => error.message)}
              onChange={(updated) =>
                setWorkout({
                  ...workout,
                  blocks: workout.blocks.map((b) => (b.id === block.id ? updated : b)),
                })
              }
              onRemove={() =>
                setWorkout({ ...workout, blocks: workout.blocks.filter((b) => b.id !== block.id) })
              }
              overrides={overrides}
            />
          </div>
        ))}
        <Button
          type="button"
          variant="secondary"
          onClick={() => setWorkout({ ...workout, blocks: [...workout.blocks, emptyBlock()] })}
        >
          + Agregar bloque
        </Button>
      </div>

      <Button type="button" size="lg" onClick={handleSave} className="w-full">
        Guardar entrenamiento
      </Button>
    </div>
  );
}
