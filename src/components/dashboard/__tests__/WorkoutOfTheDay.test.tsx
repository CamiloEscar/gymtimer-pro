import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { WorkoutOfTheDay } from "../WorkoutOfTheDay";
import type { Workout } from "@/types";

describe("WorkoutOfTheDay", () => {
  it("shows a create-workout prompt when there is none", () => {
    render(<WorkoutOfTheDay workout={null} />);
    expect(screen.getByText(/todavía no hay entrenamiento/i)).toBeInTheDocument();
  });

  it("shows the block count and estimated duration for the workout of the day", () => {
    const workout: Workout = {
      id: "w1",
      name: "Murph",
      createdAt: "2026-01-01T00:00:00.000Z",
      favorite: false,
      blocks: [
        { id: "b1", type: "amrap", durationSeconds: 600, exercises: [{ id: "e1", name: "Pull-up" }] },
        { id: "b2", type: "rest", durationSeconds: 60, exercises: [] },
      ],
    };
    render(<WorkoutOfTheDay workout={workout} />);
    expect(screen.getByText("Murph")).toBeInTheDocument();
    expect(screen.getByText(/2 bloques/i)).toBeInTheDocument();
    // (600 + 60)s = 660s = 11m
    expect(screen.getByText(/11m/)).toBeInTheDocument();
  });
});
