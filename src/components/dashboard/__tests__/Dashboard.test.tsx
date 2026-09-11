import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Dashboard } from "../Dashboard";
import { LocalWorkoutRepository } from "@/lib/storage/LocalWorkoutRepository";
import { GymProfileRepository } from "@/lib/storage/GymProfileRepository";
import { WorkoutHistoryRepository } from "@/lib/storage/WorkoutHistoryRepository";
import type { Workout } from "@/types";

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

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

  it("asks for confirmation before deleting a recent workout", () => {
    seed("a", "Murph", "2026-01-01T00:00:00.000Z");
    seed("b", "Fran", "2026-01-02T00:00:00.000Z");
    render(<Dashboard />);

    expect(screen.getByText("Murph")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /eliminar entrenamiento/i }));

    // Not deleted yet — confirmation dialog is shown instead.
    expect(screen.getByText("Murph")).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: /¿Eliminar/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));

    expect(screen.queryByText("Murph")).not.toBeInTheDocument();
  });

  it("shows a first-run empty state when there are no workouts at all", () => {
    render(<Dashboard />);

    expect(screen.getByText(/no tenés rutinas todavía/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /crear la primera rutina/i })
    ).toHaveAttribute("href", "/app/workouts/new");
  });

  it("shows today's weekly-plan workout as the workout of the day", () => {
    seed("w-sun", "Domingo WOD", "2026-01-01T00:00:00.000Z");
    seed("w-mon", "Lunes WOD", "2026-01-02T00:00:00.000Z");
    const date = new Date(2026, 0, 4, 10, 0, 0);
    expect(DAY_KEYS[date.getDay()]).toBe("sun");
    new GymProfileRepository().save({
      name: "Box",
      weeklyPlan: { sun: "w-sun", mon: "w-mon" },
    });
    vi.useFakeTimers();
    vi.setSystemTime(date);
    render(<Dashboard />);
    const wodCard = screen.getByText(/Entrenamiento del día/).closest("div")!.parentElement!;
    expect(wodCard).toHaveTextContent("Domingo WOD");
    expect(wodCard).not.toHaveTextContent("Lunes WOD");
    vi.useRealTimers();
  });
});
