import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExerciseOverridesSettings } from "../ExerciseOverridesSettings";

describe("ExerciseOverridesSettings", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders the overrides behind an 'Avanzado' details closed by default", () => {
    render(<ExerciseOverridesSettings />);
    expect(screen.getByText(/Avanzado · Overrides de ejercicios/)).toBeInTheDocument();
    expect(document.querySelector("details")).not.toHaveAttribute("open");
  });

  it("shows the empty state 'No hay overrides todavía.'", () => {
    render(<ExerciseOverridesSettings />);
    expect(screen.getByText("No hay overrides todavía.")).toBeInTheDocument();
  });

  it("persists an override: select the first exercise, type a video URL, click Guardar override, and the override appears in the 'Overrides aplicados' list", async () => {
    const user = userEvent.setup();
    render(<ExerciseOverridesSettings />);
    await user.click(screen.getByText(/Avanzado · Overrides de ejercicios/));

    const exerciseSelect = screen.getByLabelText("Ejercicio") as HTMLSelectElement;
    const firstExerciseValue = (exerciseSelect.options[1] as HTMLOptionElement).value;
    await user.selectOptions(exerciseSelect, firstExerciseValue);

    const videoUrl = "https://example.com/demo-video.mp4";
    const videoField = screen.getByLabelText("URL de video");
    await user.clear(videoField);
    await user.type(videoField, videoUrl);
    await user.click(screen.getByRole("button", { name: "Guardar override" }));

    const appliedVideoField = screen.getByText(new RegExp(videoUrl));
    expect(appliedVideoField).toBeInTheDocument();
    expect(appliedVideoField.closest("div")?.textContent).toContain("Sentadilla");
  });

  it("persists a metricKind override on a CrossFit catalog exercise (catalog default shown, override wins)", async () => {
    const user = userEvent.setup();
    render(<ExerciseOverridesSettings />);
    await user.click(screen.getByText(/Avanzado · Overrides de ejercicios/));
    await user.click(screen.getByRole("button", { name: "CrossFit" }));

    const exerciseSelect = screen.getByLabelText("Ejercicio") as HTMLSelectElement;
    await user.selectOptions(exerciseSelect, "cf-mo-01"); // Row, catalog default = calories

    const metricSelect = screen.getByLabelText("Métrica") as HTMLSelectElement;
    // Catalog default prefills the editor (calories on Row).
    expect(metricSelect.value).toBe("calories");
    await user.selectOptions(metricSelect, "reps");

    await user.click(screen.getByRole("button", { name: "Guardar override" }));

    // Override wins: persisted JSON carries metricKind AND the applied list shows it.
    const persisted = JSON.parse(window.localStorage.getItem("gymtimer.exerciseOverrides") ?? "[]");
    expect(persisted).toEqual([
      expect.objectContaining({ exerciseId: "cf-mo-01", metricKind: "reps" }),
    ]);
    expect(screen.getByText("Métrica: Repeticiones")).toBeInTheDocument();
  });

  it("shows an inline URL error instead of a window alert, and clears it on edit", async () => {
    const user = userEvent.setup();
    const alertSpy = vi.spyOn(window, "alert");
    render(<ExerciseOverridesSettings />);
    await user.click(screen.getByText(/Avanzado · Overrides de ejercicios/));

    const exerciseSelect = screen.getByLabelText("Ejercicio") as HTMLSelectElement;
    await user.selectOptions(exerciseSelect, (exerciseSelect.options[1] as HTMLOptionElement).value);

    const videoField = screen.getByLabelText("URL de video");
    await user.clear(videoField);
    await user.type(videoField, "not-a-url");
    await user.click(screen.getByRole("button", { name: "Guardar override" }));

    expect(alertSpy).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(/http\(s\):\/\/ o con \//);
    expect(screen.getByText("No hay overrides todavía.")).toBeInTheDocument();

    await user.type(videoField, "/");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});