"use client";

import { useSyncExternalStore } from "react";
import { aggregateRunStats, type RunStats } from "@/lib/history/runStats";

// Same source-of-truth key as Dashboard's history hook, but a *separate*
// cached snapshot so the two hooks don't poison each other's typed cache
// entries — useLocalStorageSnapshot shares a module-level cache by key, and
// Dashboard stores HistoryStats here while useRunStats stores a Map.
const HISTORY_STORAGE_KEY = "gymtimer.history";

let cachedStats: Map<string, RunStats> = new Map();
let cachedRaw: string | null = null;

function getSnapshot(): Map<string, RunStats> {
  const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
  if (cachedRaw === (raw ?? "")) return cachedStats;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    cachedStats = aggregateRunStats(Array.isArray(parsed) ? (parsed as never[]) : []);
  } catch {
    cachedStats = new Map();
  }
  cachedRaw = raw ?? "";
  return cachedStats;
}

function subscribe(onChange: () => void) {
  const handler = () => {
    cachedRaw = null; // invalidate
    onChange();
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

/**
 * Live snapshot of run stats per workoutId (count + lastRunAt). Reactive to
 * history changes from any tab/session, so the dashboard cards update
 * immediately after a WOD is finished.
 */
export function useRunStats(): Map<string, RunStats> {
  return useSyncExternalStore(subscribe, getSnapshot, () => new Map());
}
