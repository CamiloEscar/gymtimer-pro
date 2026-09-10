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
    expect(screen.getByLabelText("Video URL del gimnasio")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled();
  });

  it("hydrates from a stored profile", () => {
    window.localStorage.setItem(
      "gymtimer.gymProfile",
      JSON.stringify({ name: "Box del Sur", videoUrl: "/v.mp4" })
    );

    render(<GymSettings />);

    expect(screen.getByLabelText("Nombre del gimnasio")).toHaveValue("Box del Sur");
    expect(screen.getByLabelText("Video URL del gimnasio")).toHaveValue("/v.mp4");
  });

  it("saves the profile to localStorage when Guardar is clicked", async () => {
    const user = userEvent.setup();
    render(<GymSettings />);

    await user.type(screen.getByLabelText("Nombre del gimnasio"), "CrossFit Norte");
    await user.type(screen.getByLabelText("Video URL del gimnasio"), "/videos/cf.mp4");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(window.localStorage.getItem("gymtimer.gymProfile")).toBe(
      JSON.stringify({ name: "CrossFit Norte", videoUrl: "/videos/cf.mp4" })
    );
  });

  it("discards the draft when Descartar is clicked", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(
      "gymtimer.gymProfile",
      JSON.stringify({ name: "Original" })
    );
    render(<GymSettings />);

    const nameInput = screen.getByLabelText("Nombre del gimnasio");
    await user.clear(nameInput);
    await user.type(nameInput, "Nuevo nombre");
    expect(nameInput).toHaveValue("Nuevo nombre");

    await user.click(screen.getByRole("button", { name: "Descartar" }));
    expect(nameInput).toHaveValue("Original");
  });
});