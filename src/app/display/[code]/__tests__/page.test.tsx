import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import DisplayCodePage from "../page";
import type { SessionState, ConnectionStatus } from "@/types";

vi.mock("next/navigation", () => ({
  useParams: () => ({ code: "abc123" }),
}));

let stateHandler: ((state: SessionState) => void) | null = null;
let statusHandler: ((status: ConnectionStatus) => void) | null = null;
let destroyMock: ReturnType<typeof vi.fn>;

vi.mock("@/lib/session/SessionChannel", () => ({
  SessionChannel: vi.fn(
    function MockSessionChannel(this: Record<string, unknown>) {
      this.onState = vi.fn((handler: (state: SessionState) => void) => {
        stateHandler = handler;
        return () => {
          stateHandler = null;
        };
      });
      this.onConnectionStatusChange = vi.fn((handler: (status: ConnectionStatus) => void) => {
        statusHandler = handler;
        return () => {
          statusHandler = null;
        };
      });
      this.destroy = destroyMock;
    }
  ),
}));

vi.mock("@/hooks/useFullscreen", () => ({
  useFullscreen: () => ({ toggle: vi.fn() }),
}));

import { SessionChannel } from "@/lib/session/SessionChannel";

vi.mock("@/components/ui/VideoPlayer", () => ({
  VideoPlayer: () => null,
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

describe("DisplayCodePage (mirror)", () => {
  beforeEach(() => {
    destroyMock = vi.fn();
    stateHandler = null;
    statusHandler = null;
    vi.mocked(SessionChannel).mockClear();
  });

  it("subscribes to the session channel with a display role and shows the connection screen while waiting", () => {
    render(<DisplayCodePage />);
    expect(SessionChannel).toHaveBeenCalledWith("ABC123", "display");
    expect(screen.getByText("CONECTAR PANTALLA")).toBeInTheDocument();
    expect(screen.getByText("ABC123")).toBeInTheDocument();
  });

  it("renders DisplayScreen once a remote snapshot arrives and sets connection status", async () => {
    render(<DisplayCodePage />);
    statusHandler?.("connected");
    stateHandler?.(buildState());
    expect(await screen.findByText("WOD del día")).toBeInTheDocument();
    expect(screen.getByTestId("display-side-panel")).toBeInTheDocument();
  });

  it("destroys the channel and mirror on unmount", () => {
    const { unmount } = render(<DisplayCodePage />);
    unmount();
    expect(destroyMock).toHaveBeenCalled();
  });

  it("rehydrates the mirror engine from subsequent snapshots", async () => {
    render(<DisplayCodePage />);
    statusHandler?.("connected");
    stateHandler?.(buildState());
    expect(await screen.findByText("WOD del día")).toBeInTheDocument();
    stateHandler?.(buildState({ currentPhase: "rest" }));
    await waitFor(() => expect(screen.getByText("DESCANSO")).toBeInTheDocument());
  });
});