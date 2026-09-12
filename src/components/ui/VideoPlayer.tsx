"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Image from "next/image";
import { Icon } from "./Icon";

interface VideoPlayerProps {
  src: string;
  thumbnailSrc?: string;
  alt: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  lazy?: boolean;
  rounded?: boolean;
}

export interface VideoPlayerHandle {
  pause(): void;
  play(): void;
  // TVs sometimes drop the first autoplay attempt (browser autoplay
  // quirks, race with hydration, network stall). Re-issue the play call
  // without surfacing an error so the caller can wire it up to a
  // retry loop on phase transitions.
  retryPlay(): void;
}

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(callback: () => void) {
  const mq = window.matchMedia(REDUCED_MOTION_QUERY);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getReducedMotionSnapshot() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );
}

export function getYouTubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = parsed.pathname.slice(1);
      return id || null;
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (parsed.pathname === "/watch") {
        const id = parsed.searchParams.get("v");
        return id || null;
      }
      const match = parsed.pathname.match(/^\/(embed|v|shorts)\/([\w-]+)/);
      if (match) return match[2];
    }
    return null;
  } catch {
    return null;
  }
}

export const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(
  function VideoPlayer(
    {
      src,
      thumbnailSrc,
      alt,
      className = "",
      autoPlay = true,
      muted = true,
      loop = true,
      lazy = true,
      rounded = false,
    },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const [inView, setInView] = useState(!lazy);
    const [error, setError] = useState(false);
    const reducedMotion = usePrefersReducedMotion();
    const youTubeId = getYouTubeId(src);

    useEffect(() => {
      if (!lazy) return;
      if (reducedMotion || !containerRef.current) return;

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            setInView(true);
            observer.disconnect();
          }
        },
        { rootMargin: "200px" }
      );
      observer.observe(containerRef.current);

      return () => observer.disconnect();
    }, [lazy, reducedMotion]);

    useImperativeHandle(
      ref,
      () => ({
        pause() {
          if (youTubeId) {
            iframeRef.current?.contentWindow?.postMessage(
              JSON.stringify({ event: "command", func: "pauseVideo" }),
              "*"
            );
            return;
          }
          videoRef.current?.pause();
        },
        play() {
          if (youTubeId) {
            iframeRef.current?.contentWindow?.postMessage(
              JSON.stringify({ event: "command", func: "playVideo" }),
              "*"
            );
            return;
          }
          videoRef.current?.play().catch(() => {});
        },
        retryPlay() {
          if (youTubeId) {
            iframeRef.current?.contentWindow?.postMessage(
              JSON.stringify({ event: "command", func: "playVideo" }),
              "*"
            );
            return;
          }
          videoRef.current?.play().catch(() => {});
        },
      }),
      [youTubeId]
    );

    const showVideo = inView && !error && !reducedMotion;

    return (
      <div
        ref={containerRef}
        className={`relative w-full aspect-video bg-surface-900 overflow-hidden ${
          rounded ? "rounded-lg" : ""
        } ${className}`}
      >
        {error ? (
          <Fallback ariaLabel={alt} />
        ) : youTubeId ? (
          showVideo ? (
            <iframe
              ref={iframeRef}
              data-testid="video-player-iframe"
              src={`https://www.youtube.com/embed/${youTubeId}?autoplay=${
                autoPlay ? 1 : 0
              }&mute=${muted ? 1 : 0}&loop=${
                loop ? 1 : 0
              }${loop ? `&playlist=${youTubeId}` : ""}&playsinline=1&controls=0&rel=0&enablejsapi=1`}
              title={alt}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 size-full border-0"
            />
          ) : (
            <Fallback ariaLabel={alt} />
          )
        ) : !showVideo ? (
          thumbnailSrc ? (
            <Image
              src={thumbnailSrc}
              alt={alt}
              role="img"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          ) : (
            <Fallback ariaLabel={alt} />
          )
        ) : (
          <>
            <video
              ref={videoRef}
              src={src}
              autoPlay={autoPlay}
              muted={muted}
              loop={loop}
              playsInline
              preload="metadata"
              poster={thumbnailSrc}
              aria-label={alt}
              onError={() => setError(true)}
              className="absolute inset-0 size-full object-cover"
            />
            <button
              type="button"
              aria-label="Reproducir"
              onClick={() => {
                videoRef.current?.play().catch(() => {});
              }}
              className="absolute bottom-3 right-3 size-11 rounded-full bg-brand-500/90 text-black flex items-center justify-center hover:bg-brand-500 transition-colors"
            >
              <Icon name="play" className="size-5" />
            </button>
          </>
        )}
      </div>
    );
  }
);

function Fallback({ ariaLabel }: { ariaLabel: string }) {
  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{
        backgroundImage:
          "radial-gradient(circle at 85% 15%, oklch(0.7 0.19 150 / 0.12), transparent 55%), radial-gradient(circle at 80% 90%, oklch(0.82 0.16 90 / 0.07), transparent 60%)",
      }}
    >
      <Icon name="dumbbell" className="size-16 text-phosphor-muted" />
    </div>
  );
}
