"use client";

import { useEffect, useMemo, useState } from "react";
import type { Workout } from "@/types";
import { LocalWorkoutRepository } from "@/lib/storage/LocalWorkoutRepository";
import { WorkoutHistoryRepository } from "@/lib/storage/WorkoutHistoryRepository";
import { computeHistoryStats } from "@/lib/history/computeHistoryStats";
import { Input } from "@/components/ui/Input";
import { StatsRow } from "./StatsRow";
import { QuickActions } from "./QuickActions";
import { WorkoutOfTheDay } from "./WorkoutOfTheDay";
import { RecentWorkouts } from "./RecentWorkouts";

function greeting(hour: number): string {
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

export function Dashboard() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [historyStats, setHistoryStats] = useState(computeHistoryStats([]));
  const [query, setQuery] = useState("");
  const workoutRepo = useMemo(() => new LocalWorkoutRepository(), []);

  function reload() {
    const result = workoutRepo.list();
    setWorkouts(result.ok ? result.value : []);
    const historyResult = new WorkoutHistoryRepository().list();
    setHistoryStats(computeHistoryStats(historyResult.ok ? historyResult.value : []));
  }

  useEffect(() => {
    reload();
  }, []);

  const workoutOfTheDay = workouts.length > 0 ? workouts[workouts.length - 1] : null;
  const isSearching = query.trim().length > 0;
  const filtered = isSearching
    ? workouts.filter((w) => w.name.toLowerCase().includes(query.trim().toLowerCase()))
    : workouts.filter((w) => w.id !== workoutOfTheDay?.id);

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div>
        <p className="text-brand-500 text-sm uppercase tracking-wide">{greeting(new Date().getHours())}</p>
        <h1 className="text-2xl font-bold text-white font-industrial">¿Qué entrenamos hoy?</h1>
      </div>

      <StatsRow stats={historyStats} totalRoutines={workouts.length} />

      <QuickActions workoutOfTheDay={workoutOfTheDay} />

      <Input
        placeholder="Buscar entrenamiento..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Buscar entrenamiento"
      />

      {!isSearching && <WorkoutOfTheDay workout={workoutOfTheDay} />}

      <RecentWorkouts
        workouts={filtered}
        onDuplicate={(id) => {
          workoutRepo.duplicate(id);
          reload();
        }}
        onDelete={(id) => {
          workoutRepo.delete(id);
          reload();
        }}
      />
    </div>
  );
}
