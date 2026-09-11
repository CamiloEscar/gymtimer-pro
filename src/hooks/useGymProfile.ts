"use client";

import { useSyncExternalStore } from "react";
import { GymProfileRepository, type GymProfile } from "@/lib/storage/GymProfileRepository";

let cachedProfile: GymProfile | null = null;

function getProfileSnapshot(): GymProfile | null {
  const result = new GymProfileRepository().get();
  const value = result.ok ? result.value : null;
  if (
    cachedProfile?.name !== value?.name ||
    cachedProfile?.logoUrl !== value?.logoUrl ||
    cachedProfile?.linkCode !== value?.linkCode ||
    cachedProfile?.defaultWorkSeconds !== value?.defaultWorkSeconds ||
    cachedProfile?.defaultRestSeconds !== value?.defaultRestSeconds
  ) {
    cachedProfile = value;
  }
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