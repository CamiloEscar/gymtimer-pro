import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WorkoutTemplates } from "../WorkoutTemplates";
import { CROSSFIT_WOD_TEMPLATES } from "@/lib/workout/crossfitWodTemplates";
import type { Workout } from "@/types";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

function storedWorkouts(): Workout[] {
  return JSON.parse(window.localStorage.getItem("gymtimer.workouts") ?? "[]");
}

describe("WorkoutTemplates", () => {
  beforeEach(() => {
    pushMock.mockClear();
    window.localStorage.clear();
  });

  it("renders all 10 classic templates", () => {
    render(<WorkoutTemplates />);
    for (const template of CROSSFIT_WOD_TEMPLATES) {
      expect(screen.getByText(template.name)).toBeInTheDocument();
    }
    expect(
      screen.getAllByRole("button", { name: "Usar plantilla" }),
    ).toHaveLength(CROSSFIT_WOD_TEMPLATES.length);
  });

  it("clones a template into localStorage and navigates to the saved routine", () => {
    render(<WorkoutTemplates />);
    fireEvent.click(
      screen.getAllByRole("button", { name: "Usar plantilla" })[0],
    );

    const stored = storedWorkouts();
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe("Fran");
    expect(stored[0].id).toBeTruthy();
    expect(stored[0].blocks).toHaveLength(1);
    expect(pushMock).toHaveBeenCalledWith(`/app/workouts/${stored[0].id}`);
  });

  it("propagates the display code to the navigation target", () => {
    render(<WorkoutTemplates code="ABC123" />);
    fireEvent.click(
      screen.getAllByRole("button", { name: "Usar plantilla" })[3],
    );

    const stored = storedWorkouts();
    expect(stored[0].name).toBe("Helen");
    expect(pushMock).toHaveBeenCalledWith(
      `/app/workouts/${stored[0].id}?code=ABC123`,
    );
  });
});
