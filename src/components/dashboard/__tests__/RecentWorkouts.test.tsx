import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { RecentWorkouts } from "../RecentWorkouts";
import type { Workout } from "@/types";

function makeWorkout(id: string, createdAt: string): Workout {
  return { id, name: `Workout ${id}`, createdAt, favorite: false, blocks: [] };
}

describe("RecentWorkouts", () => {
  it("renders nothing when there are no workouts", () => {
    const { container } = render(
      <RecentWorkouts workouts={[]} onDuplicate={vi.fn()} onDelete={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the 5 most recent workouts as cards, most recent first", () => {
    const workouts = [
      makeWorkout("a", "2026-01-01T00:00:00.000Z"),
      makeWorkout("b", "2026-01-03T00:00:00.000Z"),
      makeWorkout("c", "2026-01-02T00:00:00.000Z"),
    ];
    render(<RecentWorkouts workouts={workouts} onDuplicate={vi.fn()} onDelete={vi.fn()} />);
    const names = screen.getAllByText(/Workout [abc]/).map((el) => el.textContent);
    expect(names).toEqual(["Workout b", "Workout c", "Workout a"]);
  });

  it("calls onDuplicate with the workout id when its duplicate button is clicked", () => {
    const onDuplicate = vi.fn();
    const workouts = [makeWorkout("a", "2026-01-01T00:00:00.000Z")];
    render(<RecentWorkouts workouts={workouts} onDuplicate={onDuplicate} onDelete={vi.fn()} />);
    screen.getByLabelText("Duplicar entrenamiento").click();
    expect(onDuplicate).toHaveBeenCalledWith("a");
  });

  it("calls onDelete with the workout id when its delete button is clicked", () => {
    const onDelete = vi.fn();
    const workouts = [makeWorkout("a", "2026-01-01T00:00:00.000Z")];
    render(<RecentWorkouts workouts={workouts} onDuplicate={vi.fn()} onDelete={onDelete} />);
    screen.getByLabelText("Eliminar entrenamiento").click();
    expect(onDelete).toHaveBeenCalledWith("a");
  });
});
