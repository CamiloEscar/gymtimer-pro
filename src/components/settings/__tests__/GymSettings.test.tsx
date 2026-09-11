import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
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
    expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled();
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

  it("saves the profile (including linkCode) to localStorage when Guardar is clicked", async () => {
    const user = userEvent.setup();
    render(<GymSettings />);

    await user.type(screen.getByLabelText("Nombre del gimnasio"), "CrossFit Norte");
    await user.type(screen.getByLabelText("Logo URL del gimnasio"), "/logos/cf.png");
    // Input is capped at 6 chars (the Pusher code alphabet slots), so use
    // a 6-char linkCode here.
    await user.type(
      screen.getByLabelText("Código de enlace fijo del gimnasio"),
      "cfnort"
    );
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(window.localStorage.getItem("gymtimer.gymProfile")).toBe(
      JSON.stringify({
        name: "CrossFit Norte",
        logoUrl: "/logos/cf.png",
        linkCode: "CFNORT",
      })
    );
  });

  it("discards the draft when Descartar is clicked", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(
      "gymtimer.gymProfile",
      JSON.stringify({ name: "Original", linkCode: "ORIG" })
    );
    render(<GymSettings />);

    const nameInput = screen.getByLabelText("Nombre del gimnasio");
    await user.clear(nameInput);
    await user.type(nameInput, "Nuevo nombre");
    expect(nameInput).toHaveValue("Nuevo nombre");

    await user.click(screen.getByRole("button", { name: "Descartar" }));
    expect(nameInput).toHaveValue("Original");
    expect(screen.getByLabelText("Código de enlace fijo del gimnasio")).toHaveValue("ORIG");
  });
});