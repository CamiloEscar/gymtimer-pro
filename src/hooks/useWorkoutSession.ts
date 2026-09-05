"use client";

import { useEffect, useRef, useState } from "react";
import { WorkoutEngine } from "@/lib/workout/WorkoutEngine";
import type { SessionState, Workout } from "@/types";

export function useWorkoutSession(workout: Workout) {
  const engineRef = useRef<WorkoutEngine | null>(null);
  // Lazy initializer only reads a throwaway engine's initial snapshot for the
  // very first render; the effect below owns the engine that is actually
  // subscribed to and interacted with.
  const [state, setState] = useState<SessionState>(() => new WorkoutEngine(workout).getState());

  useEffect(() => {
    // Created and destroyed within this single effect (rather than via
    // useMemo + a separate subscribe effect) so React Strict Mode's dev-only
    // double-invoke of effects can't call destroy() on an engine instance
    // that a later setup still expects to be alive. destroy() unsubscribes
    // WorkoutEngine from its internal TimerEngine permanently, so reusing a
    // destroyed instance silently stops all future tick updates.
    const engine = new WorkoutEngine(workout);
    engineRef.current = engine;
    setState(engine.getState());
    const unsubscribe = engine.subscribe(setState);
    return () => {
      unsubscribe();
      engine.destroy();
      if (engineRef.current === engine) engineRef.current = null;
    };
  }, [workout]);

  return {
    state,
    start: () => engineRef.current?.start(),
    pause: () => engineRef.current?.pause(),
    resume: () => engineRef.current?.resume(),
    reset: () => engineRef.current?.reset(),
    nextRound: () => engineRef.current?.nextRound(),
    previousRound: () => engineRef.current?.previousRound(),
    addTime: (ms: number) => engineRef.current?.addTime(ms),
    subtractTime: (ms: number) => engineRef.current?.subtractTime(ms),
  };
}
