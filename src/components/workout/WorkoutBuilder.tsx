"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Workout, WorkoutBlock } from "@/types";
import { LocalWorkoutRepository } from "@/lib/storage/LocalWorkoutRepository";
import { validateWorkout, type ValidationError } from "@/lib/workout/validateWorkout";
import { countBlocksAndExercises } from "@/lib/workout/countBlocksAndExercises";
import { estimateWorkoutDurationSeconds, formatEstimateMinutes } from "@/lib/workout/estimateWorkoutDurationSeconds";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { BlockEditor } from "./BlockEditor";

function emptyBlock(): WorkoutBlock {
  return { id: crypto.randomUUID(), type: "amrap", durationSeconds: 0, exercises: [] };
}

interface WorkoutBuilderProps {
  initialWorkout?: Workout;
  code?: string;
}

export function WorkoutBuilder({ initialWorkout, code }: WorkoutBuilderProps) {
  const router = useRouter();
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
  const counts = countBlocksAndExercises(workout);
  const generalErrors = errors.filter((error) => !error.blockId).map((error) => error.message);

  function handleSave() {
    const validationErrors = validateWorkout(workout);
    setErrors(validationErrors);
    if (validationErrors.length > 0) return;

    const repo = new LocalWorkoutRepository();
    const result = repo.save(workout);
    if (!result.ok) {
      setErrors([{ message: result.error.message }]);
      return;
    }
    if (code) {
      router.push(`/app/workouts/${result.value.id}/run?code=${code}`);
      return;
    }
    router.push("/app/workouts");
  }

  const estimatedSeconds = estimateWorkoutDurationSeconds(workout);

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <div className="border-b border-surface-800 pb-3">
        <h1 className="text-2xl font-bold text-white font-industrial">
          {initialWorkout ? "Editar rutina" : "Nueva rutina"}
        </h1>
        <p className="text-xs text-gray-400 font-tactical uppercase tracking-widest mt-1">
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
          <BlockEditor
            key={block.id}
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
          />
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
