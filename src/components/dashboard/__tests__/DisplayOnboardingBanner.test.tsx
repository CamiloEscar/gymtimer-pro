import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DisplayOnboardingBanner } from "../DisplayOnboardingBanner";

describe("DisplayOnboardingBanner", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows the three onboarding steps", () => {
    render(<DisplayOnboardingBanner />);
    expect(screen.getByText("Creá una rutina")).toBeInTheDocument();
    expect(screen.getByText("Tocá Iniciar")).toBeInTheDocument();
    expect(screen.getByText("Abrí el código en el TV")).toBeInTheDocument();
  });

  it("hides on dismiss and persists the dismissal", async () => {
    const user = userEvent.setup();
    render(<DisplayOnboardingBanner />);
    await user.click(screen.getByRole("button", { name: /Cerrar introducción/ }));

    expect(window.localStorage.getItem("gymtimer.onboarding.displayDismissed")).toBe("1");
    expect(screen.queryByText("Tocá Iniciar")).not.toBeInTheDocument();
  });

  it("does not render once previously dismissed", () => {
    window.localStorage.setItem("gymtimer.onboarding.displayDismissed", "1");
    render(<DisplayOnboardingBanner />);
    expect(screen.queryByText("Tocá Iniciar")).not.toBeInTheDocument();
  });
});