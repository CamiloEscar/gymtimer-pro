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

describe("ExerciseBanner — repScheme ladder rounds", () => {
  const running = {
    currentRound: 1,
    currentExerciseIndex: 0,
    status: "running" as const,
    phase: "work" as const,
  };
  const ladderBlock = (): WorkoutBlock => ({
    id: "b1",
    type: "amrap",
    durationSeconds: 600,
    rounds: 1,
    repScheme: { start: 21, step: -6, min: 9 },
    exercises: [
      { id: "e1", name: "Thrusters" },
      { id: "e2", name: "Pull-ups" },
    ],
  });

  it('renders "RONDA 2 ·" with the round-scaled cadencia on a ladder block', () => {
    render(<ExerciseBanner {...running} currentRound={2} block={ladderBlock()} />);
    // Round 2 of {21, -6, 9} → 15 reps; the round-derived current exercise
    // (index (2-1)%2) is Pull-ups.
    expect(screen.getByText(/RONDA 2/)).toBeInTheDocument();
    expect(screen.getByText(/Pull-ups · 15reps/)).toBeInTheDocument();
  });

  it("shows the first rung on round 1", () => {
    render(<ExerciseBanner {...running} currentRound={1} block={ladderBlock()} />);
    expect(screen.getByText(/RONDA 1/)).toBeInTheDocument();
    expect(screen.getByText(/Thrusters · 21reps/)).toBeInTheDocument();
  });

  it("does not render a RONDA prefix for blocks without a repScheme", () => {
    render(
      <ExerciseBanner
        {...running}
        currentRound={2}
        block={{
          id: "b1",
          type: "amrap",
          durationSeconds: 600,
          exercises: [{ id: "e1", name: "Push-ups", reps: 20 }],
        }}
      />,
    );
    expect(screen.queryByText(/RONDA/)).not.toBeInTheDocument();
    expect(screen.getByText(/Push-ups · 20reps/)).toBeInTheDocument();
  });
});