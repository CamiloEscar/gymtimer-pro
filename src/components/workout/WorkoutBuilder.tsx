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
import { BLOCK_TYPES, BLOCK_TYPE_INFO } from "@/lib/workout/blockTypeInfo";
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
  // Dirty tracking by reference: every edit spreads a new workout object, so
  // a stable initial reference is enough to know when there are unsaved changes.
  const [initialSnapshot] = useState(() => workout);
  const isDirty = workout !== initialSnapshot;
  const [errors, setErrors] = useState<ValidationError[]>([]);
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

  function handleDiscard() {
    setWorkout(initialSnapshot);
    setErrors([]);
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
    <>
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

      <details className="mt-6">
        <summary className="cursor-pointer font-tactical text-xs uppercase tracking-widest text-brand-500">
          Glosario de tipos de bloque
        </summary>
        <dl className="mt-3 grid gap-2">
          {BLOCK_TYPES.map((type) => (
            <div key={type} className="grid grid-cols-[120px_1fr] gap-3">
              <dt className="font-tactical text-xs uppercase tracking-widest text-phosphor">
                {BLOCK_TYPE_INFO[type].label}
              </dt>
              <dd className="text-sm text-phosphor-dim">
                {BLOCK_TYPE_INFO[type].description}
              </dd>
            </div>
          ))}
        </dl>
      </details>
      </div>

      <div className="sticky bottom-20 md:bottom-0 z-30 bg-surface-950/95 backdrop-blur border-t border-surface-800">
        <div className="max-w-2xl mx-auto p-3 flex items-center justify-between gap-3">
          <p
            role="status"
            className={`text-xs uppercase tracking-widest ${isDirty ? "text-brand-500" : "text-phosphor-muted"}`}
          >
            {isDirty ? "● Cambios sin guardar" : "Sin cambios por guardar"}
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={!isDirty} onClick={handleDiscard}>
              Descartar
            </Button>
            <Button disabled={!isDirty} onClick={handleSave}>
              Guardar
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
