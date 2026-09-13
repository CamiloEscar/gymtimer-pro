import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WeeklyPlanSettings } from "../WeeklyPlanSettings";
import { LocalWorkoutRepository } from "@/lib/storage/LocalWorkoutRepository";
import type { Workout } from "@/types";

function seedWorkouts() {
  const repo = new LocalWorkoutRepository();
  const workouts: Workout[] = [
    {
      id: "w1",
      name: "Murph",
      createdAt: "2026-01-01T00:00:00.000Z",
      favorite: false,
      blocks: [],
    },
    {
      id: "w2",
      name: "Fran",
      createdAt: "2026-01-01T00:00:00.000Z",
      favorite: false,
      blocks: [],
    },
  ];
  workouts.forEach((w) => repo.save(w));
}

describe("WeeklyPlanSettings", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders one select per day, unassigned by default", () => {
    render(<WeeklyPlanSettings />);

    expect(screen.getByLabelText("Rutina para Lunes")).toHaveValue("");
    expect(screen.getByLabelText("Rutina para Domingo")).toHaveValue("");
  });

  it("hydrates from the stored weeklyPlan", () => {
    seedWorkouts();
    window.localStorage.setItem(
      "gymtimer.gymProfile",
      JSON.stringify({ name: "Box", weeklyPlan: { mon: "w1" } })
    );

    render(<WeeklyPlanSettings />);

    expect(screen.getByLabelText("Rutina para Lunes")).toHaveValue("w1");
  });

  it("autosaves the assignment as soon as a day changes", async () => {
    const user = userEvent.setup();
    seedWorkouts();
    render(<WeeklyPlanSettings />);

    await user.selectOptions(screen.getByLabelText("Rutina para Lunes"), "w1");

    expect(JSON.parse(window.localStorage.getItem("gymtimer.gymProfile") ?? "{}")).toEqual(
      expect.objectContaining({ weeklyPlan: { mon: "w1" } })
    );
  });

  it("carries wodWorkoutId forward when changing the plan", async () => {
    const user = userEvent.setup();
    seedWorkouts();
    window.localStorage.setItem(
      "gymtimer.gymProfile",
      JSON.stringify({ name: "Box", wodWorkoutId: "w2" })
    );

    render(<WeeklyPlanSettings />);
    await user.selectOptions(screen.getByLabelText("Rutina para Lunes"), "w1");

    const stored = JSON.parse(window.localStorage.getItem("gymtimer.gymProfile") ?? "{}");
    expect(stored.weeklyPlan).toEqual({ mon: "w1" });
    expect(stored.wodWorkoutId).toBe("w2");
  });
});