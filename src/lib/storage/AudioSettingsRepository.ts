import type { Result, StorageError } from "./WorkoutRepository";

export interface AudioSettings {
  volume: number;
  soundEnabled: boolean;
  voiceEnabled: boolean;
}

const STORAGE_KEY = "gymtimer.audioSettings";

const DEFAULTS: AudioSettings = { volume: 0.5, soundEnabled: true, voiceEnabled: false };

function ok<T>(value: T): Result<T, StorageError> {
  return { ok: true, value };
}

function err<T>(kind: StorageError["kind"], message: string): Result<T, StorageError> {
  return { ok: false, error: { kind, message } };
}

export class AudioSettingsRepository {
  get(): Result<AudioSettings, StorageError> {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return ok({ ...DEFAULTS });
      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        return ok({ ...DEFAULTS });
      }
      const p = parsed as Record<string, unknown>;
      return ok({
        volume: typeof p.volume === "number" ? p.volume : DEFAULTS.volume,
        soundEnabled: typeof p.soundEnabled === "boolean" ? p.soundEnabled : DEFAULTS.soundEnabled,
        voiceEnabled: typeof p.voiceEnabled === "boolean" ? p.voiceEnabled : DEFAULTS.voiceEnabled,
      });
    } catch {
      return ok({ ...DEFAULTS });
    }
  }

  save(settings: AudioSettings): Result<AudioSettings, StorageError> {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      return ok(settings);
    } catch {
      return err("write_failed", "No se pudieron guardar los ajustes de audio");
    }
  }
}
