import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ExerciseBanner } from "../ExerciseBanner";
import type { WorkoutBlock } from "@/types";

function amrapBlock(exercises: WorkoutBlock["exercises"]): WorkoutBlock {
  return { id: "b1", type: "amrap", durationSeconds: 600, exercises };
}

describe("ExerciseBanner", () => {
  const base = {
    currentRound: 1,
    currentExerciseIndex: 0,
    status: "running" as const,
    phase: "work" as const,
  };

  it("hides for rest blocks", () => {
    const block: WorkoutBlock = {
      id: "b1",
      type: "rest",
      durationSeconds: 60,
      exercises: [{ id: "e1", name: "Push-up" }],
    };
    const { container } = render(<ExerciseBanner {...base} block={block} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows the first exercise as a preview when ready", () => {
    render(
      <ExerciseBanner
        {...base}
        status="ready"
        block={amrapBlock([{ id: "e1", name: "Push-up" }])}
      />,
    );
    expect(screen.getByText(/Vas a empezar/)).toBeInTheDocument();
    expect(screen.getByText("Push-up")).toBeInTheDocument();
  });

  it("shows the round-derived current exercise while running", () => {
    render(
      <ExerciseBanner
        {...base}
        currentRound={2}
        block={amrapBlock([
          { id: "e1", name: "Push-up" },
          { id: "e2", name: "Air squat" },
        ])}
      />,
    );
    expect(screen.getByText("Air squat")).toBeInTheDocument();
  });

  it("uses the engine index for fightGoneBad instead of the round math", () => {
    render(
      <ExerciseBanner
        {...base}
        currentExerciseIndex={1}
        block={{
          id: "b1",
          type: "fightGoneBad",
          durationSeconds: 0,
          stationSeconds: 60,
          rounds: 3,
          exercises: [
            { id: "e1", name: "Clean" },
            { id: "e2", name: "Jerk" },
          ],
        }}
      />,
    );
    expect(screen.getByText("Jerk")).toBeInTheDocument();
  });

  it("shows SIGUIENTE when the block has more than one exercise", () => {
    render(
      <ExerciseBanner
        {...base}
        block={amrapBlock([
          { id: "e1", name: "Deadlift" },
          { id: "e2", name: "Box jump" },
        ])}
      />,
    );
    expect(screen.getByText("Deadlift")).toBeInTheDocument();
    expect(screen.getByText(/SIGUIENTE:/)).toBeInTheDocument();
    expect(screen.getByText("Box jump")).toBeInTheDocument();
  });
});