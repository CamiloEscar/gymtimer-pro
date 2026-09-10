import { describe, it, expect } from "vitest";
import type { Workout, UserExerciseOverride } from "@/types";
import { resolveExerciseVideos } from "../resolveExerciseVideos";

const overrideSentadilla: UserExerciseOverride = {
  exerciseId: "leg-01",
  videoUrl: "/exercises/squat.mp4",
  thumbnailUrl: "/exercises/squat.jpg",
};

function buildWorkout(blocks: Workout["blocks"]): Workout {
  return {
    id: "w1",
    name: "Prueba",
    createdAt: "2026-01-01T10:00:00.000Z",
    favorite: false,
    blocks,
  };
}

describe("resolveExerciseVideos", () => {
  it("resolves a video by exercise name from the catalog when a matching override adds a videoUrl", () => {
    const workout = buildWorkout([
      {
        id: "b1",
        type: "countdown",
        durationSeconds: 60,
        exercises: [{ id: "x1", name: "Sentadilla" }],
      },
    ]);
    const result = resolveExerciseVideos(workout, [overrideSentadilla]);
    expect(result).toEqual({
      x1: { videoUrl: "/exercises/squat.mp4", thumbnailUrl: "/exercises/squat.jpg" },
    });
  });

  it("returns an empty map when no exercise name matches a catalog entry with video", () => {
    const workout = buildWorkout([
      {
        id: "b1",
        type: "countdown",
        durationSeconds: 60,
        exercises: [{ id: "x1", name: "Movimiento inexistente" }],
      },
    ]);
    const result = resolveExerciseVideos(workout, [overrideSentadilla]);
    expect(result).toEqual({});
  });

  it("keeps the catalog videoUrl when an override only renames the exercise", () => {
    // Override is a partial merge: it supplies `name` but leaves `videoUrl`
    // (and other fields) inherited from the catalog. The catalog ships a
    // videoUrl for every entry, so the result still has a video.
    const overrideNameOnly: UserExerciseOverride = { exerciseId: "leg-01", name: "Sentadilla profunda" };
    const workout = buildWorkout([
      {
        id: "b1",
        type: "countdown",
        durationSeconds: 60,
        exercises: [{ id: "x1", name: "Sentadilla profunda" }],
      },
    ]);
    const result = resolveExerciseVideos(workout, [overrideNameOnly]);
    expect(result).toEqual({
      x1: { videoUrl: "/exercises/leg-01.mp4", thumbnailUrl: undefined },
    });
  });

  it("uses the catalog videoUrl when an override is absent, and the override value when present", () => {
    const overridePress: UserExerciseOverride = {
      exerciseId: "chest-01",
      videoUrl: "/exercises/bench.mp4",
    };
    const workout = buildWorkout([
      {
        id: "b1",
        type: "countdown",
        durationSeconds: 60,
        exercises: [{ id: "x1", name: "Sentadilla" }],
      },
      {
        id: "b2",
        type: "countdown",
        durationSeconds: 60,
        exercises: [{ id: "x2", name: "Press banca" }, { id: "x3", name: "Plancha" }],
      },
    ]);
    const result = resolveExerciseVideos(workout, [overrideSentadilla, overridePress]);
    // Sentadilla: override provides videoUrl + thumbnailUrl → wins.
    // Press banca: override provides videoUrl → wins.
    // Plancha: no override → falls back to the catalog videoUrl for the
    // matching entry (every catalog entry ships a default videoUrl now).
    expect(result).toEqual({
      x1: { videoUrl: "/exercises/squat.mp4", thumbnailUrl: "/exercises/squat.jpg" },
      x2: { videoUrl: "/exercises/bench.mp4" },
      x3: { videoUrl: "/exercises/core-01.mp4" },
    });
  });
});