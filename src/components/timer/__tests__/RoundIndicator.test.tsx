import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RoundIndicator } from "../RoundIndicator";

describe("RoundIndicator", () => {
  it("uses brand color on the last round and gray otherwise", () => {
    const { rerender } = render(<RoundIndicator round={3} totalRounds={5} />);
    const mid = screen.getByText("[ RONDA 3 / 5 ]");
    expect(mid.className).toContain("text-gray-400");
    expect(mid.className).not.toContain("text-brand-500");

    rerender(<RoundIndicator round={5} totalRounds={5} />);
    const last = screen.getByText("[ RONDA 5 / 5 ]");
    expect(last.className).toContain("text-brand-500");
    expect(last.className).not.toContain("text-gray-400");
  });
});
