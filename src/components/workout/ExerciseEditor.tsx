"use client";

import type { Exercise } from "@/types";
import { EXERCISE_CATALOG, groupCatalogByCategory } from "@/lib/workout/exerciseCatalog";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface ExerciseEditorProps {
  exercise: Exercise;
  onChange: (exercise: Exercise) => void;
  onRemove: () => void;
}

const CATALOG_BY_CATEGORY = groupCatalogByCategory(EXERCISE_CATALOG);

export function ExerciseEditor({ exercise, onChange, onRemove }: ExerciseEditorProps) {
  return (
    <div className="grid grid-cols-2 gap-2 items-end border-t border-surface-800 pt-2 first:border-t-0 first:pt-0">
      <Select
        aria-label="Ejercicio"
        value={exercise.name}
        onChange={(e) => onChange({ ...exercise, name: e.target.value })}
        className="col-span-2"
      >
        {Object.entries(CATALOG_BY_CATEGORY).map(([category, exercises]) => (
          <optgroup key={category} label={category}>
            {exercises.map((catalogExercise) => (
              <option key={catalogExercise.id} value={catalogExercise.name}>
                {catalogExercise.name}
              </option>
            ))}
          </optgroup>
        ))}
      </Select>
      <Input
        aria-label="Reps"
        type="number"
        value={exercise.reps ?? ""}
        onChange={(e) =>
          onChange({ ...exercise, reps: e.target.value ? Number(e.target.value) : undefined })
        }
        placeholder="Reps"
      />
      <Input
        aria-label="Series"
        type="number"
        value={exercise.sets ?? ""}
        onChange={(e) =>
          onChange({ ...exercise, sets: e.target.value ? Number(e.target.value) : undefined })
        }
        placeholder="Series"
      />
      <Input
        aria-label="Peso (kg)"
        type="number"
        value={exercise.weightKg ?? ""}
        onChange={(e) =>
          onChange({ ...exercise, weightKg: e.target.value ? Number(e.target.value) : undefined })
        }
        placeholder="Peso (kg)"
      />
      <Input
        aria-label="Notas"
        value={exercise.notes ?? ""}
        onChange={(e) => onChange({ ...exercise, notes: e.target.value || undefined })}
        placeholder="Notas"
      />
      <Button
        variant="ghost"
        size="md"
        type="button"
        onClick={onRemove}
        aria-label="Quitar ejercicio"
        className="col-span-2 justify-self-start"
      >
        ✕ Quitar ejercicio
      </Button>
    </div>
  );
}
