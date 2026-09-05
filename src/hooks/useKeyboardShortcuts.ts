"use client";

import { useEffect } from "react";

interface Shortcuts {
  onPauseResume: () => void;
  onReset: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onFullscreen: () => void;
}

const TEXT_INPUT_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

export function useKeyboardShortcuts(shortcuts: Shortcuts) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && TEXT_INPUT_TAGS.has(target.tagName)) return;

      switch (event.code) {
        case "Space":
          event.preventDefault();
          shortcuts.onPauseResume();
          break;
        case "KeyR":
          shortcuts.onReset();
          break;
        case "KeyN":
        case "ArrowRight":
          shortcuts.onNext();
          break;
        case "ArrowLeft":
          shortcuts.onPrevious();
          break;
        case "KeyF":
          shortcuts.onFullscreen();
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
}
