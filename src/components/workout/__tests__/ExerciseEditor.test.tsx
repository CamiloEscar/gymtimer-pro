import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExerciseEditor } from "../ExerciseEditor";
import type { CatalogExercise } from "@/lib/workout/exerciseCatalog";
import type { Exercise } from "@/types";

const CATALOG = [
  { id: "a", name: "Back Squat", category: "Weightlifting" },
  { id: "b", name: "Pull-up", category: "Gymnastics" },
];

const EXERCISE = { id: "ex-1", name: "Back Squat" };

describe("ExerciseEditor", () => {
  it("renders <option>s from the catalog prop, grouped by category", () => {
    render(
      <ExerciseEditor
        exercise={EXERCISE}
        catalog={CATALOG}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    const select = screen.getByLabelText("Ejercicio") as HTMLSelectElement;
    const optionValues = Array.from(select.options).map((option) => option.value);
    expect(optionValues).toEqual(["Back Squat", "Pull-up"]);
  });

  it("shows all four fields by default in a 2-column grid", () => {
    render(
      <ExerciseEditor
        exercise={EXERCISE}
        catalog={CATALOG}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    expect(screen.getByLabelText("Ejercicio")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Quitar ejercicio" })).toBeInTheDocument();
    expect(screen.getByLabelText("Reps")).toBeInTheDocument();
    expect(screen.getByLabelText("Series")).toBeInTheDocument();
    expect(screen.getByLabelText("Peso (kg)")).toBeInTheDocument();
    expect(screen.getByLabelText("Notas")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /\+ Detalles/i })).not.toBeInTheDocument();
  });
});

describe("ExerciseEditor — widget-fit per metricKind", () => {
  const renderEditor = (exercise: Exercise) =>
    render(
      <ExerciseEditor exercise={exercise} catalog={CATALOG} onChange={vi.fn()} onRemove={vi.fn()} />
    );

  it("defaults to a numeric Reps input when no metricKind is set", () => {
    renderEditor({ id: "ex-1", name: "Thruster" });
    expect(screen.getByLabelText("Reps")).toHaveAttribute("type", "number");
  });

  it("shows a numeric of the right unit for distanceMeters", () => {
    renderEditor({ id: "ex-1", name: "Run", metricKind: "distanceMeters", distanceMeters: 400 });
    const input = screen.getByLabelText("Distancia (m)") as HTMLInputElement;
    expect(input.type).toBe("number");
    expect(input.value).toBe("400");
  });

  it("shows a numeric for calories", () => {
    renderEditor({ id: "ex-1", name: "Row", metricKind: "calories", calories: 50 });
    const input = screen.getByLabelText("Calorías") as HTMLInputElement;
    expect(input.value).toBe("50");
  });

  it("swaps to the TimeInput slider for timeSeconds (fixture S3: L-Sit 30s)", () => {
    renderEditor({ id: "ex-1", name: "L-Sit", metricKind: "timeSeconds", timeSeconds: 30 });
    const slider = screen.getByRole("slider", { name: "Tiempo del ejercicio (barra)" }) as HTMLInputElement;
    expect(slider.type).toBe("range");
    expect(slider.value).toBe("30");
  });

  it("shows the windowKind toggle for a timeSeconds exercise", () => {
    renderEditor({ id: "ex-1", name: "L-Sit", metricKind: "timeSeconds", timeSeconds: 30 });
    expect(screen.getByRole("button", { name: "Cuenta regresiva" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Cuenta progresiva" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("renders a MÁXIMO badge and no amount numeric for max", () => {
    renderEditor({ id: "ex-1", name: "Clean", metricKind: "max" });
    expect(screen.getByText("MÁXIMO")).toBeInTheDocument();
    expect(screen.queryByLabelText("Reps")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Distancia (m)")).not.toBeInTheDocument();
  });

  it("prefills the metric kind from the catalog when a catalog entry is selected", async () => {
    const user = userEvent.setup();
    const catalog: CatalogExercise[] = [
      { id: "lsit", name: "L-Sit", category: "Gymnastics", metricKind: "timeSeconds" },
      { id: "row", name: "Row", category: "Monostructural/Cardio", metricKind: "calories" },
    ];
    const onChange = vi.fn();
    render(
      <ExerciseEditor exercise={{ id: "ex-1", name: "Thruster" }} catalog={catalog} onChange={onChange} onRemove={vi.fn()} />
    );

    await user.selectOptions(screen.getByLabelText("Ejercicio"), "L-Sit");
    expect(onChange).toHaveBeenLastCalledWith({
      id: "ex-1",
      name: "L-Sit",
      metricKind: "timeSeconds",
    });

    await user.selectOptions(screen.getByLabelText("Ejercicio"), "Row");
    expect(onChange).toHaveBeenLastCalledWith({
      id: "ex-1",
      name: "Row",
      metricKind: "calories",
    });
  });

  it("clears the metric override when the picked catalog entry has no default", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ExerciseEditor
        exercise={{ id: "ex-1", name: "Row", metricKind: "calories", calories: 50 }}
        catalog={CATALOG}
        onChange={onChange}
        onRemove={vi.fn()}
      />
    );

    await user.selectOptions(screen.getByLabelText("Ejercicio"), "Back Squat");
    expect(onChange).toHaveBeenLastCalledWith({
      id: "ex-1",
      name: "Back Squat",
      metricKind: undefined,
      calories: 50,
    });
  });
});
