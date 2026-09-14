import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HistoryList } from "../HistoryList";
import { WorkoutHistoryRepository } from "@/lib/storage/WorkoutHistoryRepository";
import { LocalWorkoutRepository } from "@/lib/storage/LocalWorkoutRepository";
import type { Workout } from "@/types";

const NOW = new Date("2026-09-13T12:00:00.000Z");
const ONE_HOUR_AGO = new Date(NOW.getTime() - 60 * 60 * 1000).toISOString();
const TWO_DAYS_AGO = new Date(NOW.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();

function seedWorkout(id: string, name: string): Workout {
  const workout: Workout = {
    id,
    name,
    createdAt: "2026-01-01T00:00:00.000Z",
    favorite: false,
    blocks: [],
  };
  new LocalWorkoutRepository().save(workout);
  return workout;
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("HistoryList empty state", () => {
  it("shows the empty hint when no history exists", () => {
    render(<HistoryList />);
    expect(screen.getByText(/sin historial todavía/i)).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });
});

describe("HistoryList with entries", () => {
  beforeEach(() => {
    seedWorkout("w1", "Murph");
    seedWorkout("w2", "Fran");
    new WorkoutHistoryRepository().record({
      workoutId: "w1",
      workoutName: "Murph",
      completedAt: ONE_HOUR_AGO,
      durationMs: 32 * 60 * 1000,
    });
    new WorkoutHistoryRepository().record({
      workoutId: "w2",
      workoutName: "Fran",
      completedAt: TWO_DAYS_AGO,
      durationMs: 5 * 60 * 1000,
      reps: 21,
    });
  });

  it("renders entries newest-first with workout name and duration", () => {
    render(<HistoryList />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("Murph");
    expect(items[0]).toHaveTextContent("32m 0s");
    expect(items[1]).toHaveTextContent("Fran");
    expect(items[1]).toHaveTextContent("5m 0s");
  });

  it("shows reps when present", () => {
    render(<HistoryList />);
    expect(screen.getByText("21 reps")).toBeInTheDocument();
  });

  it("includes an accessible time element with the ISO datetime", () => {
    render(<HistoryList />);
    const times = screen.getAllByRole("time");
    expect(times.length).toBeGreaterThanOrEqual(1);
    for (const t of times) {
      expect(t.getAttribute("datetime")).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    }
  });

  it("offers a filter with all workouts and counts", async () => {
    const user = userEvent.setup();
    render(<HistoryList />);
    const select = screen.getByRole("combobox", { name: /filtrar historial por rutina/i });
    expect(select).toBeInTheDocument();
    const options = Array.from((select as HTMLSelectElement).options).map((o) => o.text);
    expect(options[0]).toMatch(/todas \(2\)/i);
    expect(options.some((o) => o?.includes("Murph"))).toBe(true);
    expect(options.some((o) => o?.includes("Fran"))).toBe(true);

    await user.selectOptions(select, "w2");
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(1);
    expect(items[0]).toHaveTextContent("Fran");
  });

  it("formats short durations as seconds only", () => {
    seedWorkout("w3", "Sprint");
    new WorkoutHistoryRepository().record({
      workoutId: "w3",
      workoutName: "Sprint",
      completedAt: new Date(NOW.getTime() - 30 * 1000).toISOString(),
      durationMs: 45 * 1000,
    });
    render(<HistoryList />);
    expect(screen.getByText("45s")).toBeInTheDocument();
  });

  it("formats multi-hour durations as hours and minutes", () => {
    seedWorkout("w4", "Endurance");
    new WorkoutHistoryRepository().record({
      workoutId: "w4",
      workoutName: "Endurance",
      completedAt: new Date(NOW.getTime() - 5 * 1000).toISOString(),
      durationMs: (2 * 60 + 15) * 60 * 1000,
    });
    render(<HistoryList />);
    expect(screen.getByText("2h 15m")).toBeInTheDocument();
  });

  it("hides orphan workouts (deleted) from the filter but keeps their entries visible", async () => {
    seedWorkout("w5", "Deleteme");
    new WorkoutHistoryRepository().record({
      workoutId: "w5",
      workoutName: "Deleteme",
      completedAt: ONE_HOUR_AGO,
      durationMs: 10 * 60 * 1000,
    });
    new LocalWorkoutRepository().delete("w5");

    render(<HistoryList />);
    const select = screen.getByRole("combobox", { name: /filtrar historial por rutina/i });
    const options = Array.from((select as HTMLSelectElement).options).map((o) => o.text);
    expect(options).toHaveLength(3);
    expect(options[0]).toMatch(/todas \(3\)/i);
    expect(options.some((o) => o?.includes("Deleteme"))).toBe(false);
    expect(options.some((o) => o?.includes("Murph"))).toBe(true);
    expect(options.some((o) => o?.includes("Fran"))).toBe(true);

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(screen.getByText("Deleteme")).toBeInTheDocument();
  });
});