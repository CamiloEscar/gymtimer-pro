import type { Result, StorageError } from "./WorkoutRepository";

export interface DisplaySettings {
  showVideoOnDisplay: boolean;
}

const STORAGE_KEY = "gymtimer.displaySettings";

function ok<T>(value: T): Result<T, StorageError> {
  return { ok: true, value };
}

function err<T>(kind: StorageError["kind"], message: string): Result<T, StorageError> {
  return { ok: false, error: { kind, message } };
}

export class DisplaySettingsRepository {
  get(): Result<DisplaySettings, StorageError> {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return ok({ showVideoOnDisplay: true });
      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        return err("read_failed", "No se pudieron leer los ajustes de pantalla");
      }
      return ok(parsed as DisplaySettings);
    } catch {
      return err("read_failed", "No se pudieron leer los ajustes de pantalla");
    }
  }

  save(settings: DisplaySettings): Result<DisplaySettings, StorageError> {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      return ok(settings);
    } catch {
      return err("write_failed", "No se pudieron guardar los ajustes de pantalla");
    }
  }
}