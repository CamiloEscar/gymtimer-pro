"use client";

import { useEffect, useRef, useState } from "react";
import { WorkoutEngine } from "@/lib/workout/WorkoutEngine";
import type { AudioManager } from "@/lib/audio/AudioManager";
import type { SessionState, Workout } from "@/types";

interface SavedSession {
  state: SessionState;
  savedAt: number;
}

// Plan A resume: each workout keeps a localStorage snapshot of its last
// session state plus the wall-clock capture time. Re-mounting the run page
// re-anchors a fresh WorkoutEngine to that snapshot — the same mechanism the
// /display mirror uses to stay live from Pusher — so navigating away and back
// resumes instead of restarting. Returns null when there's nothing usable.
function loadSavedSession(workoutId: string): SavedSession | null {
  try {
    const raw = window.localStorage.getItem(`gymtimer.sessionState.${workoutId}`);
    if (!raw) return null;
    return JSON.parse(raw) as SavedSession;
  } catch {
    return null;
  }
}

function buildEngine(workout: Workout, audio: AudioManager | null): WorkoutEngine {
  const engine = new WorkoutEngine(workout, audio);
  const saved = loadSavedSession(workout.id);
  if (saved) {
    try {
      engine.hydrate(saved.state, saved.savedAt);
    } catch {
      // Stale snapshot (e.g. the workout was edited mid-session, so the saved
      // blockIndex/phase no longer exists) can leave the engine half-mutated
      // during hydrate(); throw that one away and start genuinely fresh.
      engine.destroy();
      return new WorkoutEngine(workout, audio);
    }
  }
  return engine;
}

export function useWorkoutSession(workout: Workout, audio: AudioManager | null = null) {
  const engineRef = useRef<WorkoutEngine | null>(null);
  // Lazy initializer only reads a throwaway engine's snapshot for the very
  // first render; the effect below owns the engine that is actually
  // subscribed to and interacted with. The throwaway is destroyed right away
  // so a "running" snapshot can't leave a stray setInterval ticking.
  const [state, setState] = useState<SessionState>(() => {
    const engine = buildEngine(workout, audio);
    const snapshot = engine.getState();
    engine.destroy();
    return snapshot;
  });

  /* eslint-disable react-hooks/set-state-in-effect -- see engine lifecycle comment below; effect must seed the initial state and subscribe in the same pass so Strict Mode cannot drop subscriptions on a torn-down instance */
  useEffect(() => {
    // Created and destroyed within this single effect (rather than via
    // useMemo + a separate subscribe effect) so React Strict Mode's dev-only
    // double-invoke of effects can't call destroy() on an engine instance
    // that a later setup still expects to be alive. destroy() unsubscribes
    // WorkoutEngine from its internal TimerEngine permanently, so reusing a
    // destroyed instance silently stops all future tick updates.
    const engine = buildEngine(workout, audio);
    engineRef.current = engine;
    setState(engine.getState());
    const unsubscribe = engine.subscribe(setState);
    return () => {
      unsubscribe();
      engine.destroy();
      if (engineRef.current === engine) engineRef.current = null;
    };
  }, [workout, audio]);
  /* eslint-enable react-hooks/set-state-in-effect */

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
    addRep: () => engineRef.current?.addRep(),
    removeRep: () => engineRef.current?.removeRep(),
  };
}
