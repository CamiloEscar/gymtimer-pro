import { describe, it, expect, beforeEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WeeklyPlanOnboardingBanner } from "../WeeklyPlanOnboardingBanner";
import { LocalWorkoutRepository } from "@/lib/storage/LocalWorkoutRepository";
import { GymProfileRepository } from "@/lib/storage/GymProfileRepository";
import type { Workout } from "@/types";

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

describe("WeeklyPlanOnboardingBanner", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("does not render when there are no workouts", () => {
    render(<WeeklyPlanOnboardingBanner />);
    expect(screen.queryByText(/asigná tu plan semanal/i)).not.toBeInTheDocument();
  });

  it("shows the hint when workouts exist but no day is assigned", () => {
    seedWorkout("w1", "Murph");
    render(<WeeklyPlanOnboardingBanner />);
    expect(screen.getByText(/asigná tu plan semanal/i)).toBeInTheDocument();
    expect(
      screen.getByText(/elegí qué rutina corre cada día/i)
    ).toBeInTheDocument();
  });

  it("does not render once any day is assigned", () => {
    seedWorkout("w1", "Murph");
    new GymProfileRepository().save({
      name: "Box del Sur",
      weeklyPlan: { mon: "w1" },
    });
    render(<WeeklyPlanOnboardingBanner />);
    expect(screen.queryByText(/asigná tu plan semanal/i)).not.toBeInTheDocument();
  });

  it("hides on dismiss and persists the dismissal", async () => {
    seedWorkout("w1", "Murph");
    const user = userEvent.setup();
    render(<WeeklyPlanOnboardingBanner />);
    await user.click(
      screen.getByRole("button", { name: /cerrar sugerencia de plan semanal/i })
    );
    expect(
      window.localStorage.getItem("gymtimer.onboarding.weeklyPlanDismissed")
    ).toBe("1");
    expect(screen.queryByText(/asigná tu plan semanal/i)).not.toBeInTheDocument();
  });

  it("auto-hides when a day is assigned after mount", async () => {
    seedWorkout("w1", "Murph");
    const repo = new GymProfileRepository();
    render(<WeeklyPlanOnboardingBanner />);
    expect(screen.getByText(/asigná tu plan semanal/i)).toBeInTheDocument();
    await act(async () => {
      repo.save({ name: "Box", weeklyPlan: { wed: "w1" } });
      window.dispatchEvent(new Event("storage"));
    });
    expect(screen.queryByText(/asigná tu plan semanal/i)).not.toBeInTheDocument();
  });
});