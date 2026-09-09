import type { Workout, UserExerciseOverride } from "@/types";
import type { SessionVideoInfo } from "@/types/session";
import type { CatalogExercise } from "./exerciseCatalog";
import { EXERCISE_CATALOG, getEffectiveCatalog } from "./exerciseCatalog";
import { CROSSFIT_CATALOG } from "./exerciseCatalogCrossfit";

export function resolveExerciseVideos(
  workout: Workout,
  overrides: UserExerciseOverride[]
): Record<string, SessionVideoInfo> {
  const byName = new Map<string, CatalogExercise>();
  const all = [
    ...getEffectiveCatalog(EXERCISE_CATALOG, overrides),
    ...getEffectiveCatalog(CROSSFIT_CATALOG, overrides),
  ];
  for (const entry of all) {
    if (!byName.has(entry.name)) byName.set(entry.name, entry);
  }
  const videos: Record<string, SessionVideoInfo> = {};
  for (const block of workout.blocks) {
    for (const exercise of block.exercises) {
      const entry = byName.get(exercise.name);
      if (entry?.videoUrl) {
        videos[exercise.id] = { videoUrl: entry.videoUrl, thumbnailUrl: entry.thumbnailUrl };
      }
    }
  }
  return videos;
}