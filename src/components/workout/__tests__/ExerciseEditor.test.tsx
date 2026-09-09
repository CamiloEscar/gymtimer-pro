import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  it("renders compact by default with a + Detalles expander", () => {
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
    expect(screen.getByRole("button", { name: /\+ Detalles/i })).toBeInTheDocument();
    expect(screen.queryByLabelText("Reps")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Series")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Peso (kg)")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Notas")).not.toBeInTheDocument();
  });

  it("clicking + Detalles reveals reps/sets/weight/notes fields", async () => {
    const user = userEvent.setup();
    render(
      <ExerciseEditor
        exercise={EXERCISE}
        catalog={CATALOG}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: /\+ Detalles/i }));

    expect(screen.getByLabelText("Reps")).toBeInTheDocument();
    expect(screen.getByLabelText("Series")).toBeInTheDocument();
    expect(screen.getByLabelText("Peso (kg)")).toBeInTheDocument();
    expect(screen.getByLabelText("Notas")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Ocultar detalles/i })).toBeInTheDocument();
  });
});
