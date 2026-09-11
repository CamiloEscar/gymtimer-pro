import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { QuickActions } from "../QuickActions";

describe("QuickActions", () => {
  it("always shows links to create a routine, open the Display, and configure", () => {
    render(<QuickActions />);
    expect(screen.getByRole("link", { name: /nueva rutina/i })).toHaveAttribute("href", "/app/workouts/new");
    expect(screen.getByRole("link", { name: /abrir display/i })).toHaveAttribute("href", "/display");
    expect(screen.getByRole("link", { name: /configuración/i })).toHaveAttribute("href", "/app/settings");
  });
});
