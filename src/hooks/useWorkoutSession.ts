"use client";

import { useEffect, useMemo, useState } from "react";
import { WorkoutEngine } from "@/lib/workout/WorkoutEngine";
import type { SessionState, Workout } from "@/types";

export function useWorkoutSession(workout: Workout) {
  const engine = useMemo(() => new WorkoutEngine(workout), [workout]);
  const [state, setState] = useState<SessionState>(() => engine.getState());

  useEffect(() => {
    const unsubscribe = engine.subscribe(setState);
    return () => {
      unsubscribe();
      engine.destroy();
    };
  }, [engine]);

  return {
    state,
    start: () => engine.start(),
    pause: () => engine.pause(),
    resume: () => engine.resume(),
    reset: () => engine.reset(),
    nextRound: () => engine.nextRound(),
    previousRound: () => engine.previousRound(),
    addTime: (ms: number) => engine.addTime(ms),
    subtractTime: (ms: number) => engine.subtractTime(ms),
  };
}
