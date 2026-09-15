import { describe, it, expect } from "vitest";
import { deriveCurrentExercise } from "../deriveCurrentExercise";
import type { WorkoutBlock } from "@/types";

const STATIONS = [
  { id: "e1", name: "Run" },
  { id: "e2", name: "Row" },
  { id: "e3", name: "L-Sit" },
];

function chipper(): WorkoutBlock {
  return {
    id: "chipper",
    type: "forTime",
    durationSeconds: 0,
    rounds: 1,
    exercises: STATIONS,
  };
}

const RUN: Parameters<typeof deriveCurrentExercise>[0] = {
  block: chipper(),
  currentRound: 1,
  currentExerciseIndex: 0,
  status: "running",
  phase: "work",
};

describe("deriveCurrentExercise — chipper lane", () => {
  it("tracks the engine station index for a chipper (ignores the round)", () => {
    const { current, next } = deriveCurrentExercise({
      ...RUN,
      currentExerciseIndex: 2,
    });
    expect(current).toEqual(STATIONS[2]);
    expect(next).toEqual(STATIONS[0]);
  });

  it("clamps a stale index to the last station", () => {
    const { current } = deriveCurrentExercise({
      ...RUN,
      currentRound: 3,
      currentExerciseIndex: 99,
    });
    expect(current).toEqual(STATIONS[2]);
  });

  it("rotates by round for a multi-exercise forTime that is NOT a chipper (rounds-for-time)", () => {
    const block: WorkoutBlock = { ...chipper(), rounds: 3 };
    const { current } = deriveCurrentExercise({ ...RUN, block, currentRound: 2, currentExerciseIndex: 0 });
    expect(current).toEqual(STATIONS[1]);
  });

  it("keeps the FGB station-index behavior", () => {
    const block: WorkoutBlock = {
      id: "fgb",
      type: "fightGoneBad",
      durationSeconds: 0,
      stationSeconds: 60,
      exercises: STATIONS,
    };
    const { current } = deriveCurrentExercise({
      ...RUN,
      block,
      currentExerciseIndex: 1,
    });
    expect(current).toEqual(STATIONS[1]);
  });
});