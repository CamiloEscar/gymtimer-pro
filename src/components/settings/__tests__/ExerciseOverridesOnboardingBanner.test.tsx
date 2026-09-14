import { describe, it, expect, beforeEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExerciseOverridesOnboardingBanner } from "../ExerciseOverridesOnboardingBanner";
import { UserExerciseOverrideRepository } from "@/lib/storage/UserExerciseOverrideRepository";

describe("ExerciseOverridesOnboardingBanner", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows the hint when no overrides exist", () => {
    render(<ExerciseOverridesOnboardingBanner />);
    expect(screen.getByText(/overrides de ejercicios/i)).toBeInTheDocument();
    expect(screen.getByText(/podés overrideear el catálogo/i)).toBeInTheDocument();
  });

  it("does not render once any override is saved", () => {
    new UserExerciseOverrideRepository().save({
      exerciseId: "e1",
      name: "Pull-up estricto",
    });
    render(<ExerciseOverridesOnboardingBanner />);
    expect(screen.queryByText(/overrides de ejercicios/i)).not.toBeInTheDocument();
  });

  it("hides on dismiss and persists the dismissal", async () => {
    const user = userEvent.setup();
    render(<ExerciseOverridesOnboardingBanner />);
    await user.click(
      screen.getByRole("button", { name: /cerrar sugerencia de overrides/i })
    );
    expect(
      window.localStorage.getItem("gymtimer.onboarding.exerciseOverridesDismissed")
    ).toBe("1");
    expect(screen.queryByText(/overrides de ejercicios/i)).not.toBeInTheDocument();
  });

  it("does not render once previously dismissed", () => {
    window.localStorage.setItem("gymtimer.onboarding.exerciseOverridesDismissed", "1");
    render(<ExerciseOverridesOnboardingBanner />);
    expect(screen.queryByText(/overrides de ejercicios/i)).not.toBeInTheDocument();
  });

  it("auto-hides when an override is saved after mount", async () => {
    const repo = new UserExerciseOverrideRepository();
    render(<ExerciseOverridesOnboardingBanner />);
    expect(screen.getByText(/overrides de ejercicios/i)).toBeInTheDocument();
    await act(async () => {
      repo.save({ exerciseId: "e1", name: "Custom" });
      window.dispatchEvent(new Event("storage"));
    });
    expect(screen.queryByText(/overrides de ejercicios/i)).not.toBeInTheDocument();
  });
});