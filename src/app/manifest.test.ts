import { describe, it, expect } from "vitest";
import manifest from "@/app/manifest";

describe("app/manifest", () => {
  it("declares GymTimer Pro as a standalone PWA", () => {
    const m = manifest();
    expect(m.name).toBe("GymTimer Pro");
    expect(m.short_name).toBe("GymTimer");
    expect(m.start_url).toBe("/");
    expect(m.display).toBe("standalone");
    expect(m.orientation).toBe("landscape");
    expect(m.theme_color).toBe("#0a0a0a");
    expect(m.background_color).toBe("#0a0a0a");
  });

  it("ships three icon entries: 192, 512, and maskable", () => {
    const m = manifest();
    expect(m.icons).toHaveLength(3);
    expect(m.icons?.map((i) => i.sizes)).toEqual([
      "192x192",
      "512x512",
      "512x512",
    ]);
    expect(m.icons?.[2]?.purpose).toBe("maskable");
    // All entries point at the same single source asset for now.
    expect(new Set(m.icons?.map((i) => i.src))).toEqual(
      new Set(["/images/display.png"])
    );
  });
});
