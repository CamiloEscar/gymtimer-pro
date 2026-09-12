import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TimerControls } from "../TimerControls";

describe("TimerControls — proportional ±SEG step", () => {
  it("renders the label using the provided step", () => {
    render(
      <TimerControls
        status="running"
        onStart={vi.fn()}
        onPause={vi.fn()}
        onResume={vi.fn()}
        onReset={vi.fn()}
        onNext={vi.fn()}
        onPrevious={vi.fn()}
        onAddTime={vi.fn()}
        onSubtractTime={vi.fn()}
        stepSeconds={3}
      />,
    );
    expect(screen.getByRole("button", { name: /-3 SEG$/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /\+3 SEG$/ })).toBeInTheDocument();
  });

  it("rounds fractional stepSeconds up to a whole number", () => {
    // 2.4s rounds to 2, but the guard is min 1 so it stays readable.
    render(
      <TimerControls
        status="running"
        onStart={vi.fn()}
        onPause={vi.fn()}
        onResume={vi.fn()}
        onReset={vi.fn()}
        onNext={vi.fn()}
        onPrevious={vi.fn()}
        onAddTime={vi.fn()}
        onSubtractTime={vi.fn()}
        stepSeconds={2.4}
      />,
    );
    expect(screen.getByRole("button", { name: /-2 SEG$/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /\+2 SEG$/ })).toBeInTheDocument();
  });

  it("invokes the add/subtract handlers when the buttons are clicked", async () => {
    const user = userEvent.setup();
    const onAddTime = vi.fn();
    const onSubtractTime = vi.fn();
    render(
      <TimerControls
        status="running"
        onStart={vi.fn()}
        onPause={vi.fn()}
        onResume={vi.fn()}
        onReset={vi.fn()}
        onNext={vi.fn()}
        onPrevious={vi.fn()}
        onAddTime={onAddTime}
        onSubtractTime={onSubtractTime}
        stepSeconds={5}
      />,
    );
    await user.click(screen.getByRole("button", { name: /\+5 SEG$/ }));
    await user.click(screen.getByRole("button", { name: /-5 SEG$/ }));
    expect(onAddTime).toHaveBeenCalledOnce();
    expect(onSubtractTime).toHaveBeenCalledOnce();
  });
});
