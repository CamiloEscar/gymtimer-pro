import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import WorkoutsPage from "../page";
import { LocalWorkoutRepository } from "@/lib/storage/LocalWorkoutRepository";
import type { Workout } from "@/types";

function seedWorkout(): Workout {
  const workout: Workout = {
    id: "w1",
    name: "Murph",
    createdAt: "2026-01-01T00:00:00.000Z",
    favorite: false,
    blocks: [{ id: "b1", type: "amrap", durationSeconds: 600, exercises: [{ id: "e1", name: "Pull-up", reps: 10 }] }],
  };
  new LocalWorkoutRepository().save(workout);
  return workout;
}

describe("WorkoutsPage code propagation", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows no connecting banner and plain links without a code", async () => {
    seedWorkout();
    const ui = await WorkoutsPage({ searchParams: Promise.resolve({}) });
    render(ui);
    expect(screen.queryByText(/CONECTANDO A PANTALLA/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "▶ Iniciar" })).toHaveAttribute(
      "href",
      "/app/workouts/w1/run"
    );
    expect(screen.getByRole("link", { name: "+ Nuevo entrenamiento" })).toHaveAttribute(
      "href",
      "/app/workouts/new"
    );
  });

  it("shows a connecting banner and propagates the code to run and new-workout links", async () => {
    seedWorkout();
    const ui = await WorkoutsPage({ searchParams: Promise.resolve({ code: "ABC123" }) });
    render(ui);
    expect(screen.getByText(/CONECTANDO A PANTALLA: ABC123/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "▶ Iniciar" })).toHaveAttribute(
      "href",
      "/app/workouts/w1/run?code=ABC123"
    );
    expect(screen.getByRole("link", { name: "+ Nuevo entrenamiento" })).toHaveAttribute(
      "href",
      "/app/workouts/new?code=ABC123"
    );
  });
});
