import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ExerciseEditor } from "../ExerciseEditor";

const CATALOG = [
  { id: "a", name: "Back Squat", category: "Weightlifting" },
  { id: "b", name: "Pull-up", category: "Gymnastics" },
];

describe("ExerciseEditor", () => {
  it("renders <option>s from the catalog prop, grouped by category", () => {
    render(
      <ExerciseEditor
        exercise={{ id: "ex-1", name: "Back Squat" }}
        catalog={CATALOG}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    const select = screen.getByLabelText("Ejercicio") as HTMLSelectElement;
    const optionValues = Array.from(select.options).map((option) => option.value);
    expect(optionValues).toEqual(["Back Squat", "Pull-up"]);
  });
});
