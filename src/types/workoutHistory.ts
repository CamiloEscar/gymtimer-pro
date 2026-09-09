export interface WorkoutHistoryEntry {
  id: string;
  workoutId: string;
  workoutName: string;
  completedAt: string; // ISO timestamp
  durationMs: number;
}
