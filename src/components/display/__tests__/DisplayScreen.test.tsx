import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DisplayScreen } from "../DisplayScreen";
import type { SessionState } from "@/types";

vi.mock("@/components/ui/VideoPlayer", () => ({
  VideoPlayer: ({ alt }: { alt: string }) => <div data-testid="display-video">{alt}</div>,
}));

function buildState(overrides: Partial<SessionState> = {}): SessionState {
  return {
    code: "ABC123",
    workout: {
      id: "w1",
      name: "WOD del día",
      createdAt: "2026-01-01T00:00:00.000Z",
      favorite: false,
      blocks: [
        {
          id: "block-1",
          type: "amrap",
          durationSeconds: 600,
          exercises: [{ id: "ex-1", name: "Thruster", reps: 21 }],
        },
      ],
    },
    status: "running",
    currentBlockIndex: 0,
    currentRound: 1,
    totalRounds: 1,
    currentPhase: "work",
    currentExerciseIndex: 0,
    timer: {
      mode: "countdown",
      status: "running",
      durationMs: 60000,
      elapsedMs: 15000,
      remainingMs: 45000,
    },
    ...overrides,
  };
}

describe("DisplayScreen block time progress bar", () => {
  it("renders a progress bar reflecting elapsed/duration when timer mode is countdown", () => {
    const state = buildState();
    render(
      <DisplayScreen state={state} connectionStatus="connected" onFullscreenToggle={() => {}} />
    );

    const bar = screen.getByTestId("block-progress-bar");
    expect(bar).toHaveStyle({ width: "25%" });
  });

  it("clamps progress to 100% when elapsed exceeds duration", () => {
    const state = buildState({
      timer: { mode: "countdown", status: "running", durationMs: 1000, elapsedMs: 5000, remainingMs: 0 },
    });
    render(
      <DisplayScreen state={state} connectionStatus="connected" onFullscreenToggle={() => {}} />
    );

    expect(screen.getByTestId("block-progress-bar")).toHaveStyle({ width: "100%" });
  });

  it("does not render the progress bar when timer mode is countup", () => {
    const state = buildState({
      timer: { mode: "countup", status: "running", durationMs: 0, elapsedMs: 15000, remainingMs: 0 },
    });
    render(
      <DisplayScreen state={state} connectionStatus="connected" onFullscreenToggle={() => {}} />
    );

    expect(screen.queryByTestId("block-progress-bar")).not.toBeInTheDocument();
  });
});

describe("DisplayScreen block indicator", () => {
  it("shows the current block position when there is more than one block", () => {
    const state = buildState({
      currentBlockIndex: 1,
      workout: {
        id: "w1",
        name: "WOD",
        createdAt: "2026-01-01T00:00:00.000Z",
        favorite: false,
        blocks: [
          { id: "b1", type: "amrap", durationSeconds: 600, exercises: [{ id: "e1", name: "A" }] },
          { id: "b2", type: "amrap", durationSeconds: 600, exercises: [{ id: "e2", name: "B" }] },
          { id: "b3", type: "amrap", durationSeconds: 600, exercises: [{ id: "e3", name: "C" }] },
        ],
      },
    });
    render(
      <DisplayScreen state={state} connectionStatus="connected" onFullscreenToggle={() => {}} />
    );

    expect(screen.getByText("[ BLOQUE 2/3 ]")).toBeInTheDocument();
  });

  it("hides the block indicator when the workout has a single block", () => {
    const state = buildState();
    render(
      <DisplayScreen state={state} connectionStatus="connected" onFullscreenToggle={() => {}} />
    );

    expect(screen.queryByText(/BLOQUE/)).not.toBeInTheDocument();
  });
});

describe("DisplayScreen RM rep counter", () => {
  it("shows the accumulated rep count for an RM block in the running state", () => {
    const state = buildState({
      workout: {
        id: "w1",
        name: "WOD",
        createdAt: "2026-01-01T00:00:00.000Z",
        favorite: false,
        blocks: [
          {
            id: "b1",
            type: "rm",
            durationSeconds: 120,
            exercises: [{ id: "e1", name: "Push Press" }],
          },
        ],
      },
      accumulatedReps: 17,
    });
    render(
      <DisplayScreen state={state} connectionStatus="connected" onFullscreenToggle={() => {}} />
    );

    expect(screen.getByTestId("rm-reps-display")).toHaveTextContent("17 REPS");
  });

  it("falls back to 0 when accumulatedReps is missing for an RM block", () => {
    const state = buildState({
      workout: {
        id: "w1",
        name: "WOD",
        createdAt: "2026-01-01T00:00:00.000Z",
        favorite: false,
        blocks: [
          {
            id: "b1",
            type: "rm",
            durationSeconds: 120,
            exercises: [{ id: "e1", name: "Push Press" }],
          },
        ],
      },
    });
    render(
      <DisplayScreen state={state} connectionStatus="connected" onFullscreenToggle={() => {}} />
    );

    expect(screen.getByTestId("rm-reps-display")).toHaveTextContent("0 REPS");
  });
});

describe("DisplayScreen FGB station indicator", () => {
  function fgbState(stationIndex: number) {
    return buildState({
      workout: {
        id: "w1",
        name: "FGB",
        createdAt: "2026-01-01T00:00:00.000Z",
        favorite: false,
        blocks: [
          {
            id: "b1",
            type: "fightGoneBad",
            durationSeconds: 0,
            rounds: 3,
            stationSeconds: 60,
            roundRestSeconds: 60,
            exercises: [
              { id: "e1", name: "Wall Ball" },
              { id: "e2", name: "SDHP" },
              { id: "e3", name: "Box Jump" },
            ],
          },
        ],
      },
      currentRound: 1,
      totalRounds: 3,
      currentExerciseIndex: stationIndex,
    });
  }

  it("shows the current station index for FGB", () => {
    render(
      <DisplayScreen
        state={fgbState(1)}
        connectionStatus="connected"
        onFullscreenToggle={() => {}}
      />
    );

    expect(screen.getByText(/ESTACI.N 2 \/ 3/)).toBeInTheDocument();
  });

  it("highlights the current FGB station in the side panel list", () => {
    render(
      <DisplayScreen
        state={fgbState(1)}
        connectionStatus="connected"
        onFullscreenToggle={() => {}}
      />
    );

    const current = screen.getByTestId("exercise-list-item-current");
    expect(current).toHaveTextContent("Wall Ball");
    expect(current.className).toContain("bg-brand-500");
    expect(screen.getAllByTestId("exercise-list-item-other")).toHaveLength(2);
  });

  function tabataRoundState(round: number) {
  return buildState({
    currentRound: round,
    totalRounds: 5,
    workout: {
      id: "w1",
      name: "Tabata",
      createdAt: "2026-01-01T00:00:00.000Z",
      favorite: false,
      blocks: [
        {
          id: "b1",
          type: "tabata",
          durationSeconds: 240,
          exercises: [
            { id: "ex-1", name: "Thruster" },
            { id: "ex-2", name: "Pull-up" },
          ],
        },
      ],
    },
  });
}

function renderTabataAtRound(round: number) {
  return render(
    <DisplayScreen
      state={tabataRoundState(round)}
      connectionStatus="connected"
      onFullscreenToggle={() => {}}
    />
  );
}

it("advances the highlight per round with wrap-around (round 1 → Thruster)", () => {
  renderTabataAtRound(1);
  expect(screen.getByTestId("exercise-list-item-current").textContent).toContain("Thruster");
});

it("advances the highlight per round with wrap-around (round 2 → Pull-up)", () => {
  renderTabataAtRound(2);
  expect(screen.getByTestId("exercise-list-item-current").textContent).toContain("Pull-up");
});

it("advances the highlight per round with wrap-around (round 3 → Thruster)", () => {
  renderTabataAtRound(3);
  expect(screen.getByTestId("exercise-list-item-current").textContent).toContain("Thruster");
});

it("advances the highlight per round with wrap-around (round 4 → Pull-up)", () => {
  renderTabataAtRound(4);
  expect(screen.getByTestId("exercise-list-item-current").textContent).toContain("Pull-up");
});

it("advances the highlight per round with wrap-around (round 5 → Thruster)", () => {
  renderTabataAtRound(5);
  expect(screen.getByTestId("exercise-list-item-current").textContent).toContain("Thruster");
});

  it("shows the inter-round rest label while in the rest phase", () => {
    const state = buildState({
      currentPhase: "rest",
      currentRound: 1,
      totalRounds: 3,
      workout: {
        id: "w1",
        name: "FGB",
        createdAt: "2026-01-01T00:00:00.000Z",
        favorite: false,
        blocks: [
          {
            id: "b1",
            type: "fightGoneBad",
            durationSeconds: 0,
            rounds: 3,
            stationSeconds: 60,
            roundRestSeconds: 60,
            exercises: [
              { id: "e1", name: "Wall Ball" },
              { id: "e2", name: "SDHP" },
              { id: "e3", name: "Box Jump" },
            ],
          },
        ],
      },
    });
    render(
      <DisplayScreen state={state} connectionStatus="connected" onFullscreenToggle={() => {}} />
    );

    expect(screen.getByText("DESCANSO ENTRE RONDAS")).toBeInTheDocument();
  });
});

describe("DisplayScreen round background color", () => {
  it("uses the default background for a single-round workout", () => {
    const state = buildState({ totalRounds: 1, currentRound: 1 });
    const { container } = render(
      <DisplayScreen state={state} connectionStatus="connected" onFullscreenToggle={() => {}} />
    );
    expect(container.firstChild).toHaveClass("bg-surface-950");
  });

  it("cycles the background per round for multi-round workouts", () => {
    const round1 = buildState({ totalRounds: 4, currentRound: 1 });
    const { container: c1 } = render(
      <DisplayScreen state={round1} connectionStatus="connected" onFullscreenToggle={() => {}} />
    );
    expect(c1.firstChild).toHaveClass("bg-surface-950");

    const round2 = buildState({ totalRounds: 4, currentRound: 2 });
    const { container: c2 } = render(
      <DisplayScreen state={round2} connectionStatus="connected" onFullscreenToggle={() => {}} />
    );
    expect(c2.firstChild).toHaveClass("bg-round-1");

    const round5 = buildState({ totalRounds: 6, currentRound: 5 });
    const { container: c5 } = render(
      <DisplayScreen state={round5} connectionStatus="connected" onFullscreenToggle={() => {}} />
    );
    // round 5 lands on index 4 of the 5-color palette (surface + 4 accents): (5-1) % 5 = 4
    expect(c5.firstChild).toHaveClass("bg-round-4");
  });
});

describe("DisplayScreen workout video", () => {
  it("shows the video in the right panel during the work phase when videoByExerciseId has the current exercise", () => {
    const state = buildState({
      currentPhase: "work",
      videoByExerciseId: { "ex-1": { videoUrl: "/v.mp4" } },
    });
    render(
      <DisplayScreen state={state} connectionStatus="connected" onFullscreenToggle={() => {}} />
    );

    expect(screen.getByTestId("display-video")).toHaveTextContent("Thruster");
  });

  it("shows the placeholder when videoByExerciseId is empty", () => {
    const state = buildState({
      currentPhase: "work",
      videoByExerciseId: {},
    });
    render(
      <DisplayScreen state={state} connectionStatus="connected" onFullscreenToggle={() => {}} />
    );

    expect(screen.queryByTestId("display-video")).not.toBeInTheDocument();
    expect(screen.getByTestId("display-video-placeholder")).toBeInTheDocument();
  });

  it("keeps the video mounted but pauses it during the rest phase", () => {
    const state = buildState({
      currentPhase: "rest",
      videoByExerciseId: { "ex-1": { videoUrl: "/v.mp4" } },
    });
    render(
      <DisplayScreen state={state} connectionStatus="connected" onFullscreenToggle={() => {}} />
    );

    // Video element stays mounted across the work→rest transition (so the
    // playback position is preserved); phase change triggers .pause() via
    // the imperative handle instead of unmounting.
    expect(screen.getByTestId("display-video")).toHaveTextContent("Thruster");
    expect(screen.getByTestId("display-side-panel")).toBeInTheDocument();
    expect(screen.queryByTestId("display-video-placeholder")).not.toBeInTheDocument();
  });

  it("shows the placeholder when videoByExerciseId is absent", () => {
    const state = buildState({ currentPhase: "work" });
    render(
      <DisplayScreen state={state} connectionStatus="connected" onFullscreenToggle={() => {}} />
    );

    expect(screen.queryByTestId("display-video")).not.toBeInTheDocument();
    expect(screen.getByTestId("display-video-placeholder")).toBeInTheDocument();
  });

  it("shows the gym logo in place of the video placeholder when a gym profile is stored", () => {
    window.localStorage.setItem(
      "gymtimer.gymProfile",
      JSON.stringify({ name: "Box del Sur", logoUrl: "/logos/box.png" })
    );
    const state = buildState({ currentPhase: "work" });
    render(
      <DisplayScreen state={state} connectionStatus="connected" onFullscreenToggle={() => {}} />
    );

    expect(screen.queryByTestId("display-video")).not.toBeInTheDocument();
    expect(screen.queryByTestId("display-video-placeholder")).not.toBeInTheDocument();
    expect(screen.getByTestId("display-gym-logo")).toBeInTheDocument();

    window.localStorage.removeItem("gymtimer.gymProfile");
  });
});

describe("DisplayScreen side panel", () => {
  it("renders the exercise list inside the side panel during work for a non-rest block", () => {
    const state = buildState();
    render(
      <DisplayScreen state={state} connectionStatus="connected" onFullscreenToggle={() => {}} />
    );

    const panel = screen.getByTestId("display-side-panel");
    expect(panel).toBeInTheDocument();
    expect(panel).toHaveTextContent("Thruster");
  });

  it("hides the side panel for finished phase", () => {
    const state = buildState({ currentPhase: "finished" });
    render(
      <DisplayScreen state={state} connectionStatus="connected" onFullscreenToggle={() => {}} />
    );

    expect(screen.queryByTestId("display-side-panel")).not.toBeInTheDocument();
  });
});
