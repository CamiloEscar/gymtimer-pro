import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ExerciseEditor } from "../ExerciseEditor";

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
