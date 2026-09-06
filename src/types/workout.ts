export type BlockType =
  | "countdown"
  | "countup"
  | "amrap"
  | "emom"
  | "interval"
  | "tabata"
  | "forTime"
  | "rest";

export interface Exercise {
  id: string;
  name: string;
  reps?: number;
  sets?: number;
  timeSeconds?: number;
  distanceMeters?: number;
  weightKg?: number;
  notes?: string;
}

export interface WorkoutBlock {
  id: string;
  type: BlockType;
  durationSeconds: number;
  workSeconds?: number;
  restSeconds?: number;
  rounds?: number;
  exercises: Exercise[];
  label?: string;
}

export interface Workout {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  favorite: boolean;
  blocks: WorkoutBlock[];
}

export interface WorkoutResult {
  id: string;
  workoutId: string;
  athleteName: string;
  rounds?: number;
  reps?: number;
  weightKg?: number;
  timeSeconds?: number;
  notes?: string;
  recordedAt: string;
}
