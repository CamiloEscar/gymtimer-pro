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

function openTemplates() {
  fireEvent.click(screen.getByText("Clásicos de CrossFit"));
}

describe("WorkoutTemplates", () => {
  beforeEach(() => {
    pushMock.mockClear();
    window.localStorage.clear();
  });

  it("is collapsed by default so the trainer's own routines stay on top", () => {
    render(<WorkoutTemplates />);
    const details = screen.getByText("Clásicos de CrossFit").closest("details");
    expect(details?.open).toBe(false);
    expect(
      screen.getByText(`${CROSSFIT_WOD_TEMPLATES.length} plantillas`),
    ).toBeInTheDocument();
  });

  it("expands on tap and renders all 10 classic templates", () => {
    render(<WorkoutTemplates />);
    openTemplates();
    const details = screen.getByText("Clásicos de CrossFit").closest("details");
    expect(details?.open).toBe(true);
    for (const template of CROSSFIT_WOD_TEMPLATES) {
      expect(screen.getByText(template.name)).toBeInTheDocument();
    }
    expect(
      screen.getAllByRole("button", { name: "Usar plantilla" }),
    ).toHaveLength(CROSSFIT_WOD_TEMPLATES.length);
  });

  it("clones a template into localStorage and navigates to the saved routine", () => {
    render(<WorkoutTemplates />);
    openTemplates();
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
    openTemplates();
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
