import { describe, it, expect } from "vitest";
import { generateCode } from "../generateCode";

describe("generateCode", () => {
  it("returns a 6-character uppercase alphanumeric code", () => {
    const code = generateCode();
    expect(code).toMatch(/^[A-Z0-9]{6}$/);
  });

  it("returns different codes across calls (no fixed seed)", () => {
    const codes = new Set(Array.from({ length: 20 }, () => generateCode()));
    expect(codes.size).toBeGreaterThan(1);
  });
});
