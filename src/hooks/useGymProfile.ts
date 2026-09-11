"use client";

import { useSyncExternalStore } from "react";
import { GymProfileRepository, type GymProfile } from "@/lib/storage/GymProfileRepository";

// Cache keyed by raw stored JSON so the snapshot stays reference-stable
// between unrelated renders (a new GymProfileRepository().get() would clone
// the weeklyPlan object every call, making useSyncExternalStore loop).
let cachedRaw: string | null = null;
let cachedProfile: GymProfile | null = null;

function getProfileSnapshot(): GymProfile | null {
  const raw = window.localStorage.getItem("gymtimer.gymProfile");
  if (cachedRaw === (raw ?? null)) return cachedProfile;
  cachedRaw = raw ?? null;
  const result = new GymProfileRepository().get();
  cachedProfile = result.ok ? result.value : null;
  return cachedProfile;
}

export function useGymProfile(): GymProfile | null {
  return useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("storage", onStoreChange);
      return () => window.removeEventListener("storage", onStoreChange);
    },
    getProfileSnapshot,
    () => null,
  );
}