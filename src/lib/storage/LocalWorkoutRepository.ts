import type { Workout } from "@/types";
import type { Result, StorageError, WorkoutRepository } from "./WorkoutRepository";

const STORAGE_KEY = "gymtimer.workouts";

function ok<T>(value: T): Result<T, StorageError> {
  return { ok: true, value };
}

function err<T>(kind: StorageError["kind"], message: string): Result<T, StorageError> {
  return { ok: false, error: { kind, message } };
}

export class LocalWorkoutRepository implements WorkoutRepository {
  list(): Result<Workout[], StorageError> {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) {
        return err(
          "read_failed",
          `Expected an array of workouts in localStorage, got ${typeof parsed}`
        );
      }
      return ok(parsed as Workout[]);
    } catch {
      return err("read_failed", "Could not read workouts from localStorage");
    }
  }

  get(id: string): Result<Workout | null, StorageError> {
    const listResult = this.list();
    if (!listResult.ok) return listResult;
    return ok(listResult.value.find((w) => w.id === id) ?? null);
  }

  save(workout: Workout): Result<Workout, StorageError> {
    const listResult = this.list();
    if (!listResult.ok) return listResult;
    const existingIndex = listResult.value.findIndex((w) => w.id === workout.id);
    const next = [...listResult.value];
    if (existingIndex >= 0) {
      next[existingIndex] = workout;
    } else {
      next.push(workout);
    }
    return this.writeAll(next, workout);
  }

  delete(id: string): Result<void, StorageError> {
    const listResult = this.list();
    if (!listResult.ok) return listResult;
    const next = listResult.value.filter((w) => w.id !== id);
    const writeResult = this.writeAll(next, undefined);
    if (!writeResult.ok) return writeResult;
    return ok(undefined);
  }

  duplicate(id: string): Result<Workout, StorageError> {
    const getResult = this.get(id);
    if (!getResult.ok) return getResult;
    if (!getResult.value) {
      return err("not_found", `Workout ${id} not found`);
    }
    const copy: Workout = {
      ...getResult.value,
      id: crypto.randomUUID(),
      name: `${getResult.value.name} (copy)`,
      createdAt: new Date().toISOString(),
    };
    return this.save(copy);
  }

  private writeAll<T>(
    workouts: Workout[],
    returnValue: T
  ): Result<T, StorageError> {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
      return ok(returnValue as T);
    } catch {
      return err("write_failed", "Could not write workouts to localStorage");
    }
  }
}
