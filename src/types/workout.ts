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

// What the exercise amount actually measures. `max` carries no amount — it's
// result-entry only. Runtime resolution (metricOf) prefers an explicit value,
// then infers from which amount field is present (calories→calories,
// distance→distance, time→time), falling back to reps — so pre-metricKind data
// keeps rendering exactly as today.
export type MetricKind =
  | "reps"
  | "distanceMeters"
  | "calories"
  | "timeSeconds"
  | "max";

// Per-exercise arithmetic ladder. cadencia(n) = max(min, start + step·(n−1)),
// clamped at min. step<0 descends, step>0 ascends, 0 holds fixed.
export interface RepScheme {
  start: number;
  step: number;
  min: number;
}

export interface Exercise {
  id: string;
  name: string;
  reps?: number;
  sets?: number;
  timeSeconds?: number;
  distanceMeters?: number;
  weightKg?: number;
  notes?: string;
  // New additive fields (crossfit-wod-models). Old localStorage data with none
  // of these hydrates unchanged — metricOf infers `reps`.
  calories?: number;
  metricKind?: MetricKind;
  windowKind?: "countdown" | "countup";
  // Per-exercise rep ladder. Each movement descends/ascends at its own cadence
  // (or stays fixed); a block can mix laddered and non-laddered exercises.
  repScheme?: RepScheme;
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
