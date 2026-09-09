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

  it("ignores exercises that match the catalog but have no videoUrl", () => {
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
    expect(result).toEqual({});
  });

  it("resolves videos for multiple exercises across blocks", () => {
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
    expect(result).toEqual({
      x1: { videoUrl: "/exercises/squat.mp4", thumbnailUrl: "/exercises/squat.jpg" },
      x2: { videoUrl: "/exercises/bench.mp4" },
    });
  });
});