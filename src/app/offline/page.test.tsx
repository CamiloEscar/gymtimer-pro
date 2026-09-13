import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import OfflinePage from "@/app/offline/page";

describe("app/offline/page", () => {
  it("renders a clear offline message", () => {
    render(<OfflinePage />);
    expect(
      screen.getByRole("heading", { name: /sin conexi[óo]n/i, level: 1 })
    ).toBeInTheDocument();
  });

  it("links back to the home page", () => {
    render(<OfflinePage />);
    const link = screen.getByRole("link", { name: /volver al inicio/i });
    expect(link).toHaveAttribute("href", "/");
  });
});
