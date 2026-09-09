import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DisplaySettings } from "../DisplaySettings";

describe("DisplaySettings", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("defaults to Apagado", () => {
    render(<DisplaySettings />);

    expect(screen.getByRole("button", { name: "Apagado" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByRole("button", { name: "Encendido" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });

  it("switching to Encendido persists the setting", async () => {
    const user = userEvent.setup();
    render(<DisplaySettings />);

    await user.click(screen.getByRole("button", { name: "Encendido" }));

    expect(window.localStorage.getItem("gymtimer.displaySettings")).toBe(
      JSON.stringify({ showVideoOnDisplay: true })
    );
    expect(screen.getByRole("button", { name: "Encendido" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByRole("button", { name: "Apagado" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });
});