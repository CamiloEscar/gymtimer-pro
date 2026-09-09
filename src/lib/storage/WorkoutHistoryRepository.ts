import type { WorkoutHistoryEntry } from "@/types";
import type { Result, StorageError } from "./WorkoutRepository";

const STORAGE_KEY = "gymtimer.history";

function ok<T>(value: T): Result<T, StorageError> {
  return { ok: true, value };
}

function err<T>(kind: StorageError["kind"], message: string): Result<T, StorageError> {
  return { ok: false, error: { kind, message } };
}

export class WorkoutHistoryRepository {
  list(): Result<WorkoutHistoryEntry[], StorageError> {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) {
        return err("read_failed", `Se esperaba un array de historial, se obtuvo ${typeof parsed}`);
      }
      return ok(parsed as WorkoutHistoryEntry[]);
    } catch {
      return err("read_failed", "No se pudo leer el historial del almacenamiento local");
    }
  }

  record(entry: Omit<WorkoutHistoryEntry, "id">): Result<WorkoutHistoryEntry, StorageError> {
    const listResult = this.list();
    if (!listResult.ok) return listResult;
    const full: WorkoutHistoryEntry = { ...entry, id: crypto.randomUUID() };
    const next = [...listResult.value, full];
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return ok(full);
    } catch {
      return err("write_failed", "No se pudo guardar el historial en el almacenamiento local");
    }
  }
}
