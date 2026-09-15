"use client";

import type { ReactNode } from "react";
import type { Exercise, MetricKind } from "@/types";
import type { CatalogExercise } from "@/lib/workout/exerciseCatalog";
import { groupCatalogByCategory } from "@/lib/workout/exerciseCatalog";
import { metricOf } from "@/lib/workout/repScheme";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { TimeInput } from "./TimeInput";

interface ExerciseEditorProps {
  exercise: Exercise;
  catalog: CatalogExercise[];
  onChange: (exercise: Exercise) => void;
  onRemove: () => void;
}

const METRIC_KINDS: MetricKind[] = [
  "reps",
  "distanceMeters",
  "calories",
  "timeSeconds",
  "max",
];

const METRIC_LABELS: Record<MetricKind, string> = {
  reps: "Repeticiones",
  distanceMeters: "Distancia (m)",
  calories: "Calorías",
  timeSeconds: "Tiempo",
  max: "Máximo",
};

const KIND_AMOUNT_LABEL: Record<Exclude<MetricKind, "timeSeconds" | "max">, string> = {
  reps: "Reps",
  distanceMeters: "Distancia (m)",
  calories: "Calorías",
};

const KIND_FIELD: Record<Exclude<MetricKind, "timeSeconds" | "max">, keyof Exercise> = {
  reps: "reps",
  distanceMeters: "distanceMeters",
  calories: "calories",
};

export function ExerciseEditor({ exercise, catalog, onChange, onRemove }: ExerciseEditorProps) {
  const catalogByCategory = groupCatalogByCategory(catalog);
  const kind = metricOf(exercise);

  const handleCatalogChange = (name: string) => {
    const catalogExercise = catalog.find((entry) => entry.name === name);
    // Selecting a catalog entry prefills its default metric kind (the editor
    // override may still be changed freely afterwards; absence falls back to
    // reps via metricOf).
    onChange({ ...exercise, name, metricKind: catalogExercise?.metricKind });
  };

  const amountWidget: ReactNode = (() => {
    if (kind === "max") {
      return (
        <div className="flex items-center justify-center rounded border border-surface-800 bg-surface-900 px-2 py-2 text-xs font-tactical uppercase tracking-widest text-phosphor-dim">
          MÁXIMO
        </div>
      );
    }
    if (kind === "timeSeconds") {
      const windowKind = exercise.windowKind ?? "countdown";
      return (
        <div className="space-y-1">
          <TimeInput
            ariaLabel="Tiempo del ejercicio"
            seconds={exercise.timeSeconds ?? 0}
            onChangeSeconds={(seconds) => onChange({ ...exercise, timeSeconds: seconds })}
            variant="slider"
          />
          <div className="inline-flex items-center gap-0.5">
            <button
              type="button"
              aria-pressed={windowKind === "countdown"}
              onClick={() => onChange({ ...exercise, windowKind: "countdown" })}
              className={`rounded px-1.5 py-0.5 text-[10px] font-tactical uppercase tracking-wider transition-colors cursor-pointer ${
                windowKind === "countdown"
                  ? "text-brand-500 bg-brand-500/10"
                  : "text-phosphor-dim hover:text-phosphor"
              }`}
            >
              Cuenta regresiva
            </button>
            <button
              type="button"
              aria-pressed={windowKind === "countup"}
              onClick={() => onChange({ ...exercise, windowKind: "countup" })}
              className={`rounded px-1.5 py-0.5 text-[10px] font-tactical uppercase tracking-wider transition-colors cursor-pointer ${
                windowKind === "countup"
                  ? "text-brand-500 bg-brand-500/10"
                  : "text-phosphor-dim hover:text-phosphor"
              }`}
            >
              Cuenta progresiva
            </button>
          </div>
        </div>
      );
    }
    const field = KIND_FIELD[kind];
    const value = exercise[field];
    return (
      <Input
        aria-label={KIND_AMOUNT_LABEL[kind]}
        type="number"
        value={value ?? ""}
        onChange={(e) =>
          onChange({ ...exercise, [field]: e.target.value ? Number(e.target.value) : undefined })
        }
        placeholder={KIND_AMOUNT_LABEL[kind]}
      />
    );
  })();

  return (
    <div className="space-y-2 border-t border-surface-800 pt-2 first:border-t-0 first:pt-0">
      <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
        <Select
          aria-label="Ejercicio"
          value={exercise.name}
          onChange={(e) => handleCatalogChange(e.target.value)}
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
          <Icon name="close" />
          Quitar
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Select
          aria-label="Métrica"
          value={kind}
          onChange={(e) => onChange({ ...exercise, metricKind: e.target.value as MetricKind })}
        >
          {METRIC_KINDS.map((metricKind) => (
            <option key={metricKind} value={metricKind}>
              {METRIC_LABELS[metricKind]}
            </option>
          ))}
        </Select>
        {amountWidget}
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
    </div>
  );
}