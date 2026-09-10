import type { Result, StorageError } from "./WorkoutRepository";

export interface GymProfile {
  name: string;
  logoUrl?: string;
}

const STORAGE_KEY = "gymtimer.gymProfile";

function ok<T>(value: T): Result<T, StorageError> {
  return { ok: true, value };
}

function err<T>(kind: StorageError["kind"], message: string): Result<T, StorageError> {
  return { ok: false, error: { kind, message } };
}

export class GymProfileRepository {
  get(): Result<GymProfile, StorageError> {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return ok({ name: "" });
      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        return err("read_failed", "No se pudo leer el perfil del gimnasio");
      }
      const record = parsed as Record<string, unknown>;
      const name = typeof record.name === "string" ? record.name : "";
      const logoUrl = typeof record.logoUrl === "string" ? record.logoUrl : undefined;
      return ok(logoUrl ? { name, logoUrl } : { name });
    } catch {
      return err("read_failed", "No se pudo leer el perfil del gimnasio");
    }
  }

  save(profile: GymProfile): Result<GymProfile, StorageError> {
    const cleaned: GymProfile = profile.logoUrl
      ? { name: profile.name, logoUrl: profile.logoUrl }
      : { name: profile.name };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
      return ok(cleaned);
    } catch {
      return err("write_failed", "No se pudo guardar el perfil del gimnasio");
    }
  }
}