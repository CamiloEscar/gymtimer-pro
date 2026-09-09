import "@testing-library/jest-dom/vitest";
import { vi, beforeEach } from "vitest";

interface MockIntersectionObserverEntry {
  isIntersecting: boolean;
  intersectionRatio: number;
  target: Element;
  boundingClientRect: DOMRectReadOnly;
  intersectionRect: DOMRectReadOnly;
  rootBounds: DOMRectReadOnly | null;
  time: number;
}

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];

  callback: IntersectionObserverCallback;
  elements: Element[] = [];
  disconnected = false;

  constructor(cb: IntersectionObserverCallback) {
    this.callback = cb;
    MockIntersectionObserver.instances.push(this);
  }

  observe(el: Element) {
    this.elements.push(el);
  }

  unobserve(el: Element) {
    this.elements = this.elements.filter((e) => e !== el);
  }

  disconnect() {
    this.disconnected = true;
    this.elements = [];
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  trigger(isIntersecting: boolean) {
    if (this.disconnected) return;
    const observer = this as unknown as IntersectionObserver;
    this.callback(
      this.elements.map(
        (target): IntersectionObserverEntry => ({
          isIntersecting,
          intersectionRatio: isIntersecting ? 1 : 0,
          target,
          boundingClientRect: {} as DOMRectReadOnly,
          intersectionRect: {} as DOMRectReadOnly,
          rootBounds: null,
          time: Date.now(),
        })
      ),
      observer
    );
  }
}

(globalThis as { IntersectionObserver?: unknown }).IntersectionObserver =
  MockIntersectionObserver as unknown as typeof IntersectionObserver;

(globalThis as { __triggerIntersection?: (b: boolean) => void }).__triggerIntersection =
  (isIntersecting: boolean) => {
    for (const observer of MockIntersectionObserver.instances) {
      observer.trigger(isIntersecting);
    }
  };

if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

if (typeof HTMLVideoElement !== "undefined") {
  Object.defineProperty(HTMLVideoElement.prototype, "play", {
    configurable: true,
    value: vi.fn().mockResolvedValue(undefined),
  });
  Object.defineProperty(HTMLVideoElement.prototype, "load", {
    configurable: true,
    value: vi.fn(),
  });
}

beforeEach(() => {
  MockIntersectionObserver.instances.length = 0;
});
