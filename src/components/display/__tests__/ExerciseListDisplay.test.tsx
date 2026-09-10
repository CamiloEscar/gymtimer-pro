import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ExerciseListDisplay } from "../ExerciseListDisplay";
import type { WorkoutBlock } from "@/types";

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
  it("renders one row per visible exercise with the table wrapper", () => {
    const { container } = render(<ExerciseListDisplay block={BLOCK} />);

    expect(screen.getByTestId("exercise-list-table")).toBeInTheDocument();
    expect(container.querySelectorAll("[data-testid^='exercise-list-item-']")).toHaveLength(2);
  });

  it("renders the exercise name with reps and sets for each row", () => {
    render(<ExerciseListDisplay block={BLOCK} />);

    expect(screen.getByText("Thruster · 21reps")).toBeInTheDocument();
    expect(screen.getByText("Pull-up · 12reps")).toBeInTheDocument();
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

    expect(screen.getByText("Thruster")).toBeInTheDocument();
    expect(screen.getByText("Burpee")).toBeInTheDocument();
    expect(screen.queryByText("Sit-up")).not.toBeInTheDocument();
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
    expect(screen.getByText("12 REPS POR SERIE")).toBeInTheDocument();
  });

  it("hides the reps-per-round line during the rest phase", () => {
    const block: WorkoutBlock = { ...BLOCK, type: "basic", repsPerRound: 12 };
    render(<ExerciseListDisplay block={block} phase="rest" />);
    expect(screen.queryByText(/REPS POR SERIE/)).not.toBeInTheDocument();
  });

  it("hides the reps-per-round line when repsPerRound is not set", () => {
    render(<ExerciseListDisplay block={BLOCK} phase="work" />);
    expect(screen.queryByText(/REPS POR SERIE/)).not.toBeInTheDocument();
  });

  it("hides the reps-per-round line when phase is omitted (existing call sites unaffected)", () => {
    const block: WorkoutBlock = { ...BLOCK, type: "basic", repsPerRound: 12 };
    render(<ExerciseListDisplay block={block} />);
    expect(screen.queryByText(/REPS POR SERIE/)).not.toBeInTheDocument();
  });
});

describe("ExerciseListDisplay current highlight", () => {
  it("highlights the matching exercise with brand background, bold text and a play icon", () => {
    render(<ExerciseListDisplay block={BLOCK} currentExerciseId="ex-2" />);

    const current = screen.getByTestId("exercise-list-item-current");
    expect(current).toHaveTextContent("Pull-up · 12reps");
    expect(current.className).toContain("bg-brand-500");
    const textSpans = current.querySelectorAll("span");
    const textSpan = textSpans[textSpans.length - 1];
    expect(textSpan.className).toContain("font-bold");
    expect(current.querySelector("svg")).not.toBeNull();
    const others = screen.getAllByTestId("exercise-list-item-other");
    expect(others).toHaveLength(1);
    expect(others[0].className).toContain("text-phosphor-dim");
    expect(others[0].querySelector("svg")).toBeNull();
  });

  it("does not mark anything as current when currentExerciseId is undefined", () => {
    render(<ExerciseListDisplay block={BLOCK} />);

    expect(screen.queryByTestId("exercise-list-item-current")).not.toBeInTheDocument();
    expect(screen.getAllByTestId("exercise-list-item-other")).toHaveLength(2);
  });

  it("does not mark anything as current when currentExerciseId does not match any visible exercise", () => {
    render(<ExerciseListDisplay block={BLOCK} currentExerciseId="unknown" />);

    expect(screen.queryByTestId("exercise-list-item-current")).not.toBeInTheDocument();
    expect(screen.getAllByTestId("exercise-list-item-other")).toHaveLength(2);
  });
});
