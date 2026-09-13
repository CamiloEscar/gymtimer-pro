import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { ActiveRunFloater } from "../ActiveRunFloater";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

function mockPathname(pathname: string) {
  vi.mocked(usePathname).mockReturnValue(pathname);
}

describe("ActiveRunFloater", () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockPathname("/app/settings");
  });

  it("renders nothing without an active session", () => {
    render(<ActiveRunFloater />);
    expect(screen.queryByRole("link", { name: "Entrenamiento activo" })).not.toBeInTheDocument();
  });

  it("renders nothing when the workout has no run link (no workoutId)", () => {
    window.localStorage.setItem("gymtimer.activeSession", JSON.stringify({ code: "ABC123" }));
    render(<ActiveRunFloater />);
    expect(screen.queryByRole("link", { name: "Entrenamiento activo" })).not.toBeInTheDocument();
  });

  it("links to the active workout run page", () => {
    window.localStorage.setItem(
      "gymtimer.activeSession",
      JSON.stringify({ workoutId: "w1", code: "ABC123" })
    );
    render(<ActiveRunFloater />);
    const link = screen.getByRole("link", { name: "Entrenamiento activo" });
    expect(link).toHaveAttribute("href", "/app/workouts/w1/run");
  });

  it("hides on the run page itself", () => {
    window.localStorage.setItem(
      "gymtimer.activeSession",
      JSON.stringify({ workoutId: "w1", code: "ABC123" })
    );
    mockPathname("/app/workouts/w1/run");
    render(<ActiveRunFloater />);
    expect(screen.queryByRole("link", { name: "Entrenamiento activo" })).not.toBeInTheDocument();
  });
});