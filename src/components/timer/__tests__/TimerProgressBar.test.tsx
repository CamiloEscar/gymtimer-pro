import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TimerProgressBar } from "../TimerProgressBar";

describe("TimerProgressBar", () => {
  it("renders the elapsed/duration ratio as width in countdown mode", () => {
    render(<TimerProgressBar mode="countdown" elapsedMs={2500} durationMs={10000} />);
    expect(screen.getByTestId("timer-progress-bar")).toHaveStyle({ width: "25%" });
  });

  it("clamps the width to 100% when elapsed exceeds duration", () => {
    render(<TimerProgressBar mode="countdown" elapsedMs={15000} durationMs={10000} />);
    expect(screen.getByTestId("timer-progress-bar")).toHaveStyle({ width: "100%" });
  });

  it("renders nothing in countup mode", () => {
    render(<TimerProgressBar mode="countup" elapsedMs={5000} durationMs={0} />);
    expect(screen.queryByTestId("timer-progress-bar")).not.toBeInTheDocument();
  });
});