import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExerciseOverridesSettings } from "../ExerciseOverridesSettings";

describe("ExerciseOverridesSettings", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders the overrides section heading", () => {
    render(<ExerciseOverridesSettings />);
    expect(screen.getByRole("heading", { name: "Overrides de ejercicios" })).toBeInTheDocument();
  });

  it("shows the empty state 'No hay overrides todavía.'", () => {
    render(<ExerciseOverridesSettings />);
    expect(screen.getByText("No hay overrides todavía.")).toBeInTheDocument();
  });

  it("persists an override: select the first exercise, type a video URL, click Guardar override, and the override appears in the 'Overrides aplicados' list", async () => {
    const user = userEvent.setup();
    render(<ExerciseOverridesSettings />);

    const exerciseSelect = screen.getByLabelText("Ejercicio") as HTMLSelectElement;
    const firstExerciseValue = (exerciseSelect.options[1] as HTMLOptionElement).value;
    await user.selectOptions(exerciseSelect, firstExerciseValue);

    const videoUrl = "https://example.com/demo-video.mp4";
    await user.type(screen.getByLabelText("URL de video"), videoUrl);
    await user.click(screen.getByRole("button", { name: "Guardar override" }));

    const videoField = screen.getByText(new RegExp(videoUrl));
    expect(videoField).toBeInTheDocument();
    expect(videoField.closest("div")?.textContent).toContain("Sentadilla");
  });
});