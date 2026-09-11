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
  // Seconds prefilled into every new interval/tabata/emom/otm block, so a
  // box that always programs 40s work/20s rest doesn't retype it per block.
  defaultWorkSeconds?: number;
  defaultRestSeconds?: number;
  // Manually pinned Workout-of-the-Day. When set, the dashboard shows this
  // workout instead of the default last-created fallback.
  wodWorkoutId?: string;
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

function normalizeSeconds(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : undefined;
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
      const defaultWorkSeconds = normalizeSeconds(record.defaultWorkSeconds);
      if (defaultWorkSeconds !== undefined) profile.defaultWorkSeconds = defaultWorkSeconds;
      const defaultRestSeconds = normalizeSeconds(record.defaultRestSeconds);
      if (defaultRestSeconds !== undefined) profile.defaultRestSeconds = defaultRestSeconds;
      if (typeof record.wodWorkoutId === "string") profile.wodWorkoutId = record.wodWorkoutId;
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
    const defaultWorkSeconds = normalizeSeconds(profile.defaultWorkSeconds);
    if (defaultWorkSeconds !== undefined) cleaned.defaultWorkSeconds = defaultWorkSeconds;
    const defaultRestSeconds = normalizeSeconds(profile.defaultRestSeconds);
    if (defaultRestSeconds !== undefined) cleaned.defaultRestSeconds = defaultRestSeconds;
    if (profile.wodWorkoutId) cleaned.wodWorkoutId = profile.wodWorkoutId;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
      return ok(cleaned);
    } catch {
      return err("write_failed", "No se pudo guardar el perfil del gimnasio");
    }
  }
}