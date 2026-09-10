import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DisplayHeader } from "../DisplayHeader";

describe("DisplayHeader", () => {
  it("renders a floating back button with href=/app/workouts", () => {
    render(<DisplayHeader />);
    const back = screen.getByRole("link", { name: "Atrás" });
    expect(back).toHaveAttribute("href", "/app/workouts");
    expect(back).toHaveClass("fixed");
  });

  it("does not render the brand link", () => {
    render(<DisplayHeader />);
    expect(screen.queryByRole("link", { name: "GYMTIMER · Pantalla" })).not.toBeInTheDocument();
  });
});
