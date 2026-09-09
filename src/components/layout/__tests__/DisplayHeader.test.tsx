import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DisplayHeader } from "../DisplayHeader";

describe("DisplayHeader", () => {
  it("renders the back button with href=/", () => {
    render(<DisplayHeader />);
    const back = screen.getByRole("link", { name: "← Atrás" });
    expect(back).toHaveAttribute("href", "/");
  });

  it("renders the brand linking to /", () => {
    render(<DisplayHeader />);
    const brand = screen.getByRole("link", { name: "GYMTIMER · Pantalla" });
    expect(brand).toHaveAttribute("href", "/");
  });
});
