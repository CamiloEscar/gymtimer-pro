import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Dashboard } from "../Dashboard";
import { LocalWorkoutRepository } from "@/lib/storage/LocalWorkoutRepository";
import { WorkoutHistoryRepository } from "@/lib/storage/WorkoutHistoryRepository";
import type { Workout } from "@/types";

function seed(id: string, name: string, createdAt: string) {
  const workout: Workout = { id, name, createdAt, favorite: false, blocks: [] };
  new LocalWorkoutRepository().save(workout);
  return workout;
}

describe("Dashboard", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows the time-aware greeting header", () => {
    render(<Dashboard />);
    expect(screen.getByText(/¿Qué entrenamos hoy\?/i)).toBeInTheDocument();
  });

  it("shows stats derived from recorded history", () => {
    new WorkoutHistoryRepository().record({
      workoutId: "w1",
      workoutName: "Murph",
      completedAt: new Date().toISOString(),
      durationMs: 600_000,
    });
    render(<Dashboard />);
    expect(screen.getByText("1")).toBeInTheDocument(); // sessionsThisWeek
  });

  it("filters recent workouts by the search input", () => {
    seed("a", "Murph", "2026-01-01T00:00:00.000Z");
    seed("b", "Fran", "2026-01-02T00:00:00.000Z");
    render(<Dashboard />);
    expect(screen.getByText("Murph")).toBeInTheDocument();
    expect(screen.getByText("Fran")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/buscar entrenamiento/i), { target: { value: "mur" } });
    expect(screen.getByText("Murph")).toBeInTheDocument();
    expect(screen.queryByText("Fran")).not.toBeInTheDocument();
  });

  it("shows quick action links", () => {
    render(<Dashboard />);
    expect(screen.getByRole("link", { name: /nueva rutina/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /abrir display/i })).toBeInTheDocument();
  });
});
