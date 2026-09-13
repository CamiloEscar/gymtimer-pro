import { describe, it, expect, beforeEach, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GymSettings } from "../GymSettings";

describe("GymSettings", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("starts empty when nothing is stored", () => {
    render(<GymSettings />);

    expect(screen.getByLabelText("Nombre del gimnasio")).toHaveValue("");
    expect(screen.getByLabelText("Logo URL del gimnasio")).toHaveValue("");
    expect(screen.getByLabelText("Código de enlace fijo del gimnasio")).toHaveValue("");
  });

  it("hydrates from a stored profile including linkCode", () => {
    window.localStorage.setItem(
      "gymtimer.gymProfile",
      JSON.stringify({ name: "Box del Sur", logoUrl: "/logos/box.png", linkCode: "boxsur" })
    );

    render(<GymSettings />);

    expect(screen.getByLabelText("Nombre del gimnasio")).toHaveValue("Box del Sur");
    expect(screen.getByLabelText("Logo URL del gimnasio")).toHaveValue("/logos/box.png");
    expect(screen.getByLabelText("Código de enlace fijo del gimnasio")).toHaveValue("BOXSUR");
  });

  it("saves the field on blur and reports 'Cambios guardados'", async () => {
    const user = userEvent.setup();
    render(<GymSettings />);

    await user.type(screen.getByLabelText("Nombre del gimnasio"), "CrossFit Norte");
    await user.tab();

    expect(window.localStorage.getItem("gymtimer.gymProfile")).toContain("CrossFit Norte");
    expect(screen.getByRole("status")).toHaveTextContent("Cambios guardados");
  });

  it("carries wodWorkoutId and weeklyPlan forward when saving an unrelated edit", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(
      "gymtimer.gymProfile",
      JSON.stringify({ name: "Box del Sur", wodWorkoutId: "w9", weeklyPlan: { mon: "w1" } })
    );
    render(<GymSettings />);

    const nameInput = screen.getByLabelText("Nombre del gimnasio");
    await user.clear(nameInput);
    await user.type(nameInput, "Box Renovado");
    await user.tab();

    expect(JSON.parse(window.localStorage.getItem("gymtimer.gymProfile") ?? "{}")).toEqual(
      expect.objectContaining({
        name: "Box Renovado",
        wodWorkoutId: "w9",
        weeklyPlan: { mon: "w1" },
      })
    );
  });

  it("hides the 'Cambios guardados' status after 2 seconds", () => {
    vi.useFakeTimers();
    try {
      render(<GymSettings />);
      const nameInput = screen.getByLabelText("Nombre del gimnasio");
      fireEvent.change(nameInput, { target: { value: "Box" } });
      fireEvent.blur(nameInput);

      expect(screen.getByRole("status")).toHaveTextContent("Cambios guardados");

      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});