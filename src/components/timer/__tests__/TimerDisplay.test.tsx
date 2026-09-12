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

  it("renders nothing during getReady to avoid stacking with PhaseIndicator", () => {
    const { container } = render(
      <TimerDisplay remainingMs={3_000} elapsedMs={0} mode="countdown" phase="getReady" />,
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
