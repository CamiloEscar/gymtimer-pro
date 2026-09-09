"use client";

import { useSyncExternalStore } from "react";
import type { WorkoutHistoryEntry } from "@/types";
import {
  HISTORY_STORAGE_KEY,
  WorkoutHistoryRepository,
} from "@/lib/storage/WorkoutHistoryRepository";

const repo = new WorkoutHistoryRepository();
const emptySubscribe = () => () => {};
const SERVER_EMPTY: WorkoutHistoryEntry[] = [];

let cacheRaw: string | null | undefined;
let cacheValue: WorkoutHistoryEntry[] = [];

function getSnapshot(): WorkoutHistoryEntry[] {
  const currentRaw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
  if (currentRaw === cacheRaw) return cacheValue;
  const result = repo.list();
  cacheValue = result.ok ? result.value : [];
  cacheRaw = currentRaw;
  return cacheValue;
}

const getServerSnapshot = () => SERVER_EMPTY;

export function useHistoryEntries(): WorkoutHistoryEntry[] {
  return useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot);
}