"use client";

import type { ReactNode } from "react";
import type { Exercise, MetricKind, RepScheme } from "@/types";
import type { CatalogExercise } from "@/lib/workout/exerciseCatalog";
import { groupCatalogByCategory } from "@/lib/workout/exerciseCatalog";
import { ladderReps, metricOf } from "@/lib/workout/repScheme";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { TimeInput } from "./TimeInput";

interface ExerciseEditorProps {
  exercise: Exercise;
  catalog: CatalogExercise[];
  // Ladder UI is only meaningful on amrap/forTime/emom/otm; the block drives
  // this so the editor doesn't need to know the parent's type.
  allowLadder?: boolean;
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

export function ExerciseEditor({ exercise, catalog, allowLadder = false, onChange, onRemove }: ExerciseEditorProps) {
  const catalogByCategory = groupCatalogByCategory(catalog);
  const kind = metricOf(exercise);
  // A ladder and a fixed reps amount on the SAME exercise are mutually
  // exclusive — the cadence comes from the ladder. While a ladder is present
  // we drop the reps input and let the steppers own the cadence; clearing the
  // ladder brings reps back as an empty input.
  const ladderIsActive = allowLadder && exercise.repScheme !== undefined;
  const repsInputIsSuppressed = ladderIsActive && kind === "reps";

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
    const rawValue = exercise[field];
    const numericValue = typeof rawValue === "number" ? rawValue : undefined;
    if (repsInputIsSuppressed) {
      // The ladder steppers below already own the cadence — no separate reps
      // amount input is shown while a scheme is present.
      return null;
    }
    return (
      <Input
        aria-label={KIND_AMOUNT_LABEL[kind]}
        type="number"
        value={numericValue ?? ""}
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
          <Icon name="trash" />
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

      {allowLadder && (
        <LadderEditor exercise={exercise} onChange={onChange} />
      )}
    </div>
  );
}

// Per-exercise ladder UI. Lives inside ExerciseEditor when the parent block is
// a ladder-capable type (amrap|forTime|emom|otm). The steppers own the cadence
// while a scheme is present; the parent amount widget is suppressed to avoid
// dead reps + scheme conflicts.
function LadderEditor({
  exercise,
  onChange,
}: {
  exercise: Exercise;
  onChange: (e: Exercise) => void;
}) {
  const scheme = exercise.repScheme;

  const writeScheme = (next: RepScheme | undefined) => {
    // Drop the fixed reps so the engine doesn't carry dead data alongside the
    // ladder cadence — the validation rejects both set; UI just keeps them
    // mutually exclusive here.
    onChange({
      ...exercise,
      reps: next !== undefined ? undefined : exercise.reps,
      repScheme: next,
    });
  };

  const updateField = (key: keyof RepScheme, raw: string) => {
    const parsed = raw === "" ? undefined : Number(raw);
    const merged: RepScheme = {
      start: scheme?.start ?? 0,
      step: scheme?.step ?? 0,
      min: scheme?.min ?? 0,
      [key]: parsed ?? 0,
    };
    writeScheme(merged);
  };

  return (
    <div className="space-y-2 border-t border-surface-800 pt-2">
      <p className="font-tactical text-xs uppercase tracking-widest text-phosphor-muted">
        Escalera (por ronda)
      </p>
      <div className="grid grid-cols-3 gap-2">
        {(
          [
            { key: "start", label: "Inicio", placeholder: "21" },
            { key: "step", label: "Paso", placeholder: "-6" },
            { key: "min", label: "Mínimo", placeholder: "9" },
          ] as const
        ).map((field) => (
          <div key={field.key} className="space-y-1">
            <p className="font-tactical text-xs uppercase tracking-widest text-phosphor-dim">
              {field.label}
            </p>
            <Input
              aria-label={`${field.label} de la escalera`}
              type="number"
              value={scheme?.[field.key] ?? ""}
              onChange={(e) => updateField(field.key, e.target.value)}
              placeholder={field.placeholder}
            />
          </div>
        ))}
      </div>
      {scheme && (
        <>
          <LadderPreview scheme={scheme} />
          <p className="text-xs text-phosphor-muted italic">
            Cada ronda baja según la escalera. Al llegar al mínimo, la cadencia se mantiene en el mínimo hasta que terminés el bloque.
          </p>
          <button
            type="button"
            onClick={() => writeScheme(undefined)}
            className="text-xs uppercase tracking-widest text-phosphor-dim hover:text-danger-500"
          >
            Quitar escalera
          </button>
        </>
      )}
    </div>
  );
}

// Live rendering of the ladder so the trainer sees the cadence before saving.
// Consecutive rungs collapse into one (e.g. a 3-rung Fran {21,-6,9} shows
// "21 → 15 → 9", not "21 → 15 → 9 → 9"), and the floor is tagged explicitly
// so the repeated-minimum behavior reads as intended, not as a bug.
function LadderPreview({ scheme }: { scheme: RepScheme }) {
  const rungs: number[] = [];
  let hitsFloor = false;
  for (let round = 1; round <= 8; round += 1) {
    const value = ladderReps(scheme, round) ?? 0;
    if (rungs.length > 0 && rungs[rungs.length - 1] === value) {
      hitsFloor = true;
      break;
    }
    rungs.push(value);
    if (rungs.length >= 6) break;
  }
  return (
    <p className="text-sm text-phosphor tabular-nums">
      {rungs.join(" → ")}
      {hitsFloor ? ` (mínimo ${scheme.min})` : ""}
    </p>
  );
}