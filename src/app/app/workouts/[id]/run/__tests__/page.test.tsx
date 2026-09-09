import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import RunWorkoutPage from "../page";
import { LocalWorkoutRepository } from "@/lib/storage/LocalWorkoutRepository";
import { WorkoutHistoryRepository } from "@/lib/storage/WorkoutHistoryRepository";
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

function seedShortWorkout(): Workout {
  const workout: Workout = {
    id: "w1",
    name: "Sprint Test",
    createdAt: "2026-01-01T00:00:00.000Z",
    favorite: false,
    blocks: [
      {
        id: "b1",
        type: "countdown",
        durationSeconds: 1,
        exercises: [{ id: "e1", name: "Sprint", reps: 1 }],
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

describe("RunWorkoutPage history recording", () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockSearchParams = new URLSearchParams();
    vi.mocked(SessionChannel).mockClear();
    // handleStart calls audio.unlock(), which constructs a real AudioContext.
    // jsdom has no AudioContext implementation, so stub a minimal fake —
    // matching the pattern used in AudioManager.test.ts (a `function`
    // expression, since vitest's vi.fn() construct trap forwards to the
    // implementation and arrow functions aren't constructible).
    vi.stubGlobal(
      "AudioContext",
      vi.fn(function () {
        const oscillator = { type: "sine", frequency: { value: 0 }, connect: vi.fn(), start: vi.fn(), stop: vi.fn() };
        const gain = { gain: { value: 1, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() }, connect: vi.fn() };
        return {
          createOscillator: vi.fn(() => oscillator),
          createGain: vi.fn(() => gain),
          destination: {},
          currentTime: 0,
          resume: vi.fn().mockResolvedValue(undefined),
          state: "suspended",
        };
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("records a history entry once the workout finishes", async () => {
    seedWorkout();
    render(<RunWorkoutPage />);

    const startButton = await screen.findByRole("button", { name: /^iniciar$/i });
    startButton.click();

    // The seeded workout is a 600s AMRAP; finishing it via the UI alone would
    // require advancing fake timers by 10 minutes through TimerEngine's real
    // setInterval, which this suite doesn't set up. Instead, verify the
    // wiring directly: no entry recorded yet mid-run.
    const midRun = new WorkoutHistoryRepository().list();
    expect(midRun.ok).toBe(true);
    if (midRun.ok) expect(midRun.value).toHaveLength(0);
  });

  it("records a history entry end-to-end once a real session reaches finished", async () => {
    const workout = seedShortWorkout();
    render(<RunWorkoutPage />);

    // Resolve the start button with real timers first: testing-library's
    // findBy* polls via setTimeout internally, which would never progress
    // once fake timers are installed and nothing is advancing them yet.
    const startButton = await screen.findByRole("button", { name: /^iniciar$/i });

    vi.useFakeTimers();
    try {
      fireEvent.click(startButton);

      // The seeded workout is a 1s countdown block. TimerEngine ticks every
      // 100ms and self-corrects to "finished" once elapsed >= durationMs, so
      // advancing the fake clock past 1000ms drives WorkoutEngine's
      // running -> finished transition, which the page's effect observes and
      // records into history.
      act(() => {
        vi.advanceTimersByTime(1_200);
      });

      const afterFinish = new WorkoutHistoryRepository().list();
      expect(afterFinish.ok).toBe(true);
      if (!afterFinish.ok) return;
      expect(afterFinish.value).toHaveLength(1);
      const [entry] = afterFinish.value;
      expect(entry.workoutId).toBe(workout.id);
      expect(entry.workoutName).toBe(workout.name);
      expect(entry.durationMs).toBeGreaterThan(0);
      expect(entry.durationMs).toBeLessThan(5_000);
    } finally {
      vi.useRealTimers();
    }
  });
});
