"use client";

import { useState } from "react";
import type { BlockType, WorkoutBlock } from "@/types";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EXERCISE_CATALOG } from "@/lib/workout/exerciseCatalog";
import { CROSSFIT_CATALOG } from "@/lib/workout/exerciseCatalogCrossfit";
import { estimateWorkoutDurationSeconds, formatEstimateMinutes } from "@/lib/workout/estimateWorkoutDurationSeconds";
import { ExerciseEditor } from "./ExerciseEditor";

const BLOCK_TYPES: BlockType[] = [
  "countdown",
  "countup",
  "amrap",
  "emom",
  "interval",
  "tabata",
  "forTime",
  "rest",
  "basic",
];

type CatalogKind = "gym" | "crossfit";

interface BlockEditorProps {
  block: WorkoutBlock;
  index: number;
  onChange: (block: WorkoutBlock) => void;
  onRemove: () => void;
  errors?: string[];
}

export function BlockEditor({ block, index, onChange, onRemove, errors = [] }: BlockEditorProps) {
  const [catalogKind, setCatalogKind] = useState<CatalogKind>("gym");
  const catalog = catalogKind === "gym" ? EXERCISE_CATALOG : CROSSFIT_CATALOG;
  const isBasic = block.type === "basic";
  const showWorkRest = !isBasic && (block.type === "interval" || block.type === "tabata" || block.type === "emom");
  const showDuration = !isBasic && !showWorkRest;
  const hasErrors = errors.length > 0;

  return (
    <Card className={`space-y-3 ${hasErrors ? "!border-danger-500" : ""}`}>
      <p className="font-tactical text-xs uppercase tracking-widest text-brand-500">
        BLOQUE {index} · {block.type.toUpperCase()}
      </p>

      <div className="flex items-center gap-2">
        <Select
          aria-label="Tipo de bloque"
          value={block.type}
          onChange={(e) => onChange({ ...block, type: e.target.value as BlockType })}
          className="flex-1"
        >
          {BLOCK_TYPES.map((type) => (
            <option key={type} value={type}>
              {type.toUpperCase()}
            </option>
          ))}
        </Select>
        <Button variant="ghost" type="button" onClick={onRemove} aria-label="Quitar bloque">
          🗑
        </Button>
      </div>

      {showDuration && (
        <Input
          aria-label="Duración (segundos)"
          type="number"
          value={block.durationSeconds}
          onChange={(e) => onChange({ ...block, durationSeconds: Number(e.target.value) })}
          placeholder="Duración (segundos)"
        />
      )}

      {showWorkRest && (
        <div className="grid grid-cols-3 gap-2">
          <Input
            aria-label="Segundos de trabajo"
            type="number"
            value={block.workSeconds ?? ""}
            onChange={(e) => onChange({ ...block, workSeconds: Number(e.target.value) })}
            placeholder="Trabajo (s)"
          />
          <Input
            aria-label="Segundos de descanso"
            type="number"
            value={block.restSeconds ?? ""}
            onChange={(e) => onChange({ ...block, restSeconds: Number(e.target.value) })}
            placeholder="Descanso (s)"
          />
          <Input
            aria-label="Rondas"
            type="number"
            value={block.rounds ?? ""}
            onChange={(e) => onChange({ ...block, rounds: Number(e.target.value) })}
            placeholder="Rondas"
          />
        </div>
      )}

      {isBasic && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Input
              aria-label="Tiempo de ejercicio (seg)"
              type="number"
              value={block.workSeconds ?? ""}
              onChange={(e) => onChange({ ...block, workSeconds: Number(e.target.value) })}
              placeholder="⏱ Tiempo de ejercicio (seg)"
            />
            <Input
              aria-label="Tiempo de pausa (seg)"
              type="number"
              value={block.restSeconds ?? ""}
              onChange={(e) => onChange({ ...block, restSeconds: Number(e.target.value) })}
              placeholder="⏸ Tiempo de pausa (seg)"
            />
            <Input
              aria-label="Cantidad de series"
              type="number"
              value={block.rounds ?? ""}
              onChange={(e) => onChange({ ...block, rounds: Number(e.target.value) })}
              placeholder="🔁 Cantidad de series"
            />
            <Input
              aria-label="Reps por serie"
              type="number"
              value={block.repsPerRound ?? ""}
              onChange={(e) => onChange({ ...block, repsPerRound: Number(e.target.value) })}
              placeholder="💪 Reps por serie"
            />
          </div>
          <p className="text-sm text-gray-400 font-tactical">
            Tiempo total estimado: {formatEstimateMinutes(estimateWorkoutDurationSeconds({ blocks: [block] } as never))}
          </p>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          size="md"
          variant={catalogKind === "gym" ? "primary" : "secondary"}
          aria-pressed={catalogKind === "gym"}
          onClick={() => setCatalogKind("gym")}
        >
          Gimnasio
        </Button>
        <Button
          type="button"
          size="md"
          variant={catalogKind === "crossfit" ? "primary" : "secondary"}
          aria-pressed={catalogKind === "crossfit"}
          onClick={() => setCatalogKind("crossfit")}
        >
          CrossFit
        </Button>
      </div>

      <div className="space-y-2">
        {block.exercises.map((exercise) => (
          <ExerciseEditor
            key={exercise.id}
            exercise={exercise}
            catalog={catalog}
            onChange={(updated) =>
              onChange({
                ...block,
                exercises: block.exercises.map((ex) => (ex.id === exercise.id ? updated : ex)),
              })
            }
            onRemove={() =>
              onChange({ ...block, exercises: block.exercises.filter((ex) => ex.id !== exercise.id) })
            }
          />
        ))}
        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            onChange({
              ...block,
              exercises: [...block.exercises, { id: crypto.randomUUID(), name: catalog[0].name }],
            })
          }
        >
          + Agregar ejercicio
        </Button>
      </div>

      {hasErrors && (
        <ul className="text-danger-500 text-sm space-y-1">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}
    </Card>
  );
}
