import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import LandingPage from "../page";

vi.mock("@/components/ui/VideoPlayer", () => ({
  VideoPlayer: () => <div data-testid="landing-video" />,
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("LandingPage", () => {
  it("renders the informative landing sections", () => {
    render(<LandingPage />);

    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1.textContent).toMatch(/TIMER/);
    expect(screen.getByRole("heading", { name: "Cómo funciona" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Modos de entrenamiento" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /un display que aguanta el ritmo/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /llevá tu box a la siguiente ronda/i })).toBeInTheDocument();
  });

  it("links to the section anchors from the navbar", () => {
    render(<LandingPage />);
    expect(screen.getByRole("link", { name: "Modos" })).toHaveAttribute("href", "#modos");
    expect(screen.getByRole("link", { name: "Cómo funciona" })).toHaveAttribute(
      "href",
      "#como-funciona"
    );
    expect(document.querySelector("#modos")).not.toBeNull();
    expect(document.querySelector("#como-funciona")).not.toBeNull();
  });

  it("shows the array of supported workout modes", () => {
    render(<LandingPage />);
    for (const mode of ["EMOM", "TABATA", "FOR TIME"]) {
      expect(screen.getAllByText(mode).length).toBeGreaterThan(0);
    }
  });
});