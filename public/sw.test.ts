import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("public/sw.js", () => {
  const sw = readFileSync(resolve(process.cwd(), "public/sw.js"), "utf8");

  it("defines install/activate/fetch handlers", () => {
    expect(sw).toContain("addEventListener(\"install\"");
    expect(sw).toContain("addEventListener(\"activate\"");
    expect(sw).toContain("addEventListener(\"fetch\"");
  });

  it("precaches the offline fallback", () => {
    expect(sw).toContain("/offline");
    expect(sw).toMatch(/PRECACHE_URLS\s*=\s*\[\s*["']\/offline["']\s*\]/);
  });

  it("skips waiting and claims clients on update", () => {
    expect(sw).toContain("skipWaiting");
    expect(sw).toContain("clients.claim");
  });

  it("falls back to /offline when navigation fetch fails", () => {
    expect(sw).toContain('req.mode === "navigate"');
    expect(sw).toMatch(/cache\.match\(["']\/offline["']\)/);
  });

  it("only caches successful GET responses on same origin", () => {
    expect(sw).toContain('req.method !== "GET"');
    expect(sw).toContain("url.origin !== self.location.origin");
    expect(sw).toContain("res.ok");
  });
});
