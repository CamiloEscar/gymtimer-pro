import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
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
    render(<BlockEditor block={BLOCK} onChange={vi.fn()} onRemove={vi.fn()} />);
    const select = screen.getByLabelText("Ejercicio") as HTMLSelectElement;
    const optionValues = Array.from(select.options).map((option) => option.value);
    expect(optionValues).toContain("Sentadilla");
    expect(optionValues).not.toContain("Back Squat");
  });

  it("switches to the CrossFit catalog when the toggle is clicked", async () => {
    const user = userEvent.setup();
    render(<BlockEditor block={BLOCK} onChange={vi.fn()} onRemove={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "CrossFit" }));

    const select = screen.getByLabelText("Ejercicio") as HTMLSelectElement;
    const optionValues = Array.from(select.options).map((option) => option.value);
    expect(optionValues).toContain("Back Squat");
    expect(optionValues).not.toContain("Sentadilla");
  });
});
