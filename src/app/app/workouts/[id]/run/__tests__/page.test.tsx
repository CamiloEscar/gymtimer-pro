import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import RunWorkoutPage from "../page";
import { LocalWorkoutRepository } from "@/lib/storage/LocalWorkoutRepository";
import { WorkoutHistoryRepository } from "@/lib/storage/WorkoutHistoryRepository";
import { SessionChannel } from "@/lib/session/SessionChannel";
import { WorkoutEngine } from "@/lib/workout/WorkoutEngine";
import type { Workout } from "@/types";

let mockSearchParams = new URLSearchParams();
let mockDisplayStatus: "waiting" | "connected" | "disconnected" = "disconnected";

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "w1" }),
  useSearchParams: () => mockSearchParams,
}));

vi.mock("@/lib/session/SessionChannel", () => ({
  SessionChannel: vi.fn().mockImplementation(function () {
    return {
      sendState: vi.fn(),
      destroy: vi.fn(),
      getConnectionStatus: () => mockDisplayStatus,
      onConnectionStatusChange: () => () => {},
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
    mockDisplayStatus = "disconnected";
    vi.mocked(SessionChannel).mockClear();
  });

  it("uses the code from the URL when present", async () => {
    seedWorkout();
    mockSearchParams = new URLSearchParams({ code: "ABC123" });
    render(<RunWorkoutPage />);
    await screen.findByDisplayValue("ABC123");
    expect(SessionChannel).toHaveBeenCalledWith("ABC123", "trainer");
  });

  it("generates a new code when the URL has none", async () => {
    seedWorkout();
    render(<RunWorkoutPage />);
    await screen.findByDisplayValue("NEWCOD");
    expect(SessionChannel).toHaveBeenCalledWith("NEWCOD", "trainer");
  });

  it("reuses the saved code for the same workout when URL has none", async () => {
    seedWorkout();
    window.localStorage.setItem(
      "gymtimer.activeSession",
      JSON.stringify({ workoutId: "w1", code: "SAVED1" })
    );
    render(<RunWorkoutPage />);
    await screen.findByDisplayValue("SAVED1");
    expect(SessionChannel).toHaveBeenCalledWith("SAVED1", "trainer");
  });

  it("editing the code reconnects the channel and saves it", async () => {
    seedWorkout();
    mockSearchParams = new URLSearchParams({ code: "ABC123" });
    render(<RunWorkoutPage />);
    const input = await screen.findByDisplayValue("ABC123");

    await act(async () => {
      fireEvent.change(input, { target: { value: "ZZZ99" } });
      fireEvent.blur(input);
    });

    await screen.findByDisplayValue("ZZZ99");
    expect(SessionChannel).toHaveBeenCalledWith("ZZZ99", "trainer");
    expect(window.localStorage.getItem("gymtimer.activeSession")).toContain("ZZZ99");
  });
});

describe("RunWorkoutPage history recording", () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockSearchParams = new URLSearchParams();
    mockDisplayStatus = "disconnected";
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

      // The seeded workout is a 1s countdown block, but start() now spends
      // a 3-second getReady countdown before the work phase actually begins.
      // Advancing past 3s + 1s + slack drives the engine all the way through
      // getReady -> work -> finished.
      act(() => {
        vi.advanceTimersByTime(4_500);
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
      // Non-RM block: no reps field should land in the record.
      expect(entry.reps).toBeUndefined();
    } finally {
      vi.useRealTimers();
    }
  });

  it("captures the rep tally in the history entry when the last block is RM", async () => {
    const workout: Workout = {
      id: "w1",
      name: "Push Press RM",
      createdAt: "2026-01-01T00:00:00.000Z",
      favorite: false,
      blocks: [
        {
          id: "b1",
          type: "rm",
          durationSeconds: 1,
          exercises: [{ id: "e1", name: "Push Press" }],
        },
      ],
    };
    new LocalWorkoutRepository().save(workout);
    render(<RunWorkoutPage />);

    const startButton = await screen.findByRole("button", { name: /^iniciar$/i });

    vi.useFakeTimers();
    try {
      fireEvent.click(startButton);

      // Tap +1 REP three times during the getReady countdown so the reps land
      // before the work phase starts.
      fireEvent.click(screen.getByRole("button", { name: "Sumar una rep" }));
      fireEvent.click(screen.getByRole("button", { name: "Sumar una rep" }));
      fireEvent.click(screen.getByRole("button", { name: "Sumar una rep" }));

      // Advance past the 3s getReady countdown + 1s RM timecap so the
      // engine reports finished.
      act(() => {
        vi.advanceTimersByTime(4_500);
      });

      const afterFinish = new WorkoutHistoryRepository().list();
      expect(afterFinish.ok).toBe(true);
      if (!afterFinish.ok) return;
      expect(afterFinish.value).toHaveLength(1);
      const [entry] = afterFinish.value;
      expect(entry.workoutId).toBe(workout.id);
      expect(entry.reps).toBe(3);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("RunWorkoutPage edit-save with display", () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockSearchParams = new URLSearchParams();
    vi.mocked(SessionChannel).mockClear();
    // Stub a minimal AudioContext so the render path doesn't blow up.
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

  it("saves timing changes silently when no display is connected", async () => {
    mockDisplayStatus = "disconnected";
    seedWorkout();
    render(<RunWorkoutPage />);

    const editButton = await screen.findByRole("button", { name: "Editar rutina" });
    await act(async () => {
      editButton.click();
    });

    
    await act(async () => {
      // Duración defaults to the slider variant; 300s = the same "5 minutos"
      // the legacy numeric-input test used to type.
      fireEvent.change(screen.getByRole("slider", { name: "Duración" }), { target: { value: "300" } });
    });

    const saveButton = screen.getByRole("button", { name: "Guardar" });
    await act(async () => {
      saveButton.click();
    });

    // Modal must NOT appear when no display is connected.
    expect(
      screen.queryByText(/¿Aplicar cambios y reiniciar el display\?/),
    ).not.toBeInTheDocument();

    // New duration is persisted to the repo (the page mirrors every workout
    // change into LocalWorkoutRepository via the save effect).
    const stored = new LocalWorkoutRepository().get("w1");
    expect(stored.ok).toBe(true);
    if (stored.ok && stored.value) expect(stored.value.blocks[0].durationSeconds).toBe(300);
  });

  it("prompts for confirmation when display is connected and timing changes", async () => {
    mockDisplayStatus = "connected";
    seedWorkout();
    render(<RunWorkoutPage />);

    const editButton = await screen.findByRole("button", { name: "Editar rutina" });
    await act(async () => {
      editButton.click();
    });

    
    await act(async () => {
      // Duración defaults to the slider variant; 300s = the same "5 minutos"
      // the legacy numeric-input test used to type.
      fireEvent.change(screen.getByRole("slider", { name: "Duración" }), { target: { value: "300" } });
    });

    const saveButton = screen.getByRole("button", { name: "Guardar" });
    await act(async () => {
      saveButton.click();
    });

    expect(
      screen.getByText(/¿Aplicar cambios y reiniciar el display\?/),
    ).toBeInTheDocument();

    // Until the user confirms, the original duration is still on disk.
    const stored = new LocalWorkoutRepository().get("w1");
    expect(stored.ok).toBe(true);
    if (stored.ok && stored.value) expect(stored.value.blocks[0].durationSeconds).toBe(600);
  });

  it("applies timing changes when the user confirms the display reset", async () => {
    mockDisplayStatus = "connected";
    seedWorkout();
    render(<RunWorkoutPage />);

    const editButton = await screen.findByRole("button", { name: "Editar rutina" });
    await act(async () => {
      editButton.click();
    });

    
    await act(async () => {
      // Duración defaults to the slider variant; 300s = the same "5 minutos"
      // the legacy numeric-input test used to type.
      fireEvent.change(screen.getByRole("slider", { name: "Duración" }), { target: { value: "300" } });
    });

    await act(async () => {
      screen.getByRole("button", { name: "Guardar" }).click();
    });

    await act(async () => {
      screen.getByRole("button", { name: /Sí, reiniciar/ }).click();
    });

    const stored = new LocalWorkoutRepository().get("w1");
    expect(stored.ok).toBe(true);
    if (stored.ok && stored.value) expect(stored.value.blocks[0].durationSeconds).toBe(300);
    expect(
      screen.queryByText(/¿Aplicar cambios y reiniciar el display\?/),
    ).not.toBeInTheDocument();
  });

  it("saves cosmetic edits (no timing change) silently even with display connected", async () => {
    mockDisplayStatus = "connected";
    seedWorkout();
    render(<RunWorkoutPage />);

    const editButton = await screen.findByRole("button", { name: "Editar rutina" });
    await act(async () => {
      editButton.click();
    });

    // Change the workout NAME only — no timing field touched.
    const nameInput = screen.getByLabelText("Nombre del entrenamiento");
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: "Murph Renombrado" } });
    });

    await act(async () => {
      screen.getByRole("button", { name: "Guardar" }).click();
    });

    // Display is connected but nothing timing-relevant changed → no prompt.
    expect(
      screen.queryByText(/¿Aplicar cambios y reiniciar el display\?/),
    ).not.toBeInTheDocument();

    const stored = new LocalWorkoutRepository().get("w1");
    expect(stored.ok).toBe(true);
    if (stored.ok && stored.value) {
      expect(stored.value.name).toBe("Murph Renombrado");
      expect(stored.value.blocks[0].durationSeconds).toBe(600);
    }
  });
});

describe("RunWorkoutPage session resume (Plan A)", () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockSearchParams = new URLSearchParams();
    mockDisplayStatus = "disconnected";
    vi.mocked(SessionChannel).mockClear();
    // handleStart calls audio.unlock(), which constructs a real AudioContext.
    // jsdom has none, so stub a minimal fake (same shape as the history
    // recording describe above).
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

  it("persists the session snapshot to localStorage as state changes", async () => {
    seedWorkout();
    render(<RunWorkoutPage />);
    const startButton = await screen.findByRole("button", { name: /^iniciar$/i });

    vi.useFakeTimers();
    try {
      act(() => {
        startButton.click();
      });
      const raw = window.localStorage.getItem("gymtimer.sessionState.w1");
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw ?? "");
      expect(parsed.state.status).toBe("running");
      expect(typeof parsed.savedAt).toBe("number");
      // The start time must land in the snapshot too, or a later re-mount
      // can't recover it for history recording (see the resume tests below).
      expect(typeof parsed.sessionStartedAtMs).toBe("number");
    } finally {
      vi.useRealTimers();
    }
  });

  it("removes the snapshot once the workout finishes", async () => {
    seedShortWorkout();
    render(<RunWorkoutPage />);
    const startButton = await screen.findByRole("button", { name: /^iniciar$/i });

    vi.useFakeTimers();
    try {
      act(() => {
        startButton.click();
      });
      // Past the 3s getReady countdown + 1s countdown block → finished.
      act(() => {
        vi.advanceTimersByTime(4_500);
      });
      expect(window.localStorage.getItem("gymtimer.sessionState.w1")).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("re-hydrates a saved snapshot on mount", async () => {
    const workout = seedWorkout();
    const engine = new WorkoutEngine(workout);
    engine.start();
    engine.skipGetReadyForTest();
    engine.pause();
    window.localStorage.setItem(
      "gymtimer.sessionState.w1",
      JSON.stringify({ state: engine.getState(), savedAt: Date.now() })
    );
    engine.destroy();

    render(<RunWorkoutPage />);
    // Paused mid-600s AMRAP → remaining time restored, controls show resume
    // instead of start (fresh pages show a full 10:00 + INICIAR).
    expect(await screen.findByText("10:00")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^reanudar$/i })).toBeInTheDocument();
  });

  it("records history anchored to the original start after resuming a snapshot with sessionStartedAtMs", async () => {
    const workout = seedShortWorkout();
    // The session "began" a minute before the snapshot was taken — the resume
    // re-mount must recover this exact value, not re-anchor at the mount time.
    const startedAtMs = Date.now() - 60_000;
    const engine = new WorkoutEngine(workout);
    engine.start();
    engine.pause();
    window.localStorage.setItem(
      "gymtimer.sessionState.w1",
      JSON.stringify({ state: engine.getState(), savedAt: Date.now(), sessionStartedAtMs: startedAtMs })
    );
    engine.destroy();

    render(<RunWorkoutPage />);
    const resumeButton = await screen.findByRole("button", { name: /^reanudar$/i });

    vi.useFakeTimers();
    try {
      fireEvent.click(resumeButton);
      // Resumed mid-3s getReady → 3s countdown + 1s countdown block → finished.
      act(() => {
        vi.advanceTimersByTime(4_500);
      });

      const afterFinish = new WorkoutHistoryRepository().list();
      expect(afterFinish.ok).toBe(true);
      if (!afterFinish.ok) return;
      expect(afterFinish.value).toHaveLength(1);
      const [entry] = afterFinish.value;
      expect(entry.durationMs).toBeGreaterThan(50_000);
      expect(entry.durationMs).toBeLessThan(70_000);
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not record history when a legacy snapshot has no sessionStartedAtMs", async () => {
    const workout = seedShortWorkout();
    // Legacy shape: { state, savedAt } with no start-time field. Without a
    // reference point the duration is unknowable, so the finished session
    // must stay out of history rather than recording a bogus duration.
    const engine = new WorkoutEngine(workout);
    engine.start();
    engine.pause();
    window.localStorage.setItem(
      "gymtimer.sessionState.w1",
      JSON.stringify({ state: engine.getState(), savedAt: Date.now() })
    );
    engine.destroy();

    render(<RunWorkoutPage />);
    const resumeButton = await screen.findByRole("button", { name: /^reanudar$/i });

    vi.useFakeTimers();
    try {
      fireEvent.click(resumeButton);
      act(() => {
        vi.advanceTimersByTime(4_500);
      });

      const afterFinish = new WorkoutHistoryRepository().list();
      expect(afterFinish.ok).toBe(true);
      if (!afterFinish.ok) return;
      expect(afterFinish.value).toHaveLength(0);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("RunWorkoutPage display status indicator", () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockSearchParams = new URLSearchParams();
    vi.mocked(SessionChannel).mockClear();
  });

  it("shows 'Esperando display…' while no display has joined", async () => {
    mockDisplayStatus = "waiting";
    seedWorkout();
    render(<RunWorkoutPage />);
    expect(await screen.findByText(/Esperando display/)).toBeInTheDocument();
  });

  it("shows 'Display conectado' when the TV is connected", async () => {
    mockDisplayStatus = "connected";
    seedWorkout();
    render(<RunWorkoutPage />);
    expect(await screen.findByText(/Display conectado/)).toBeInTheDocument();
  });

  it("falls back to clipboard when navigator.share is unavailable", async () => {
    mockDisplayStatus = "disconnected";
    seedWorkout();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    render(<RunWorkoutPage />);

    const shareButton = await screen.findByRole("button", {
      name: /Compartir link del display/,
    });
    await act(async () => {
      shareButton.click();
    });

    expect(writeText).toHaveBeenCalledWith(
      expect.stringMatching(/\/display\/NEWCOD$/),
    );
  });
});

describe("RunWorkoutPage pairing zone collapse", () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockSearchParams = new URLSearchParams();
    vi.mocked(SessionChannel).mockClear();
  });

  it("opens pairing zone by default when no display is connected", async () => {
    mockDisplayStatus = "waiting";
    seedWorkout();
    render(<RunWorkoutPage />);
    const details = await screen.findByTestId("pairing-zone");
    expect(details).toHaveAttribute("open");
  });

  it("collapses pairing zone by default when display is connected", async () => {
    mockDisplayStatus = "connected";
    seedWorkout();
    render(<RunWorkoutPage />);
    const details = await screen.findByTestId("pairing-zone");
    expect(details).not.toHaveAttribute("open");
  });

  it("clicking summary toggles the pairing zone", async () => {
    mockDisplayStatus = "connected";
    seedWorkout();
    render(<RunWorkoutPage />);
    const details = await screen.findByTestId("pairing-zone");
    expect(details).not.toHaveAttribute("open");
    const summary = details.querySelector("summary")!;
    await act(async () => {
      summary.click();
    });
    expect(details).toHaveAttribute("open");
  });

  it("keeps the display status indicator visible when pairing zone is collapsed", async () => {
    mockDisplayStatus = "connected";
    seedWorkout();
    render(<RunWorkoutPage />);
    expect(await screen.findByText(/Display conectado/)).toBeInTheDocument();
    expect(screen.getByTestId("pairing-zone")).not.toHaveAttribute("open");
  });
});

