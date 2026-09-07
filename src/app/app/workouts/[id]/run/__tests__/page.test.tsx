import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import RunWorkoutPage from "../page";
import { LocalWorkoutRepository } from "@/lib/storage/LocalWorkoutRepository";
import { SessionChannel } from "@/lib/session/SessionChannel";
import type { Workout } from "@/types";

let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "w1" }),
  useSearchParams: () => mockSearchParams,
}));

vi.mock("@/lib/session/SessionChannel", () => ({
  SessionChannel: vi.fn().mockImplementation(function () {
    return {
      sendState: vi.fn(),
      destroy: vi.fn(),
    };
  }),
}));

vi.mock("@/lib/session/generateCode", () => ({
  generateCode: () => "NEWCOD",
}));

function seedWorkout(): Workout {
  const workout: Workout = {
    id: "w1",
    name: "Murph",
    createdAt: "2026-01-01T00:00:00.000Z",
    favorite: false,
    blocks: [
      {
        id: "b1",
        type: "amrap",
        durationSeconds: 600,
        exercises: [{ id: "e1", name: "Pull-up", reps: 10 }],
      },
    ],
  };
  new LocalWorkoutRepository().save(workout);
  return workout;
}

describe("RunWorkoutPage session code", () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockSearchParams = new URLSearchParams();
    vi.mocked(SessionChannel).mockClear();
  });

  it("uses the code from the URL when present", async () => {
    seedWorkout();
    mockSearchParams = new URLSearchParams({ code: "ABC123" });
    render(<RunWorkoutPage />);
    await screen.findByText(/ABC123/);
    expect(SessionChannel).toHaveBeenCalledWith("ABC123", "trainer");
  });

  it("generates a new code when the URL has none", async () => {
    seedWorkout();
    render(<RunWorkoutPage />);
    await screen.findByText(/NEWCOD/);
    expect(SessionChannel).toHaveBeenCalledWith("NEWCOD", "trainer");
  });
});
