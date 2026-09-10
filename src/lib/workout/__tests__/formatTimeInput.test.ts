import { describe, it, expect } from "vitest";
import { formatTimeInput } from "../formatTimeInput";

describe("formatTimeInput", () => {
  it("formats 0 as '0:00'", () => {
    expect(formatTimeInput(0)).toBe("0:00");
  });

  it("formats 45 seconds as '0:45'", () => {
    expect(formatTimeInput(45)).toBe("0:45");
  });

  it("formats 90 seconds as '1:30'", () => {
    expect(formatTimeInput(90)).toBe("1:30");
  });

  it("formats 600 seconds as '10:00'", () => {
    expect(formatTimeInput(600)).toBe("10:00");
  });

  it("formats 3661 seconds as '1:01:01' (uses h:mm:ss past 1 hour)", () => {
    expect(formatTimeInput(3661)).toBe("1:01:01");
  });

  it("formats 3600 seconds as '1:00:00'", () => {
    expect(formatTimeInput(3600)).toBe("1:00:00");
  });

  it("defensively formats negative as '0:00'", () => {
    expect(formatTimeInput(-10)).toBe("0:00");
  });

  it("defensively formats NaN as '0:00'", () => {
    expect(formatTimeInput(NaN)).toBe("0:00");
  });

  it("defensively formats Infinity as '0:00'", () => {
    expect(formatTimeInput(Infinity)).toBe("0:00");
  });

  it("floors fractional seconds", () => {
    expect(formatTimeInput(90.9)).toBe("1:30");
  });
});