"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    function handleChange() {
      const fs = Boolean(document.fullscreenElement);
      setIsFullscreen(fs);
      // Exit fullscreen also releases our wake lock — Chrome releases it
      // automatically when the page leaves fullscreen, but be defensive so
      // a second toggle doesn't try to release an already-released sentinel.
      if (!fs && wakeLockRef.current) {
        void wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    }
    document.addEventListener("fullscreenchange", handleChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleChange);
      void wakeLockRef.current?.release();
    };
  }, []);

  const toggle = useCallback(async () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
      return;
    }
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      // Fullscreen rejected (iframe, missing user gesture, denied permission).
      return;
    }
    // Wake Lock keeps the TV screen awake during a workout; ignored on
    // browsers without the API (Safari < 16.4, Firefox stable).
    if ("wakeLock" in navigator) {
      try {
        const sentinel = await navigator.wakeLock.request("screen");
        wakeLockRef.current = sentinel;
        sentinel.addEventListener("release", () => {
          if (wakeLockRef.current === sentinel) {
            wakeLockRef.current = null;
          }
        });
      } catch {
        // Wake lock denied (battery low, tab hidden) — silent.
      }
    }
  }, []);

  return { isFullscreen, toggle };
}
