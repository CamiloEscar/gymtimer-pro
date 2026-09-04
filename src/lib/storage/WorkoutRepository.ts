import type { Workout } from "@/types";

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export interface StorageError {
  kind: "read_failed" | "write_failed" | "not_found";
  message: string;
}

export interface WorkoutRepository {
  list(): Result<Workout[], StorageError>;
  get(id: string): Result<Workout | null, StorageError>;
  save(workout: Workout): Result<Workout, StorageError>;
  delete(id: string): Result<void, StorageError>;
  duplicate(id: string): Result<Workout, StorageError>;
}
