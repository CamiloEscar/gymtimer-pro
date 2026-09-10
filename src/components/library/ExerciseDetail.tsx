"use client";

import { useRouter } from "next/navigation";
import type { CatalogExercise } from "@/lib/workout/exerciseCatalog";
import type { Workout } from "@/types";
import { LocalWorkoutRepository } from "@/lib/storage/LocalWorkoutRepository";
import { VideoPlayer } from "@/components/ui/VideoPlayer";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

interface ExerciseDetailProps {
  exercise: CatalogExercise;
}

export function ExerciseDetail({ exercise }: ExerciseDetailProps) {
  const router = useRouter();

  function handleQuickStart() {
    const workout: Workout = {
      id: crypto.randomUUID(),
      name: exercise.name,
      createdAt: new Date().toISOString(),
      favorite: false,
      blocks: [
        {
          id: crypto.randomUUID(),
          type: "interval",
          durationSeconds: 0,
          workSeconds: 40,
          restSeconds: 20,
          rounds: 3,
          exercises: [{ id: crypto.randomUUID(), name: exercise.name, reps: 12 }],
        },
      ],
    };
    const result = new LocalWorkoutRepository().save(workout);
    if (result.ok) router.push(`/app/workouts/${result.value.id}`);
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white font-industrial">{exercise.name}</h1>
        <p className="font-tactical text-xs uppercase tracking-widest text-brand-500">
          {exercise.category}
        </p>
      </div>
      {exercise.description && <p className="text-phosphor-dim">{exercise.description}</p>}
      {exercise.videoUrl && (
        <VideoPlayer
          src={exercise.videoUrl}
          thumbnailSrc={exercise.thumbnailUrl}
          alt={exercise.name}
          rounded
        />
      )}
      <Button size="md" onClick={handleQuickStart}>
        <Icon name="play" />
        Arrancar con este ejercicio
      </Button>
    </div>
  );
}