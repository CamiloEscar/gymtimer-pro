import type { MetricKind } from "./workout";

export interface UserExerciseOverride {
  exerciseId: string;
  name?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  description?: string;
  metricKind?: MetricKind;
}