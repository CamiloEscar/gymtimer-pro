import { describe, it, expect } from "vitest";
import { parseTimeInput, formatTimeInput } from "../parseTimeInput";

describe("parseTimeInput", () => {
  describe("invalid input returns null", () => {
    it("returns null for empty string", () => {
      expect(parseTimeInput("")).toBeNull();
    });

    it("returns null for non-numeric text", () => {
      expect(parseTimeInput("abc")).toBeNull();
    });

    it("returns null for negative number", () => {
      expect(parseTimeInput("-5")).toBeNull();
    });

    it("returns null for bare number greater than 59 (use mm:ss instead)", () => {
      expect(parseTimeInput("99")).toBeNull();
    });

    it("returns null for invalid mm:ss (seconds >= 60)", () => {
      expect(parseTimeInput("10:60")).toBeNull();
    });

    it("returns null for non-numeric colon input", () => {
      expect(parseTimeInput("abc:def")).toBeNull();
    });

    it("returns null for trailing colon", () => {
      expect(parseTimeInput("1:")).toBeNull();
    });

    it("returns null for four segments", () => {
      expect(parseTimeInput("1:00:00:00")).toBeNull();
    });

    it("returns null for h:mm:ss with minutes >= 60", () => {
      expect(parseTimeInput("1:60:00")).toBeNull();
    });

    it("returns null for h:mm:ss with seconds >= 60", () => {
      expect(parseTimeInput("1:00:60")).toBeNull();
    });
  });

  describe("zero values", () => {
    it("parses bare '0' as 0 seconds", () => {
      expect(parseTimeInput("0")).toBe(0);
    });

    it("parses '0:00' as 0 seconds", () => {
      expect(parseTimeInput("0:00")).toBe(0);
    });
  });

  describe("bare number is minutes (0-59)", () => {
    it("parses '10' as 600 seconds", () => {
      expect(parseTimeInput("10")).toBe(600);
    });

    it("parses '59' as 59 minutes = 3540 seconds", () => {
      expect(parseTimeInput("59")).toBe(3540);
    });

    it("parses '1' as 60 seconds", () => {
      expect(parseTimeInput("1")).toBe(60);
    });
  });

  describe("mm:ss format", () => {
    it("parses '10:00' as 600 seconds", () => {
      expect(parseTimeInput("10:00")).toBe(600);
    });

    it("parses '1:30' as 90 seconds", () => {
      expect(parseTimeInput("1:30")).toBe(90);
    });

    it("parses '0:45' as 45 seconds", () => {
      expect(parseTimeInput("0:45")).toBe(45);
    });

    it("parses '0:05' as 5 seconds", () => {
      expect(parseTimeInput("0:05")).toBe(5);
    });
  });

  describe("h:mm:ss format", () => {
    it("parses '1:00:00' as 3600 seconds", () => {
      expect(parseTimeInput("1:00:00")).toBe(3600);
    });

    it("parses '1:01:01' as 3661 seconds", () => {
      expect(parseTimeInput("1:01:01")).toBe(3661);
    });
  });

  describe("whitespace handling", () => {
    it("trims surrounding whitespace", () => {
      expect(parseTimeInput("  10:00  ")).toBe(600);
    });
  });
});

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
