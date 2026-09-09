import type { UserExerciseOverride } from "@/types";
import type { Result, StorageError } from "./WorkoutRepository";

const STORAGE_KEY = "gymtimer.exerciseOverrides";

function ok<T>(value: T): Result<T, StorageError> {
  return { ok: true, value };
}

function err<T>(kind: StorageError["kind"], message: string): Result<T, StorageError> {
  return { ok: false, error: { kind, message } };
}

export class UserExerciseOverrideRepository {
  list(): Result<UserExerciseOverride[], StorageError> {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) {
        return err("read_failed", `Se esperaba un array de overrides, se obtuvo ${typeof parsed}`);
      }
      return ok(parsed as UserExerciseOverride[]);
    } catch {
      return err("read_failed", "No se pudieron leer los overrides del almacenamiento local");
    }
  }

  save(override: UserExerciseOverride): Result<UserExerciseOverride, StorageError> {
    const listResult = this.list();
    if (!listResult.ok) return listResult;
    const cleaned = Object.fromEntries(
      Object.entries(override).filter(([, value]) => value !== undefined)
    ) as UserExerciseOverride;
    const next = listResult.value.some((entry) => entry.exerciseId === cleaned.exerciseId)
      ? listResult.value.map((entry) =>
          entry.exerciseId === cleaned.exerciseId ? cleaned : entry
        )
      : [...listResult.value, cleaned];
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return ok(cleaned);
    } catch {
      return err("write_failed", "No se pudieron guardar los overrides en el almacenamiento local");
    }
  }

  remove(exerciseId: string): Result<void, StorageError> {
    const listResult = this.list();
    if (!listResult.ok) return listResult;
    const next = listResult.value.filter((entry) => entry.exerciseId !== exerciseId);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return ok(undefined);
    } catch {
      return err("write_failed", "No se pudieron guardar los overrides en el almacenamiento local");
    }
  }
}