import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { RecentWorkouts } from "../RecentWorkouts";
import type { WorkoutHistoryEntry } from "@/types";

const HISTORY_KEY = "gymtimer.history";

function seedHistory(entries: WorkoutHistoryEntry[]) {
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
}

describe("RecentWorkouts", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders nothing when history is empty", () => {
    const { container } = render(<RecentWorkouts />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the most recent workouts with a relative time after mount", async () => {
    const now = Date.now();
    seedHistory([
      {
        id: "a",
        workoutId: "w1",
        workoutName: "Murph",
        completedAt: new Date(now - 3 * 86_400_000).toISOString(),
        durationMs: 1_000,
      },
      {
        id: "b",
        workoutId: "w2",
        workoutName: "Fran",
        completedAt: new Date(now - 60_000).toISOString(),
        durationMs: 2_000,
      },
      {
        id: "c",
        workoutId: "w3",
        workoutName: "Helen",
        completedAt: new Date(now - 5 * 86_400_000).toISOString(),
        durationMs: 3_000,
      },
    ]);
    render(<RecentWorkouts />);

    expect(await screen.findByText("Fran")).toBeInTheDocument();
    expect(screen.getByText("Murph")).toBeInTheDocument();
    expect(screen.getByText("Helen")).toBeInTheDocument();
    expect(screen.getByText("hace 3 días")).toBeInTheDocument();
  });
});