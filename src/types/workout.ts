export type BlockType =
  | "countdown"
  | "countup"
  | "amrap"
  | "emom"
  | "otm"
  | "interval"
  | "tabata"
  | "forTime"
  | "rest"
  | "basic"
  | "rm"
  | "fightGoneBad";

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
  repsPerRound?: number;
  exercises: Exercise[];
  label?: string;
  // EMOM/OTM: cap that bounds each round. If work+rest < interval, the
  // remaining time is a passive "wait" phase before the next round.
  intervalSeconds?: number;
  // fightGoneBad: time per station (one exercise) inside a round.
  stationSeconds?: number;
  // fightGoneBad: rest between full rounds of stations.
  roundRestSeconds?: number;
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
