import { describe, it, expect, beforeEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FirstRunChecklist } from "../FirstRunChecklist";
import { GymProfileRepository } from "@/lib/storage/GymProfileRepository";
import { LocalWorkoutRepository } from "@/lib/storage/LocalWorkoutRepository";
import type { Workout } from "@/types";

function seedWorkout(): Workout {
  const workout: Workout = {
    id: "w1",
    name: "Murph",
    createdAt: "2026-01-01T00:00:00.000Z",
    favorite: false,
    blocks: [],
  };
  new LocalWorkoutRepository().save(workout);
  return workout;
}

describe("FirstRunChecklist", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows both pending items when gym profile is empty and no routines exist", () => {
    render(<FirstRunChecklist />);
    expect(screen.getByText(/primeros pasos/i)).toBeInTheDocument();
    const gymLink = screen.getByRole("link", { name: /configurá tu gym/i });
    const routineLink = screen.getByRole("link", { name: /creá tu primera rutina/i });
    expect(gymLink).toHaveAttribute("href", "/app/settings");
    expect(routineLink).toHaveAttribute("href", "/app/workouts/new");
  });

  it("does not render when both items are done", () => {
    new GymProfileRepository().save({ name: "Box del Sur" });
    seedWorkout();
    render(<FirstRunChecklist />);
    expect(screen.queryByText(/primeros pasos/i)).not.toBeInTheDocument();
  });

  it("marks the gym item as done when a name is saved", () => {
    const repo = new GymProfileRepository();
    render(<FirstRunChecklist />);
    const gymLink = screen.getByRole("link", { name: /configurá tu gym/i });
    expect(gymLink).toBeInTheDocument();
    act(() => {
      repo.save({ name: "CrossFit Norte" });
      window.dispatchEvent(new Event("storage"));
    });
    expect(
      screen.queryByRole("link", { name: /configurá tu gym/i })
    ).not.toBeInTheDocument();
    expect(screen.getByText(/configurá tu gym/i)).toBeInTheDocument();
  });

  it("marks the routine item as done when a workout is created", () => {
    render(<FirstRunChecklist />);
    expect(
      screen.getByRole("link", { name: /creá tu primera rutina/i })
    ).toBeInTheDocument();
    act(() => {
      seedWorkout();
      window.dispatchEvent(new Event("storage"));
    });
    expect(
      screen.queryByRole("link", { name: /creá tu primera rutina/i })
    ).not.toBeInTheDocument();
  });

  it("hides on dismiss and persists the dismissal", async () => {
    const user = userEvent.setup();
    render(<FirstRunChecklist />);
    await user.click(
      screen.getByRole("button", { name: /cerrar checklist de primeros pasos/i })
    );
    expect(window.localStorage.getItem("gymtimer.onboarding.checklistDismissed")).toBe("1");
    expect(screen.queryByText(/primeros pasos/i)).not.toBeInTheDocument();
  });

  it("does not render once previously dismissed", () => {
    window.localStorage.setItem("gymtimer.onboarding.checklistDismissed", "1");
    render(<FirstRunChecklist />);
    expect(screen.queryByText(/primeros pasos/i)).not.toBeInTheDocument();
  });
});