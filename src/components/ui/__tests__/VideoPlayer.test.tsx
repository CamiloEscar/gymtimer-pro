import { describe, it, expect, vi, beforeEach } from "vitest";
import type { RefObject } from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { VideoPlayer, type VideoPlayerHandle } from "../VideoPlayer";

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

describe("VideoPlayer — YouTube", () => {
  it.each([
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://youtu.be/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/embed/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/shorts/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://m.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"],
  ])("renders an <iframe> embed for %s", (url) => {
    const { container } = render(<VideoPlayer src={url} alt="Demo" />);
    enterViewport();
    const iframe = screen.getByTestId("video-player-iframe");
    expect(iframe.tagName).toBe("IFRAME");
    expect(iframe.getAttribute("src")).toContain("/embed/dQw4w9WgXcQ");
    expect(iframe.getAttribute("title")).toBe("Demo");
    expect(container.querySelector("video")).toBeNull();
  });

  it("does NOT render the iframe until the element enters the viewport", () => {
    render(<VideoPlayer src="https://youtu.be/dQw4w9WgXcQ" alt="Demo" />);
    expect(screen.queryByTestId("video-player-iframe")).not.toBeInTheDocument();
    enterViewport();
    expect(screen.getByTestId("video-player-iframe")).toBeInTheDocument();
  });

  it("passes autoplay, muted, loop and playlist params to YouTube", () => {
    render(<VideoPlayer src="https://youtu.be/dQw4w9WgXcQ" alt="Demo" />);
    enterViewport();
    const src = screen.getByTestId("video-player-iframe").getAttribute("src") ?? "";
    expect(src).toContain("autoplay=1");
    expect(src).toContain("mute=1");
    expect(src).toContain("loop=1");
    expect(src).toContain("playlist=dQw4w9WgXcQ");
  });

  it("returns null from getYouTubeId for non-YouTube URLs", async () => {
    const { getYouTubeId } = await import("../VideoPlayer");
    expect(getYouTubeId("/videos/sample.mp4")).toBeNull();
    expect(getYouTubeId("https://example.com/video.mp4")).toBeNull();
    expect(getYouTubeId("not a url")).toBeNull();
  });

  it("includes enablejsapi=1 so the iframe accepts pause/play commands", () => {
    render(<VideoPlayer src="https://youtu.be/dQw4w9WgXcQ" alt="Demo" />);
    enterViewport();
    const src = screen.getByTestId("video-player-iframe").getAttribute("src") ?? "";
    expect(src).toContain("enablejsapi=1");
  });
});

describe("VideoPlayer — imperative handle", () => {
  function makeRef(): RefObject<VideoPlayerHandle | null> {
    return { current: null };
  }

  it("pause() calls videoRef.pause() for a direct video element", () => {
    const ref = makeRef();
    const videoPauseSpy = vi.fn();
    const originalPause = HTMLMediaElement.prototype.pause;
    HTMLMediaElement.prototype.pause = videoPauseSpy;
    try {
      render(<VideoPlayer ref={ref} src="/exercises/pull-ups.mp4" alt="Dominadas" />);
      enterViewport();
      ref.current?.pause();
      expect(videoPauseSpy).toHaveBeenCalled();
    } finally {
      HTMLMediaElement.prototype.pause = originalPause;
    }
  });

  it("play() calls videoRef.play() for a direct video element", () => {
    const ref = makeRef();
    render(<VideoPlayer ref={ref} src="/exercises/pull-ups.mp4" alt="Dominadas" />);
    enterViewport();
    ref.current?.play();
    const video = screen.getByLabelText("Dominadas") as HTMLVideoElement;
    expect(video.play).toHaveBeenCalled();
  });

  it("pause()/play() are callable on the iframe ref without throwing", () => {
    const ref = makeRef();
    render(<VideoPlayer ref={ref} src="https://youtu.be/dQw4w9WgXcQ" alt="Demo" />);
    enterViewport();
    // jsdom's iframe.contentWindow.postMessage is a no-op stub; we just
    // verify the imperative methods exist and run without throwing so the
    // DisplayScreen useEffect wiring stays safe.
    expect(() => ref.current?.pause()).not.toThrow();
    expect(() => ref.current?.play()).not.toThrow();
  });
});
