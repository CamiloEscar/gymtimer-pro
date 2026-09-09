export interface WorkoutHistoryEntry {
  id: string;
  workoutId: string;
  workoutName: string;
  completedAt: string; // ISO timestamp
  durationMs: number;
  // Rep tally captured when the last finished block was an RM block. 0
  // means the trainer ran the RM block but never tapped +1. undefined
  // means the workout had no RM block (or the RM block wasn't the last one).
  reps?: number;
}
