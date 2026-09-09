import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ExerciseListDisplay } from "../ExerciseListDisplay";
import type { WorkoutBlock, WorkoutPhase } from "@/types";

const BLOCK: WorkoutBlock = {
  id: "block-1",
  type: "amrap",
  durationSeconds: 600,
  exercises: [
    { id: "ex-1", name: "Thruster", reps: 21 },
    { id: "ex-2", name: "Pull-up", reps: 12 },
  ],
};

describe("ExerciseListDisplay numbering", () => {
  it("prepends the 1-based order number to each visible exercise line", () => {
    render(<ExerciseListDisplay block={BLOCK} />);

    expect(screen.getByText("1) Thruster · 21reps")).toBeInTheDocument();
    expect(screen.getByText("2) Pull-up · 12reps")).toBeInTheDocument();
  });

  it("numbers up to the max visible exercises without renumbering the overflow", () => {
    const block: WorkoutBlock = {
      ...BLOCK,
      exercises: [
        { id: "ex-1", name: "Thruster" },
        { id: "ex-2", name: "Pull-up" },
        { id: "ex-3", name: "Row" },
        { id: "ex-4", name: "Burpee" },
        { id: "ex-5", name: "Sit-up" },
      ],
    };
    render(<ExerciseListDisplay block={block} />);

    expect(screen.getByText("1) Thruster")).toBeInTheDocument();
    expect(screen.getByText("4) Burpee")).toBeInTheDocument();
    expect(screen.queryByText(/5\)/)).not.toBeInTheDocument();
    expect(screen.getByText("[ +1 MÁS ]")).toBeInTheDocument();
  });

  it("returns null for rest blocks", () => {
    const restBlock: WorkoutBlock = { ...BLOCK, type: "rest", exercises: [] };
    const { container } = render(<ExerciseListDisplay block={restBlock} />);
    expect(container.firstChild).toBeNull();
  });
});

describe("ExerciseListDisplay reps line", () => {
  it("shows the reps-per-round line during the work phase when repsPerRound is set", () => {
    const block: WorkoutBlock = { ...BLOCK, type: "basic", repsPerRound: 12 };
    render(<ExerciseListDisplay block={block} phase="work" />);
    expect(screen.getByText("💪 12 REPS")).toBeInTheDocument();
  });

  it("hides the reps-per-round line during the rest phase", () => {
    const block: WorkoutBlock = { ...BLOCK, type: "basic", repsPerRound: 12 };
    render(<ExerciseListDisplay block={block} phase="rest" />);
    expect(screen.queryByText(/REPS/)).not.toBeInTheDocument();
  });

  it("hides the reps-per-round line when repsPerRound is not set", () => {
    render(<ExerciseListDisplay block={BLOCK} phase="work" />);
    expect(screen.queryByText(/REPS/)).not.toBeInTheDocument();
  });

  it("hides the reps-per-round line when phase is omitted (existing call sites unaffected)", () => {
    const block: WorkoutBlock = { ...BLOCK, type: "basic", repsPerRound: 12 };
    render(<ExerciseListDisplay block={block} />);
    expect(screen.queryByText(/REPS/)).not.toBeInTheDocument();
  });
});
