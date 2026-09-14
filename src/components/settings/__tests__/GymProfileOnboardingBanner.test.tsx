import { describe, it, expect, beforeEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GymProfileOnboardingBanner } from "../GymProfileOnboardingBanner";
import { GymProfileRepository } from "@/lib/storage/GymProfileRepository";

describe("GymProfileOnboardingBanner", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows the onboarding hint when no gym profile is stored", () => {
    render(<GymProfileOnboardingBanner />);
    expect(screen.getByText(/configurá tu gimnasio/i)).toBeInTheDocument();
    expect(screen.getByText(/la pantalla del tv/i)).toBeInTheDocument();
  });

  it("does not render when the gym profile already has a name", () => {
    new GymProfileRepository().save({ name: "Box del Sur" });
    render(<GymProfileOnboardingBanner />);
    expect(screen.queryByText(/configurá tu gimnasio/i)).not.toBeInTheDocument();
  });

  it("hides on dismiss and persists the dismissal", async () => {
    const user = userEvent.setup();
    render(<GymProfileOnboardingBanner />);
    await user.click(screen.getByRole("button", { name: /cerrar sugerencia de perfil/i }));
    expect(window.localStorage.getItem("gymtimer.onboarding.gymProfileDismissed")).toBe("1");
    expect(screen.queryByText(/configurá tu gimnasio/i)).not.toBeInTheDocument();
  });

  it("does not render once previously dismissed even if profile is still empty", () => {
    window.localStorage.setItem("gymtimer.onboarding.gymProfileDismissed", "1");
    render(<GymProfileOnboardingBanner />);
    expect(screen.queryByText(/configurá tu gimnasio/i)).not.toBeInTheDocument();
  });

  it("auto-hides when the gym profile name is saved after mount", async () => {
    const repo = new GymProfileRepository();
    render(<GymProfileOnboardingBanner />);
    expect(screen.getByText(/configurá tu gimnasio/i)).toBeInTheDocument();
    await act(async () => {
      repo.save({ name: "CrossFit Norte" });
      window.dispatchEvent(new Event("storage"));
    });
    expect(screen.queryByText(/configurá tu gimnasio/i)).not.toBeInTheDocument();
  });
});