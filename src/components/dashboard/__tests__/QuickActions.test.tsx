import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { QuickActions } from "../QuickActions";
import type { Workout } from "@/types";

const workout: Workout = {
  id: "w1",
  name: "Murph",
  createdAt: "2026-01-01T00:00:00.000Z",
  favorite: false,
  blocks: [],
};

describe("QuickActions", () => {
  it("always shows links to create a routine and open the Display", () => {
    render(<QuickActions workoutOfTheDay={null} />);
    expect(screen.getByRole("link", { name: /nueva rutina/i })).toHaveAttribute("href", "/app/workouts/new");
    expect(screen.getByRole("link", { name: /abrir display/i })).toHaveAttribute("href", "/display");
  });

  it("does not show a 'continue' link when there is no workout of the day", () => {
    render(<QuickActions workoutOfTheDay={null} />);
    expect(screen.queryByRole("link", { name: /continuar/i })).not.toBeInTheDocument();
  });

  it("shows a 'continue' link to the workout of the day when present", () => {
    render(<QuickActions workoutOfTheDay={workout} />);
    const link = screen.getByRole("link", { name: /continuar murph/i });
    expect(link).toHaveAttribute("href", "/app/workouts/w1/run");
  });
});
