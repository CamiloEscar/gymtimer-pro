import type { Result, StorageError } from "./WorkoutRepository";

export interface GymProfile {
  name: string;
  logoUrl?: string;
  // Fixed 6-char session code shared by every Trainer↔Display pair in the
  // gym. When set, the trainer's run page and the /display landing skip
  // generating a random code and reuse this one, so the TV display stays
  // paired to the trainer even after navigating back/forward between
  // routines or reloading the page. Optional — empty means keep the
  // current random-per-session behavior.
  linkCode?: string;
}

const STORAGE_KEY = "gymtimer.gymProfile";

function ok<T>(value: T): Result<T, StorageError> {
  return { ok: true, value };
}

function err<T>(kind: StorageError["kind"], message: string): Result<T, StorageError> {
  return { ok: false, error: { kind, message } };
}

function normalizeLinkCode(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().toUpperCase();
  if (!trimmed) return undefined;
  return trimmed;
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
      const linkCode = normalizeLinkCode(record.linkCode);
      const profile: GymProfile = { name };
      if (logoUrl) profile.logoUrl = logoUrl;
      if (linkCode) profile.linkCode = linkCode;
      return ok(profile);
    } catch {
      return err("read_failed", "No se pudo leer el perfil del gimnasio");
    }
  }

  save(profile: GymProfile): Result<GymProfile, StorageError> {
    const cleaned: GymProfile = { name: profile.name };
    if (profile.logoUrl) cleaned.logoUrl = profile.logoUrl;
    const linkCode = normalizeLinkCode(profile.linkCode);
    if (linkCode) cleaned.linkCode = linkCode;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
      return ok(cleaned);
    } catch {
      return err("write_failed", "No se pudo guardar el perfil del gimnasio");
    }
  }
}