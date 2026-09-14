import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { TimerDisplay } from "../TimerDisplay";

describe("TimerDisplay", () => {
  it("renders the formatted remaining time for countdown mode", () => {
    const { container } = render(
      <TimerDisplay remainingMs={125_000} elapsedMs={0} mode="countdown" phase="work" />,
    );
    expect(container.textContent).toBe("02:05");
  });

  it("renders the elapsed time when mode is countup", () => {
    const { container } = render(
      <TimerDisplay remainingMs={0} elapsedMs={62_000} mode="countup" phase="work" />,
    );
    expect(container.textContent).toBe("01:02");
  });

  it("renders the full duration at ready (no 3-2-1 preroll has started)", () => {
    const { container } = render(
      <TimerDisplay
        remainingMs={300_000}
        elapsedMs={0}
        mode="countdown"
        status="ready"
        phase="getReady"
      />,
    );
    expect(container.textContent).toBe("05:00");
  });

  it("renders nothing during a live getReady countdown to avoid stacking with PhaseIndicator", () => {
    const { container } = render(
      <TimerDisplay
        remainingMs={3_000}
        elapsedMs={0}
        mode="countdown"
        status="running"
        phase="getReady"
      />,
    );
    expect(container.textContent).toBe("");
  });

  it("renders the HH:MM:SS form for long countdowns", () => {
    const { container } = render(
      <TimerDisplay remainingMs={3_725_000} elapsedMs={0} mode="countdown" phase="work" />,
    );
    expect(container.textContent).toBe("01:02:05");
  });
});
