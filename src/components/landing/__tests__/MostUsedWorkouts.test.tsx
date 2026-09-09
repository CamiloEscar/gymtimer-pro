import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MostUsedWorkouts } from "../MostUsedWorkouts";
import type { WorkoutHistoryEntry } from "@/types";

const HISTORY_KEY = "gymtimer.history";

function seedHistory(entries: WorkoutHistoryEntry[]) {
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
}

describe("MostUsedWorkouts", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders nothing when history is empty", () => {
    const { container } = render(<MostUsedWorkouts />);
    expect(container).toBeEmptyDOMElement();
  });

  it("groups by workoutId and renders a count badge per workout", async () => {
    const completedAt = new Date().toISOString();
    seedHistory([
      { id: "a", workoutId: "w1", workoutName: "Murph", completedAt, durationMs: 1_000 },
      { id: "b", workoutId: "w1", workoutName: "Murph", completedAt, durationMs: 1_000 },
      { id: "c", workoutId: "w2", workoutName: "Fran", completedAt, durationMs: 1_000 },
      { id: "d", workoutId: "w1", workoutName: "Murph", completedAt, durationMs: 1_000 },
    ]);
    render(<MostUsedWorkouts />);

    expect(await screen.findByText("Murph")).toBeInTheDocument();
    expect(screen.getByText("×3")).toBeInTheDocument();
    expect(screen.getByText("Fran")).toBeInTheDocument();
    expect(screen.getByText("×1")).toBeInTheDocument();
  });
});