"use client";

import { useSyncExternalStore } from "react";

const cache = new Map<string, { raw: string; value: unknown }>();

function subscribeStorage(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

/**
 * Snapshot of a localStorage key via useSyncExternalStore. SSR-safe: the
 * server snapshot is always `fallback`, so reading `window` happens only on
 * the client after hydration. Values are cached by raw content so that
 * JSON-parsed objects stay reference-stable between unrelated renders.
 */
export function useLocalStorageSnapshot<T>(
  key: string,
  read: () => T,
  fallback: T
): T {
  const getSnapshot = (): T => {
    const raw = window.localStorage.getItem(key);
    const entry = cache.get(key);
    if (entry && entry.raw === (raw ?? "")) return entry.value as T;
    let value: T;
    try {
      value = read();
    } catch {
      value = fallback;
    }
    cache.set(key, { raw: raw ?? "", value });
    return value;
  };
  return useSyncExternalStore(subscribeStorage, getSnapshot, () => fallback);
}

/**
 * Same-tab writes don't fire the native `storage` event; call this after
 * persisting so snapshot subscribers re-read the changed key.
 */
export function notifyLocalStorageChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("storage"));
  }
}