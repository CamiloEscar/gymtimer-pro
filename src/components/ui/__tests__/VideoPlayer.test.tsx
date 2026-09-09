import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { VideoPlayer } from "../VideoPlayer";

declare global {
  var __triggerIntersection: (isIntersecting: boolean) => void;
}

beforeEach(() => {
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }) as MediaQueryList
  );
});

function enterViewport() {
  act(() => {
    globalThis.__triggerIntersection(true);
  });
}

describe("VideoPlayer — lazy mounting", () => {
  it("does NOT render <video> when out of viewport and lazy=true (default)", () => {
    const { container } = render(
      <VideoPlayer src="/exercises/pull-ups.mp4" alt="Dominadas" />
    );
    expect(container.querySelector("video")).toBeNull();
  });

  it("renders <video> when the element enters the viewport", () => {
    const { container } = render(
      <VideoPlayer src="/exercises/pull-ups.mp4" alt="Dominadas" />
    );
    enterViewport();
    expect(container.querySelector("video")).not.toBeNull();
    expect(screen.getByLabelText("Dominadas").tagName).toBe("VIDEO");
  });

  it("renders <video> immediately when lazy=false, without waiting for intersection", () => {
    const { container } = render(
      <VideoPlayer src="/exercises/pull-ups.mp4" alt="Dominadas" lazy={false} />
    );
    expect(container.querySelector("video")).not.toBeNull();
  });
});

describe("VideoPlayer — fallback", () => {
  it("renders the gradient fallback (no thumbnail) when out of view", () => {
    render(<VideoPlayer src="/exercises/pull-ups.mp4" alt="Dominadas" />);
    expect(screen.getByRole("img", { name: "Dominadas" })).toBeInTheDocument();
  });

  it("renders the thumbnail <img> when provided and out of view", () => {
    const { container } = render(
      <VideoPlayer
        src="/exercises/pull-ups.mp4"
        thumbnailSrc="/exercises/pull-ups.jpg"
        alt="Dominadas"
      />
    );
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(decodeURIComponent(img?.getAttribute("src") ?? "")).toContain(
      "/exercises/pull-ups.jpg"
    );
    expect(container.querySelector("video")).toBeNull();
  });

  it("swaps to the gradient fallback when the <video> errors", () => {
    const { container } = render(
      <VideoPlayer src="/exercises/missing.mp4" alt="Dominadas" />
    );
    enterViewport();

    const video = container.querySelector("video");
    expect(video).not.toBeNull();

    fireEvent.error(video!);

    expect(container.querySelector("video")).toBeNull();
    expect(screen.getByRole("img", { name: "Dominadas" })).toBeInTheDocument();
  });
});

describe("VideoPlayer — defaults", () => {
  it("applies autoplay, muted and loop by default", () => {
    render(<VideoPlayer src="/exercises/pull-ups.mp4" alt="Dominadas" />);
    enterViewport();

    const video = screen.getByLabelText("Dominadas") as HTMLVideoElement;
    expect(video.autoplay).toBe(true);
    expect(video.muted).toBe(true);
    expect(video.loop).toBe(true);
  });

  it("renders a manual play button with aria-label='Reproducir'", () => {
    render(<VideoPlayer src="/exercises/pull-ups.mp4" alt="Dominadas" />);
    enterViewport();

    expect(screen.getByRole("button", { name: "Reproducir" })).toBeInTheDocument();
  });

  it("calls video.play() when the manual play button is clicked", () => {
    render(<VideoPlayer src="/exercises/pull-ups.mp4" alt="Dominadas" />);
    enterViewport();

    const video = screen.getByLabelText("Dominadas") as HTMLVideoElement;
    fireEvent.click(screen.getByRole("button", { name: "Reproducir" }));
    expect(video.play).toHaveBeenCalled();
  });
});

describe("VideoPlayer — reduced motion", () => {
  it("does NOT render <video> when prefers-reduced-motion: reduce", () => {
    vi.spyOn(window, "matchMedia").mockImplementation(
      (query: string) =>
        ({
          matches: true,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }) as MediaQueryList
    );

    const { container } = render(
      <VideoPlayer src="/exercises/pull-ups.mp4" alt="Dominadas" />
    );
    enterViewport();

    expect(container.querySelector("video")).toBeNull();
    expect(screen.getByRole("img", { name: "Dominadas" })).toBeInTheDocument();
  });
});
