"use client";

import Link from "next/link";
import type { Workout } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface WorkoutOfTheDayProps {
  workout: Workout | null;
}

export function WorkoutOfTheDay({ workout }: WorkoutOfTheDayProps) {
  if (!workout) {
    return (
      <Card>
        <p className="text-gray-400">No workout of the day yet — create one in the Library.</p>
      </Card>
    );
  }

  return (
    <Card className="space-y-2">
      <p className="text-sm uppercase text-brand-500 tracking-wide">Workout of the day</p>
      <p className="text-2xl font-bold text-white">{workout.name}</p>
      <Link href={`/app/workouts/${workout.id}/run`}>
        <Button size="lg">Start</Button>
      </Link>
    </Card>
  );
}
