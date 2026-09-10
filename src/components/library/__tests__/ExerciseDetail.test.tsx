import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExerciseDetail } from "../ExerciseDetail";
import type { CatalogExercise } from "@/lib/workout/exerciseCatalog";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: pushMock }) }));
vi.mock("@/components/ui/VideoPlayer", () => ({
  VideoPlayer: ({ alt }: { alt: string }) => <div data-testid="exercise-video">{alt}</div>,
}));

const EXERCISE: CatalogExercise = {
  id: "leg-01",
  name: "Sentadilla",
  category: "Piernas",
  description: "Desc",
};

describe("ExerciseDetail", () => {
  beforeEach(() => {
    window.localStorage.clear();
    pushMock.mockClear();
  });

  it("renders name, category, and description", () => {
    render(<ExerciseDetail exercise={EXERCISE} />);
    expect(screen.getByRole("heading", { name: "Sentadilla" })).toBeInTheDocument();
    expect(screen.getByText("Piernas")).toBeInTheDocument();
    expect(screen.getByText("Desc")).toBeInTheDocument();
  });

  it("does not render the video when the exercise has no videoUrl", () => {
    render(<ExerciseDetail exercise={EXERCISE} />);
    expect(screen.queryByTestId("exercise-video")).not.toBeInTheDocument();
  });

  it("renders the video when the exercise has videoUrl", () => {
    render(<ExerciseDetail exercise={{ ...EXERCISE, videoUrl: "/exercises/squat.mp4" }} />);
    expect(screen.getByTestId("exercise-video")).toBeInTheDocument();
  });

  it("quick start saves a workout and navigates to the editor", async () => {
    const user = userEvent.setup();
    render(<ExerciseDetail exercise={EXERCISE} />);
    await user.click(screen.getByRole("button", { name: /Arrancar con este ejercicio/ }));
    expect(pushMock).toHaveBeenCalledWith(expect.stringMatching(/^\/app\/workouts\/[^/]+$/));
    const raw = window.localStorage.getItem("gymtimer.workouts");
    const saved = JSON.parse(raw ?? "[]");
    expect(saved[0].blocks[0].type).toBe("interval");
    expect(saved[0].blocks[0].exercises[0].name).toBe("Sentadilla");
    expect(saved[0].blocks[0].exercises[0].reps).toBe(12);
  });
});