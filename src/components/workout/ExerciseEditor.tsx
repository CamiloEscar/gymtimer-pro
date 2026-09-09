"use client";

import { useState } from "react";
import type { Exercise } from "@/types";
import type { CatalogExercise } from "@/lib/workout/exerciseCatalog";
import { groupCatalogByCategory } from "@/lib/workout/exerciseCatalog";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface ExerciseEditorProps {
  exercise: Exercise;
  catalog: CatalogExercise[];
  onChange: (exercise: Exercise) => void;
  onRemove: () => void;
}

export function ExerciseEditor({ exercise, catalog, onChange, onRemove }: ExerciseEditorProps) {
  const catalogByCategory = groupCatalogByCategory(catalog);
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="space-y-2 border-t border-surface-800 pt-2 first:border-t-0 first:pt-0">
      <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
        <Select
          aria-label="Ejercicio"
          value={exercise.name}
          onChange={(e) => onChange({ ...exercise, name: e.target.value })}
        >
          {Object.entries(catalogByCategory).map(([category, exercises]) => (
            <optgroup key={category} label={category}>
              {exercises.map((catalogExercise) => (
                <option key={catalogExercise.id} value={catalogExercise.name}>
                  {catalogExercise.name}
                </option>
              ))}
            </optgroup>
          ))}
        </Select>
        <Button
          variant="ghost"
          size="md"
          type="button"
          onClick={onRemove}
          aria-label="Quitar ejercicio"
        >
          ✕
        </Button>
      </div>

      <button
        type="button"
        onClick={() => setShowDetails((prev) => !prev)}
        className="text-xs text-gray-400 hover:text-white font-tactical uppercase tracking-widest"
        aria-expanded={showDetails}
        aria-controls={`exercise-details-${exercise.id}`}
      >
        {showDetails ? "▾ Ocultar detalles" : "+ Detalles"}
      </button>

      {showDetails && (
        <div
          id={`exercise-details-${exercise.id}`}
          className="grid grid-cols-2 gap-2"
        >
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
        </div>
      )}
    </div>
  );
}
