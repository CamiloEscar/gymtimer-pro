import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WorkoutBuilder } from "../WorkoutBuilder";
import type { Workout } from "@/types";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

function validWorkout(): Workout {
  return {
    id: "w1",
    name: "Murph",
    createdAt: "2026-01-01T00:00:00.000Z",
    favorite: false,
    blocks: [
      {
        id: "b1",
        type: "amrap",
        durationSeconds: 600,
        exercises: [{ id: "e1", name: "Pull-up", reps: 10 }],
      },
    ],
  };
}

describe("WorkoutBuilder save redirect", () => {
  beforeEach(() => {
    pushMock.mockClear();
    window.localStorage.clear();
  });

  it("redirects to the workouts list when saved without a code", () => {
    render(<WorkoutBuilder initialWorkout={validWorkout()} />);
    fireEvent.click(screen.getByRole("button", { name: "Guardar entrenamiento" }));
    expect(pushMock).toHaveBeenCalledWith("/app/workouts");
  });

  it("redirects straight to the run page with the code when saved with a code", () => {
    render(<WorkoutBuilder initialWorkout={validWorkout()} code="ABC123" />);
    fireEvent.click(screen.getByRole("button", { name: "Guardar entrenamiento" }));
    expect(pushMock).toHaveBeenCalledWith("/app/workouts/w1/run?code=ABC123");
  });
});
