"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Workout, WorkoutBlock } from "@/types";
import { LocalWorkoutRepository } from "@/lib/storage/LocalWorkoutRepository";
import { validateWorkout } from "@/lib/workout/validateWorkout";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { BlockEditor } from "./BlockEditor";

function emptyBlock(): WorkoutBlock {
  return { id: crypto.randomUUID(), type: "amrap", durationSeconds: 600, exercises: [] };
}

interface WorkoutBuilderProps {
  initialWorkout?: Workout;
}

export function WorkoutBuilder({ initialWorkout }: WorkoutBuilderProps) {
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
  const [errors, setErrors] = useState<string[]>([]);

  function handleSave() {
    const validationErrors = validateWorkout(workout);
    setErrors(validationErrors);
    if (validationErrors.length > 0) return;

    const repo = new LocalWorkoutRepository();
    const result = repo.save(workout);
    if (!result.ok) {
      setErrors([result.error.message]);
      return;
    }
    router.push("/app/workouts");
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <Input
        aria-label="Workout name"
        value={workout.name}
        onChange={(e) => setWorkout({ ...workout, name: e.target.value })}
        placeholder="Workout name (e.g. Murph Training)"
      />

      {errors.length > 0 && (
        <ul className="text-danger-500 text-sm space-y-1">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}

      <div className="space-y-3">
        {workout.blocks.map((block) => (
          <BlockEditor
            key={block.id}
            block={block}
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
          + Add block
        </Button>
      </div>

      <Button type="button" size="lg" onClick={handleSave} className="w-full">
        Save workout
      </Button>
    </div>
  );
}
