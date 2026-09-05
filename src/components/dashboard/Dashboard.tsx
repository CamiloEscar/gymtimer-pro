"use client";

import { useEffect, useState } from "react";
import type { Workout } from "@/types";
import { LocalWorkoutRepository } from "@/lib/storage/LocalWorkoutRepository";
import { WorkoutOfTheDay } from "./WorkoutOfTheDay";
import { RecentWorkouts } from "./RecentWorkouts";

export function Dashboard() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  useEffect(() => {
    const repo = new LocalWorkoutRepository();
    const result = repo.list();
    setWorkouts(result.ok ? result.value : []);
  }, []);

  const workoutOfTheDay = workouts.length > 0 ? workouts[workouts.length - 1] : null;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold text-white">¿Qué entrenamos hoy?</h1>
      <WorkoutOfTheDay workout={workoutOfTheDay} />
      <RecentWorkouts workouts={workouts} />
    </div>
  );
}
