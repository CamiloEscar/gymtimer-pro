import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
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

describe("BlockEditor — time input widget per field", () => {
  it("uses the bar for the AMRAP Duración with a tap-to-edit readout", () => {
    render(<BlockEditor block={BLOCK} index={1} onChange={vi.fn()} onRemove={vi.fn()} />);
    const slider = screen.getByRole("slider", { name: "Duración (barra)" }) as HTMLInputElement;
    expect(slider.type).toBe("range");
    expect(slider.value).toBe("600");
    expect(screen.getByRole("button", { name: "Duración: 10:00" })).toBeInTheDocument();
  });

  it("opens the minutes/seconds inputs when the FGB Estación readout is tapped", async () => {
    const fgb: WorkoutBlock = {
      id: "b-fgb",
      type: "fightGoneBad",
      durationSeconds: 600,
      rounds: 3,
      stationSeconds: 60,
      roundRestSeconds: 60,
      exercises: [{ id: "e1", name: "Wall Ball" }],
    };
    const user = userEvent.setup();
    render(<BlockEditor block={fgb} index={1} onChange={vi.fn()} onRemove={vi.fn()} />);
    // Both Estación and Descanso render the bar + an editable readout carrying
    // the current seconds. Tap the number to edit it inline.
    expect(screen.getByRole("slider", { name: "Segundos por estación (barra)" })).toHaveValue("60");
    const readout = screen.getByRole("button", { name: "Segundos por estación: 1:00" });
    expect(readout).toBeInTheDocument();

    await user.click(readout);
    expect(screen.getByLabelText("Segundos por estación minutos")).toHaveValue(1);
    expect(screen.getByLabelText("Segundos por estación segundos")).toHaveValue(0);
  });

  it("editing the Pausa number keeps the bar in sync (same seconds source)", () => {
    const basic: WorkoutBlock = {
      id: "b-basic",
      type: "basic",
      durationSeconds: 0,
      workSeconds: 30,
      restSeconds: 15,
      rounds: 4,
      repsPerRound: 12,
      exercises: [{ id: "e1", name: "Sentadilla" }],
    };
    render(<BlockEditor block={basic} index={1} onChange={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.getByRole("slider", { name: "Tiempo de ejercicio (barra)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tiempo de pausa: 0:15" })).toBeInTheDocument();
  });
});

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

describe("BlockEditor — switching to rest clears stale rounds", () => {
  it("strips rounds off a block when the trainer retypes it to 'rest'", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    // Interval block with rounds=4 — switching to rest should drop the rounds
    // field so the engine doesn't carry dead data and hasTimingChanges()
    // comparisons stay clean.
    const intervalBlock: WorkoutBlock = {
      id: "block-rest",
      type: "interval",
      durationSeconds: 0,
      workSeconds: 30,
      restSeconds: 10,
      rounds: 4,
      exercises: [],
    };
    render(<BlockEditor block={intervalBlock} index={1} onChange={onChange} onRemove={vi.fn()} />);

    await user.selectOptions(screen.getByLabelText("Tipo de bloque"), "rest");

    expect(onChange).toHaveBeenLastCalledWith({
      ...intervalBlock,
      type: "rest",
      rounds: undefined,
    });
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

  it("renders the basic-specific inputs with their current values", () => {
    render(<BlockEditor block={BASIC_BLOCK} index={1} onChange={vi.fn()} onRemove={vi.fn()} />);
    // Ejercicio and Pausa both use the bar + tappable number readout; the
    // readout carries the current seconds value.
    expect(screen.getByRole("slider", { name: "Tiempo de ejercicio (barra)" })).toHaveValue("30");
    expect(screen.getByRole("button", { name: "Tiempo de pausa: 0:10" })).toBeInTheDocument();
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

  it("uses a plain seconds number field (iOS time pickers ignore seconds)", () => {
    render(<BlockEditor block={renderCycling("emom")} index={1} onChange={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.getByLabelText("Cada cuánto")).toHaveAttribute("type", "number");
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
    function Wrapper() {
      const [block, setBlock] = useState(renderCycling("emom"));
      return <BlockEditor block={block} index={1} onChange={setBlock} onRemove={vi.fn()} />;
    }
    render(<Wrapper />);

    fireEvent.change(screen.getByLabelText("Cada cuánto"), { target: { value: "90" } });

    expect(screen.getByLabelText("Cada cuánto")).toHaveValue(90);
  });
});

describe("BlockEditor — repScheme (Escalera) per-exercise", () => {
  const LADDER_BLOCK: WorkoutBlock = {
    id: "block-ladder",
    type: "amrap",
    durationSeconds: 600,
    exercises: [
      {
        id: "ex-1",
        name: "Thrusters",
        repScheme: { start: 21, step: -6, min: 9 },
      },
    ],
  };

  it("renders the three steppers with current values and the live preview on a ladder-capable type", () => {
    render(<BlockEditor block={LADDER_BLOCK} index={1} onChange={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.getByText("Escalera (por ronda)")).toBeInTheDocument();
    expect(screen.getByLabelText("Inicio de la escalera")).toHaveValue(21);
    expect(screen.getByLabelText("Paso de la escalera")).toHaveValue(-6);
    expect(screen.getByLabelText("Mínimo de la escalera")).toHaveValue(9);
    // First rungs of {21, -6, 9} → 21 → 15 → 9, floored at the minimum.
    expect(screen.getByText("21 → 15 → 9 (mínimo 9)")).toBeInTheDocument();
  });

  it("shows the escalera row on every allowed block type", () => {
    for (const type of ["amrap", "forTime", "emom", "otm"] as const) {
      const { unmount } = render(
        <BlockEditor
          block={{ ...LADDER_BLOCK, id: `block-${type}`, type }}
          index={1}
          onChange={vi.fn()}
          onRemove={vi.fn()}
        />,
      );
      expect(screen.getByText("Escalera (por ronda)")).toBeInTheDocument();
      unmount();
    }
  });

  it("hides the escalera row for non-ladder block types", () => {
    const block: WorkoutBlock = {
      id: "block-interval",
      type: "interval",
      durationSeconds: 0,
      workSeconds: 30,
      restSeconds: 10,
      rounds: 4,
      exercises: [{ id: "ex-1", name: "Row" }],
    };
    render(<BlockEditor block={block} index={1} onChange={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.queryByText("Escalera (por ronda)")).not.toBeInTheDocument();
  });

  it("persists stepper edits into the exercise's repScheme via onChange", async () => {
    const user = userEvent.setup();
    const blockWithoutScheme: WorkoutBlock = {
      ...LADDER_BLOCK,
      exercises: [{ id: "ex-1", name: "Thrusters" }],
    };
    function Wrapper() {
      const [block, setBlock] = useState<WorkoutBlock>(blockWithoutScheme);
      return <BlockEditor block={block} index={1} onChange={setBlock} onRemove={vi.fn()} />;
    }
    render(<Wrapper />);

    await user.clear(screen.getByLabelText("Inicio de la escalera"));
    await user.type(screen.getByLabelText("Inicio de la escalera"), "21");

    // Stateful round-trip: the keystrokes landed on the exercise's repScheme
    // and re-rendered the controlled input at 21.
    expect(screen.getByLabelText("Inicio de la escalera")).toHaveValue(21);
    expect(screen.getByLabelText("Paso de la escalera")).toHaveValue(0);
    expect(screen.getByLabelText("Mínimo de la escalera")).toHaveValue(0);
  });

  it("strips repSchemes from every exercise when the block type changes to a non-ladder type", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<BlockEditor block={LADDER_BLOCK} index={1} onChange={onChange} onRemove={vi.fn()} />);

    await user.selectOptions(screen.getByLabelText("Tipo de bloque"), "interval");

    expect(onChange).toHaveBeenLastCalledWith({
      ...LADDER_BLOCK,
      type: "interval",
      exercises: [{ id: "ex-1", name: "Thrusters", repScheme: undefined }],
    });
  });
});

describe("BlockEditor — forTime rounds", () => {
  it("shows a Rondas input for forTime blocks and persists it", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const block: WorkoutBlock = {
      id: "block-ft",
      type: "forTime",
      durationSeconds: 600,
      exercises: [{ id: "ex-1", name: "Thrusters" }],
    };
    render(<BlockEditor block={block} index={1} onChange={onChange} onRemove={vi.fn()} />);

    await user.clear(screen.getByLabelText("Rondas"));
    await user.type(screen.getByLabelText("Rondas"), "3");

    expect(onChange).toHaveBeenLastCalledWith({ ...block, rounds: 3 });
  });

  it("does not show a Rondas input for amrap blocks", () => {
    render(<BlockEditor block={BLOCK} index={1} onChange={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.queryByLabelText("Rondas")).not.toBeInTheDocument();
  });
});
