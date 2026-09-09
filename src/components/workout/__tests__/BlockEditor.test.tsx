import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BlockEditor } from "../BlockEditor";
import type { WorkoutBlock } from "@/types";

const BLOCK: WorkoutBlock = {
  id: "block-1",
  type: "amrap",
  durationSeconds: 600,
  exercises: [{ id: "ex-1", name: "Sentadilla" }],
};

describe("BlockEditor catalog toggle", () => {
  it("defaults to the Gimnasio catalog", () => {
    render(<BlockEditor block={BLOCK} index={1} onChange={vi.fn()} onRemove={vi.fn()} />);
    const select = screen.getByLabelText("Ejercicio") as HTMLSelectElement;
    const optionValues = Array.from(select.options).map((option) => option.value);
    expect(optionValues).toContain("Sentadilla");
    expect(optionValues).not.toContain("Back Squat");
  });

  it("switches to the CrossFit catalog when the toggle is clicked", async () => {
    const user = userEvent.setup();
    render(<BlockEditor block={BLOCK} index={1} onChange={vi.fn()} onRemove={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "CrossFit" }));

    const select = screen.getByLabelText("Ejercicio") as HTMLSelectElement;
    const optionValues = Array.from(select.options).map((option) => option.value);
    expect(optionValues).toContain("Back Squat");
    expect(optionValues).not.toContain("Sentadilla");
  });

  it("switches back to the Gimnasio catalog when toggled again", async () => {
    const user = userEvent.setup();
    render(<BlockEditor block={BLOCK} index={1} onChange={vi.fn()} onRemove={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "CrossFit" }));
    await user.click(screen.getByRole("button", { name: "Gimnasio" }));

    const select = screen.getByLabelText("Ejercicio") as HTMLSelectElement;
    const optionValues = Array.from(select.options).map((option) => option.value);
    expect(optionValues).toContain("Sentadilla");
    expect(optionValues).not.toContain("Back Squat");
  });

  it("marks the active catalog button with aria-pressed", async () => {
    const user = userEvent.setup();
    render(<BlockEditor block={BLOCK} index={1} onChange={vi.fn()} onRemove={vi.fn()} />);

    const gymButton = screen.getByRole("button", { name: "Gimnasio" });
    const crossfitButton = screen.getByRole("button", { name: "CrossFit" });
    expect(gymButton).toHaveAttribute("aria-pressed", "true");
    expect(crossfitButton).toHaveAttribute("aria-pressed", "false");

    await user.click(crossfitButton);

    expect(gymButton).toHaveAttribute("aria-pressed", "false");
    expect(crossfitButton).toHaveAttribute("aria-pressed", "true");
  });
});

describe("BlockEditor — index header", () => {
  it("shows the 1-based block position and type in the header", () => {
    render(<BlockEditor block={BLOCK} index={2} onChange={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.getByText("BLOQUE 2 · AMRAP")).toBeInTheDocument();
  });
});

describe("BlockEditor — basic block type", () => {
  const BASIC_BLOCK: WorkoutBlock = {
    id: "block-2",
    type: "basic",
    durationSeconds: 0,
    workSeconds: 30,
    restSeconds: 10,
    rounds: 3,
    repsPerRound: 12,
    // Deliberately empty: ExerciseEditor renders its own "Series" labeled
    // input per exercise row, which collides with the basic block's
    // block-level "Series" field under getByLabelText. These tests only
    // assert on the block-level fields, so an empty exercises array keeps
    // the query unambiguous without touching ExerciseEditor.tsx.
    exercises: [],
  };

  it("renders the 4 basic-specific labeled inputs with their current values", () => {
    render(<BlockEditor block={BASIC_BLOCK} index={1} onChange={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.getByLabelText("Tiempo de ejercicio (seg)")).toHaveValue(30);
    expect(screen.getByLabelText("Tiempo de pausa (seg)")).toHaveValue(10);
    expect(screen.getByLabelText("Series")).toHaveValue(3);
    expect(screen.getByLabelText("Reps por serie")).toHaveValue(12);
  });

  it("calls onChange with the updated field when a basic input changes", () => {
    const onChange = vi.fn();
    render(<BlockEditor block={BASIC_BLOCK} index={1} onChange={onChange} onRemove={vi.fn()} />);

    // Using fireEvent.change (rather than userEvent.clear+type) because this
    // is a static, non-re-rendering controlled input in the test: with no
    // state update between keystrokes, userEvent's character-by-character
    // typing does not actually clear the DOM value first, producing "35"
    // instead of "5". fireEvent.change sets the value in one shot, matching
    // the "changes a single field" intent of this test.
    fireEvent.change(screen.getByLabelText("Series"), { target: { value: "5" } });

    expect(onChange).toHaveBeenLastCalledWith({ ...BASIC_BLOCK, rounds: 5 });
  });

  it("shows the computed total duration, not an editable field", () => {
    render(<BlockEditor block={BASIC_BLOCK} index={1} onChange={vi.fn()} onRemove={vi.fn()} />);
    // (30 + 10) * 3 = 120s = 2m
    expect(screen.getByText(/Tiempo total estimado: 2m/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Duración (segundos)")).not.toBeInTheDocument();
  });

  it("does not show the interval-style work/rest/rounds inputs for a basic block", () => {
    render(<BlockEditor block={BASIC_BLOCK} index={1} onChange={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.queryByLabelText("Segundos de trabajo")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Rondas")).not.toBeInTheDocument();
  });
});
