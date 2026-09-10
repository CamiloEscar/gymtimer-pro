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
    // A basic block normally has exercises attached; ExerciseEditor renders
    // its own "Series" labeled input per exercise row alongside the block's
    // "Cantidad de series" field. Keeping a real exercise here exercises the
    // scenario where both coexist in the DOM, so a label collision can't
    // silently regress.
    exercises: [{ id: "ex-1", name: "Sentadilla" }],
  };

  it("renders the 4 basic-specific labeled inputs with their current values", () => {
    render(<BlockEditor block={BASIC_BLOCK} index={1} onChange={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.getByLabelText("Tiempo de ejercicio")).toHaveValue("00:00:30");
    expect(screen.getByLabelText("Tiempo de pausa")).toHaveValue("00:00:10");
    expect(screen.getByLabelText("Cantidad de series")).toHaveValue(3);
    expect(screen.getByLabelText("Reps por serie")).toHaveValue(12);
  });

  it("calls onChange with the updated field when a basic input changes", () => {
    const onChange = vi.fn();
    render(<BlockEditor block={BASIC_BLOCK} index={1} onChange={onChange} onRemove={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Cantidad de series"), { target: { value: "5" } });

    expect(onChange).toHaveBeenLastCalledWith({ ...BASIC_BLOCK, rounds: 5 });
  });

  it("shows the computed total duration, not an editable field", () => {
    render(<BlockEditor block={BASIC_BLOCK} index={1} onChange={vi.fn()} onRemove={vi.fn()} />);
    // (30 + 10) * 3 = 120s = 2m
    expect(screen.getByText(/Tiempo total estimado: 2m/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Duración")).not.toBeInTheDocument();
  });

  it("does not show the interval-style work/rest/rounds inputs for a basic block", () => {
    render(<BlockEditor block={BASIC_BLOCK} index={1} onChange={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.queryByLabelText("Segundos de trabajo")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Rondas")).not.toBeInTheDocument();
  });

  it("hides the catalog toggle and + Agregar ejercicio for basic blocks, and shows the explanation", () => {
    render(<BlockEditor block={BASIC_BLOCK} index={1} onChange={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Gimnasio" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "CrossFit" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /\+ Agregar ejercicio/i })).not.toBeInTheDocument();
    expect(
      screen.getByText(/Los bloques básicos no necesitan ejercicios específicos/),
    ).toBeInTheDocument();
  });
});

describe("BlockEditor — exempt block types without exercises", () => {
  function renderExempt(type: "rest" | "countdown" | "countup") {
    const block: WorkoutBlock = {
      id: `block-${type}`,
      type,
      durationSeconds: 60,
      exercises: [],
    };
    render(<BlockEditor block={block} index={1} onChange={vi.fn()} onRemove={vi.fn()} />);
  }

  it("renders a rest block with no catalog, no add button, and the rest hint", () => {
    renderExempt("rest");
    expect(screen.queryByRole("button", { name: "Gimnasio" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "CrossFit" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /\+ Agregar ejercicio/i })).not.toBeInTheDocument();
    expect(screen.getByText(/Solo configurá cuánto dura el descanso/)).toBeInTheDocument();
  });

  it("renders a countdown block with no catalog, no add button, and the countdown hint", () => {
    renderExempt("countdown");
    expect(screen.queryByRole("button", { name: "Gimnasio" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "CrossFit" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /\+ Agregar ejercicio/i })).not.toBeInTheDocument();
    expect(screen.getByText(/Solo configurá cuánto dura el timer/)).toBeInTheDocument();
  });
});

describe("BlockEditor — amrap block with no exercises", () => {
  it("still shows the catalog toggle and add button when exercises list is empty", () => {
    const block: WorkoutBlock = {
      id: "block-amrap-empty",
      type: "amrap",
      durationSeconds: 600,
      exercises: [],
    };
    render(<BlockEditor block={block} index={1} onChange={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Gimnasio" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "CrossFit" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /\+ Agregar ejercicio/i })).toBeInTheDocument();
  });
});

describe("BlockEditor — EMOM/OTM interval cap input + hint", () => {
  function renderCycling(type: "emom" | "otm", intervalSeconds?: number): WorkoutBlock {
    return {
      id: `block-${type}`,
      type,
      durationSeconds: 0,
      workSeconds: 40,
      restSeconds: 0,
      rounds: 3,
      exercises: [{ id: "ex-1", name: "Burpees" }],
      ...(intervalSeconds !== undefined ? { intervalSeconds } : {}),
    };
  }

  it("shows the optional 'Cada cuánto' input next to work/rest/rounds for an EMOM block", () => {
    render(<BlockEditor block={renderCycling("emom")} index={1} onChange={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.getByLabelText("Cada cuánto")).toBeInTheDocument();
    expect(screen.getByLabelText("Segundos de trabajo")).toBeInTheDocument();
    expect(screen.getByLabelText("Segundos de descanso")).toBeInTheDocument();
    expect(screen.getByLabelText("Rondas")).toBeInTheDocument();
  });

  it("shows the optional 'Cada cuánto' input next to work/rest/rounds for an OTM block", () => {
    render(<BlockEditor block={renderCycling("otm")} index={1} onChange={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.getByLabelText("Cada cuánto")).toBeInTheDocument();
    expect(screen.getByLabelText("Segundos de trabajo")).toBeInTheDocument();
    expect(screen.getByLabelText("Segundos de descanso")).toBeInTheDocument();
    expect(screen.getByLabelText("Rondas")).toBeInTheDocument();
  });

  it("uses a native time picker with step=1 (seconds included)", () => {
    render(<BlockEditor block={renderCycling("emom")} index={1} onChange={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.getByLabelText("Cada cuánto")).toHaveAttribute("type", "time");
    expect(screen.getByLabelText("Cada cuánto")).toHaveAttribute("step", "1");
  });

  it("shows the missing-interval hint when EMOM has no intervalSeconds", () => {
    render(<BlockEditor block={renderCycling("emom")} index={1} onChange={vi.fn()} onRemove={vi.fn()} />);
    expect(
      screen.getByText(/Sin "cada cuánto", el bloque corre con work \+ descanso como largo de ronda y termina/),
    ).toBeInTheDocument();
  });

  it("shows the missing-interval hint when OTM has no intervalSeconds", () => {
    render(<BlockEditor block={renderCycling("otm")} index={1} onChange={vi.fn()} onRemove={vi.fn()} />);
    expect(
      screen.getByText(/Sin "cada cuánto", el bloque corre con work \+ descanso como largo de ronda y termina/),
    ).toBeInTheDocument();
  });

  it("hides the hint once intervalSeconds is provided", () => {
    render(
      <BlockEditor
        block={renderCycling("emom", 60)}
        index={1}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    expect(
      screen.queryByText(/Sin "cada cuánto", el bloque corre con work \+ descanso como largo de ronda y termina/),
    ).not.toBeInTheDocument();
    // The Cada cuánto input keeps showing so the trainer can adjust it.
    expect(screen.getByLabelText("Cada cuánto")).toBeInTheDocument();
  });

  it("does NOT show the interval input or hint for non-cycling types (interval/tabata)", () => {
    const intervalBlock: WorkoutBlock = {
      id: "block-interval",
      type: "interval",
      durationSeconds: 0,
      workSeconds: 30,
      restSeconds: 10,
      rounds: 4,
      exercises: [{ id: "ex-1", name: "Row" }],
    };
    render(<BlockEditor block={intervalBlock} index={1} onChange={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.queryByLabelText("Cada cuánto")).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Sin "cada cuánto"/),
    ).not.toBeInTheDocument();
  });

  it("propagates intervalSeconds changes via onChange", () => {
    const onChange = vi.fn();
    render(<BlockEditor block={renderCycling("emom")} index={1} onChange={onChange} onRemove={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Cada cuánto"), { target: { value: "00:01:30" } });

    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ intervalSeconds: 90 }));
  });
});
