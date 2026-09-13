import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { ServiceWorkerRegistrar } from "@/components/pwa/ServiceWorkerRegistrar";

describe("ServiceWorkerRegistrar", () => {
  const originalSW = navigator.serviceWorker;

  beforeEach(() => {
    // jsdom does not ship serviceWorker; stub it for these tests.
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: { register: vi.fn().mockResolvedValue(undefined) },
    });
  });

  afterEach(() => {
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: originalSW,
    });
    vi.restoreAllMocks();
  });

  it("registers /sw.js on mount and renders nothing", () => {
    const { container } = render(<ServiceWorkerRegistrar />);
    expect(navigator.serviceWorker.register).toHaveBeenCalledWith(
      "/sw.js",
      { scope: "/" }
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("does nothing when serviceWorker is unavailable", () => {
    // Older browsers and some jsdom environments lack the API — the
    // registrar must degrade silently.
    Reflect.deleteProperty(navigator as object, "serviceWorker" as never);
    expect(() => render(<ServiceWorkerRegistrar />)).not.toThrow();
  });
});
