"use client";

import type { BlockType, WorkoutBlock } from "@/types";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
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
          aria-label="Block type"
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
        <Button variant="ghost" type="button" onClick={onRemove} aria-label="Remove block">
          🗑
        </Button>
      </div>

      {showDuration && (
        <Input
          aria-label="Duration (seconds)"
          type="number"
          value={block.durationSeconds}
          onChange={(e) => onChange({ ...block, durationSeconds: Number(e.target.value) })}
          placeholder="Duration (seconds)"
        />
      )}

      {showWorkRest && (
        <div className="grid grid-cols-3 gap-2">
          <Input
            aria-label="Work seconds"
            type="number"
            value={block.workSeconds ?? ""}
            onChange={(e) => onChange({ ...block, workSeconds: Number(e.target.value) })}
            placeholder="Work (s)"
          />
          <Input
            aria-label="Rest seconds"
            type="number"
            value={block.restSeconds ?? ""}
            onChange={(e) => onChange({ ...block, restSeconds: Number(e.target.value) })}
            placeholder="Rest (s)"
          />
          <Input
            aria-label="Rounds"
            type="number"
            value={block.rounds ?? ""}
            onChange={(e) => onChange({ ...block, rounds: Number(e.target.value) })}
            placeholder="Rounds"
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
              exercises: [...block.exercises, { id: crypto.randomUUID(), name: "" }],
            })
          }
        >
          + Add exercise
        </Button>
      </div>
    </Card>
  );
}
