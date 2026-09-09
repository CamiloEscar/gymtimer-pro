import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatsRow } from "../StatsRow";

describe("StatsRow", () => {
  it("shows a motivating empty state when there is no history yet", () => {
    render(<StatsRow stats={{ sessionsThisWeek: 0, streakDays: 0, totalTimeMs: 0 }} totalRoutines={2} />);
    expect(screen.getByText(/arrancá tu racha hoy/i)).toBeInTheDocument();
  });

  it("shows the session count for this week", () => {
    render(<StatsRow stats={{ sessionsThisWeek: 3, streakDays: 2, totalTimeMs: 7_200_000 }} totalRoutines={5} />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("shows the streak in days", () => {
    render(<StatsRow stats={{ sessionsThisWeek: 3, streakDays: 5, totalTimeMs: 7_200_000 }} totalRoutines={5} />);
    expect(screen.getByText(/5/)).toBeInTheDocument();
  });

  it("formats total time trained as hours and minutes", () => {
    render(<StatsRow stats={{ sessionsThisWeek: 1, streakDays: 1, totalTimeMs: 5_400_000 }} totalRoutines={5} />);
    // 5,400,000ms = 90 minutes = 1h 30m
    expect(screen.getByText("1h 30m")).toBeInTheDocument();
  });

  it("shows the total number of saved routines", () => {
    render(<StatsRow stats={{ sessionsThisWeek: 0, streakDays: 0, totalTimeMs: 0 }} totalRoutines={7} />);
    expect(screen.getByText("7")).toBeInTheDocument();
  });
});
