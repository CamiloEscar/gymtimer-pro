"use client";

import type { Exercise } from "@/types";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface ExerciseEditorProps {
  exercise: Exercise;
  onChange: (exercise: Exercise) => void;
  onRemove: () => void;
}

export function ExerciseEditor({ exercise, onChange, onRemove }: ExerciseEditorProps) {
  return (
    <div className="flex items-center gap-2">
      <Input
        aria-label="Exercise name"
        value={exercise.name}
        onChange={(e) => onChange({ ...exercise, name: e.target.value })}
        placeholder="Push Ups"
        className="flex-1"
      />
      <Input
        aria-label="Reps"
        type="number"
        value={exercise.reps ?? ""}
        onChange={(e) =>
          onChange({ ...exercise, reps: e.target.value ? Number(e.target.value) : undefined })
        }
        placeholder="Reps"
        className="w-20"
      />
      <Button variant="ghost" size="md" type="button" onClick={onRemove} aria-label="Remove exercise">
        ✕
      </Button>
    </div>
  );
}
