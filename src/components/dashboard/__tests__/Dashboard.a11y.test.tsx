import { describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import axe from "axe-core";
import { Dashboard } from "../Dashboard";
import { LocalWorkoutRepository } from "@/lib/storage/LocalWorkoutRepository";
import { GymProfileRepository } from "@/lib/storage/GymProfileRepository";
import type { Workout } from "@/types";

// Color contrast via jsdom is limited: jsdom doesn't render CSS so the
// color-contrast rule may not run unless a stylesheet with computed
// properties is wired in. To get real coverage we either run axe against
// a built page in a browser (Playwright) or we compute ratios directly
// from the design tokens in globals.css. This baseline test asserts the
// structural a11y checks (landmarks, labels, alt text, ARIA) so future
// changes can't silently break them.

function seed(id: string, name: string): Workout {
  const workout: Workout = {
    id,
    name,
    createdAt: "2026-01-01T00:00:00.000Z",
    favorite: false,
    blocks: [
      {
        id: "b1",
        type: "amrap",
        durationSeconds: 600,
        exercises: [{ id: "e1", name: "Pull-up", reps: 10 }],
      },
    ],
  };
  new LocalWorkoutRepository().save(workout);
  return workout;
}

function formatViolations(results: axe.AxeResults): string {
  return results.violations
    .map(
      (v) =>
        `- ${v.id} (${v.impact}): ${v.description}\n  nodes: ${v.nodes
          .map((n) => n.target.join(", "))
          .join(" | ")}`,
    )
    .join("\n");
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("Dashboard accessibility baseline", () => {
  it("has no structural axe violations with gym profile, a pinned WOD, and history", async () => {
    new GymProfileRepository().save({ name: "Box del Sur", wodWorkoutId: "w1" });
    seed("w1", "Murph");

    const { container } = render(<Dashboard />);
    const results = await axe.run(container, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "best-practice"] },
      // Disable color-contrast because jsdom can't compute color values;
      // the ratio check is enforced manually via design-token math.
      rules: { "color-contrast": { enabled: false } },
    });
    expect(results.violations, formatViolations(results)).toEqual([]);
  });

  it("has no structural axe violations in the first-run empty state", async () => {
    const { container } = render(<Dashboard />);
    const results = await axe.run(container, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "best-practice"] },
      rules: { "color-contrast": { enabled: false } },
    });
    expect(results.violations, formatViolations(results)).toEqual([]);
  });
});