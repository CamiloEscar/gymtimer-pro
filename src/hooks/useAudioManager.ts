"use client";

import { useEffect, useMemo } from "react";
import { AudioManager } from "@/lib/audio/AudioManager";
import { AudioSettingsRepository } from "@/lib/storage/AudioSettingsRepository";
import { useLocalStorageSnapshot } from "./useLocalStorageSnapshot";
import type { AudioSettings } from "@/lib/storage/AudioSettingsRepository";

const DEFAULTS: AudioSettings = { volume: 0.5, soundEnabled: true, voiceEnabled: false };

/**
 * Shared AudioManager wired to persisted AudioSettings. Settings changes in
 * this tab (or any other, via the storage event) are pushed into the
 * manager immediately, so the run page and display screen stay in sync.
 *
 * The same AudioManager instance survives for the component's lifetime so
 * its unlocked AudioContext (granted by the first user gesture) is never
 * dropped when settings change.
 */
export function useAudioManager(): AudioManager {
  const settings = useLocalStorageSnapshot<AudioSettings>(
    "gymtimer.audioSettings",
    () => {
      const result = new AudioSettingsRepository().get();
      return result.ok ? result.value : DEFAULTS;
    },
    DEFAULTS
  );

  const audio = useMemo(() => new AudioManager(), []);

  useEffect(() => {
    audio.setVolume(settings.volume);
    audio.setEnabled(settings.soundEnabled);
    audio.setVoiceEnabled(settings.voiceEnabled);
  }, [audio, settings]);

  return audio;
}