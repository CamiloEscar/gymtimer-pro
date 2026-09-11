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

  it("renders every exercise without an overflow row (list is always complete now)", () => {
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
    expect(screen.getByText("Sit-up")).toBeInTheDocument();
    expect(screen.queryByText(/MÁS/)).not.toBeInTheDocument();
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

describe("ExerciseListDisplay notes", () => {
  it("renders exercise notes as a secondary line under the formatted line", () => {
    const block: WorkoutBlock = {
      ...BLOCK,
      type: "amrap",
      exercises: [{ id: "ex-1", name: "Thruster", reps: 21, notes: "chest to bar, kipping only" }],
    };
    render(<ExerciseListDisplay block={block} />);

    const row = screen.getByTestId("exercise-list-item-other");
    expect(row).toHaveTextContent("Thruster · 21reps");
    expect(row).toHaveTextContent("chest to bar, kipping only");
  });

  it("does not render a notes line when an exercise has no notes", () => {
    const { container } = render(<ExerciseListDisplay block={BLOCK} />);
    const row = container.querySelector("[data-testid^='exercise-list-item-']");
    expect(row).not.toBeNull();
    // Exercises without notes only contain the formatted name/reps line — no
    // secondary text-xs notes line (notes-specific truncation would be needed).
    // There's no easy selector so we check no `text-xs` span exists:
    expect(row!.querySelector(".text-xs")).toBeNull();
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
