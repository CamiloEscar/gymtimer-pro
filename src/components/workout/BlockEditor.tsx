"use client";

import type { BlockType, WorkoutBlock } from "@/types";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EXERCISE_CATALOG } from "@/lib/workout/exerciseCatalog";
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
];

interface BlockEditorProps {
  block: WorkoutBlock;
  onChange: (block: WorkoutBlock) => void;
  onRemove: () => void;
}

export function BlockEditor({ block, onChange, onRemove }: BlockEditorProps) {
  const showWorkRest = block.type === "interval" || block.type === "tabata" || block.type === "emom";
  const showDuration = !showWorkRest;

  return (
    <Card className="space-y-3">
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

      <div className="space-y-2">
        {block.exercises.map((exercise) => (
          <ExerciseEditor
            key={exercise.id}
            exercise={exercise}
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
              exercises: [...block.exercises, { id: crypto.randomUUID(), name: EXERCISE_CATALOG[0].name }],
            })
          }
        >
          + Agregar ejercicio
        </Button>
      </div>
    </Card>
  );
}
