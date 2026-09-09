import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { AppHeader } from "../AppHeader";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

function mockPathname(pathname: string) {
  vi.mocked(usePathname).mockReturnValue(pathname);
}

describe("AppHeader", () => {
  it("renders the brand linking to /app", () => {
    mockPathname("/app");
    render(<AppHeader />);
    const brand = screen.getByRole("link", { name: "GYMTIMER" });
    expect(brand).toHaveAttribute("href", "/app");
  });

  it("renders the three section links with correct hrefs", () => {
    mockPathname("/app");
    render(<AppHeader />);
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("href", "/app");
    expect(screen.getByRole("link", { name: "Rutinas" })).toHaveAttribute("href", "/app/workouts");
    expect(screen.getByRole("link", { name: "Pantalla" })).toHaveAttribute("href", "/display");
  });

  it("does not render the back button on /app", () => {
    mockPathname("/app");
    render(<AppHeader />);
    expect(screen.queryByRole("link", { name: "← Atrás" })).not.toBeInTheDocument();
  });

  it("does not render the back button on /app/workouts", () => {
    mockPathname("/app/workouts");
    render(<AppHeader />);
    expect(screen.queryByRole("link", { name: "← Atrás" })).not.toBeInTheDocument();
  });

  it("renders the back button on /app/workouts/new pointing to /app/workouts", () => {
    mockPathname("/app/workouts/new");
    render(<AppHeader />);
    const back = screen.getByRole("link", { name: "← Atrás" });
    expect(back).toHaveAttribute("href", "/app/workouts");
  });

  it("renders the back button on /app/workouts/w1 pointing to /app/workouts", () => {
    mockPathname("/app/workouts/w1");
    render(<AppHeader />);
    const back = screen.getByRole("link", { name: "← Atrás" });
    expect(back).toHaveAttribute("href", "/app/workouts");
  });

  it("renders the back button on /app/workouts/w1/run pointing to /app/workouts/w1", () => {
    mockPathname("/app/workouts/w1/run");
    render(<AppHeader />);
    const back = screen.getByRole("link", { name: "← Atrás" });
    expect(back).toHaveAttribute("href", "/app/workouts/w1");
  });

  it("highlights the Rutinas section link on /app/workouts", () => {
    mockPathname("/app/workouts");
    render(<AppHeader />);
    expect(screen.getByRole("link", { name: "Rutinas" })).toHaveClass("text-brand-500");
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveClass("text-gray-400");
  });

  it("highlights the Dashboard section link on /app", () => {
    mockPathname("/app");
    render(<AppHeader />);
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveClass("text-brand-500");
    expect(screen.getByRole("link", { name: "Rutinas" })).toHaveClass("text-gray-400");
  });

  it("keeps Rutinas highlighted on nested workout routes", () => {
    mockPathname("/app/workouts/w1/run");
    render(<AppHeader />);
    expect(screen.getByRole("link", { name: "Rutinas" })).toHaveClass("text-brand-500");
  });
});

describe("AppHeader — responsive layout", () => {
  it("uses mobile-first responsive classes on the brand link", () => {
    mockPathname("/app");
    render(<AppHeader />);
    const brand = screen.getByRole("link", { name: "GYMTIMER" });
    expect(brand.className).toMatch(/text-sm/);
    expect(brand.className).toMatch(/md:text-base/);
  });

  it("uses mobile-first responsive classes on the section links", () => {
    mockPathname("/app/workouts");
    render(<AppHeader />);
    const ul = screen.getByRole("list");
    expect(ul.className).toMatch(/text-xs/);
    expect(ul.className).toMatch(/md:text-sm/);
    expect(ul.className).toMatch(/gap-2/);
    expect(ul.className).toMatch(/md:gap-4/);
  });

  it("allows the nav to wrap on narrow viewports", () => {
    mockPathname("/app/workouts/w1");
    render(<AppHeader />);
    const nav = screen.getByRole("navigation");
    expect(nav.className).toMatch(/flex-wrap/);
  });
});
