import { useEffect, useRef, useState } from "react";
import type { SessionState, WorkoutPhase } from "@/types";
import { formatTimeInput } from "@/lib/workout/formatTimeInput";

// Floating mini timer ("like YouTube / Twitch") while the session runs.
//
// iOS Safari has NO Document Picture-in-Picture, so arbitrary DOM can't float
// there. The portable path is the classic media trick: draw the timer into a
// <canvas>, pipe it into a playing <video> via canvas.captureStream(), then
// enter PiP on that video (webkitSetPresentationMode on iOS/WebKit,
// requestPictureInPicture on Chromium mobile). A playing, PiP-eligible video
// is ALSO what lets iOS auto-float it when the user backgrounds the app —
// the actual "minimizo /run y queda flotando" behavior.
//
// Priority: Document PiP (desktop Chromium, iframe to the real /display
// mirror) > video requestPictureInPicture > WebKit video PiP. Feature-detect
// only; the button simply doesn't exist where no API is present.

const W = 640;
const H = 360;

type PiPMode = "document" | "video" | "webkit" | null;

interface WebkitVideo extends HTMLVideoElement {
  webkitSupportsPresentationMode?: (mode: string) => boolean;
  webkitSetPresentationMode?: (mode: string) => void;
  webkitPresentationMode?: string;
}

const OKLCH_RE = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)$/i;

// OKLCH -> sRGB hex. canvas fillStyle technically accepts CSS Color 4 strings
// on modern engines, but hex is deterministic everywhere, so no surprises on
// older WebKit that silently ignores unknown colors (black-on-black).
function oklchToHex(L: number, C: number, Hdeg: number): string {
  const a = C * Math.cos((Hdeg * Math.PI) / 180);
  const b = C * Math.sin((Hdeg * Math.PI) / 180);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = Math.pow(l_, 3);
  const m = Math.pow(m_, 3);
  const s = Math.pow(s_, 3);
  const [r, g, bl] = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  const clamp = (x: number) => Math.max(0, Math.min(255, Math.round(x * 255)));
  return `#${[r, g, bl].map(clamp).map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

function cssToken(name: string): string {
  if (typeof document === "undefined") return "";
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

const themeHex = (token: string, fallback: string): string => {
  const m = token.match(OKLCH_RE);
  if (m) return oklchToHex(parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3]));
  return fallback;
};

interface Theme {
  bg: string;
  phosphor: string;
  dim: string;
  brand: string;
  danger: string;
  ready: string;
}

let cachedTheme: Theme | null = null;
function colors(): Theme {
  if (!cachedTheme) {
    cachedTheme = {
      bg: themeHex(cssToken("--color-surface-950"), "#141414"),
      phosphor: themeHex(cssToken("--color-phosphor"), "#f1f1f1"),
      dim: themeHex(cssToken("--color-phosphor-dim"), "#b8b8b8"),
      brand: themeHex(cssToken("--color-brand-500"), "#27d37e"),
      danger: themeHex(cssToken("--color-danger-500"), "#f0443c"),
      ready: themeHex(cssToken("--color-phase-ready"), "#e7c85a"),
    };
  }
  return cachedTheme;
}

const PHASE_LABEL: Record<WorkoutPhase, string> = {
  getReady: "PREPARATE",
  work: "TRABAJO",
  rest: "DESCANSO",
  wait: "ESPERA",
  finished: "TERMINADO",
};

function phaseColor(phase: WorkoutPhase): string {
  const c = colors();
  switch (phase) {
    case "getReady":
      return c.ready;
    case "rest":
      return c.danger;
    case "wait":
      return c.dim;
    case "finished":
      return c.brand;
    default:
      return c.phosphor;
  }
}

function drawTimer(ctx: CanvasRenderingContext2D, state: SessionState): void {
  const c = colors();
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = phaseColor(state.currentPhase);
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.font = "700 26px system-ui";
  ctx.fillText(PHASE_LABEL[state.currentPhase], 28, 22);

  const isCountup = state.timer.mode === "countup";
  const ms = isCountup ? state.timer.elapsedMs : Math.max(0, state.timer.remainingMs);
  const text = formatTimeInput(ms);
  ctx.fillStyle = phaseColor(state.currentPhase);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const fit = Math.min(150, Math.floor((W * 0.9) / Math.max(4, text.length * 0.58)));
  ctx.font = `700 ${fit}px system-ui`;
  ctx.fillText(text, W / 2, H / 2 + 6);

  ctx.textBaseline = "middle";
  ctx.font = "500 20px system-ui";
  ctx.fillStyle = c.dim;
  ctx.fillText(state.status.toUpperCase(), W / 2, H / 2 + 74);

  const dur = state.timer.durationMs || 0;
  const pct =
    dur > 0 ? Math.max(0, Math.min(1, (isCountup ? state.timer.elapsedMs : state.timer.remainingMs) / dur)) : 0;
  const barX = 28;
  const barW = W - 56;
  const barY = H - 34;
  const barH = 8;
  ctx.fillStyle = c.dim;
  ctx.fillRect(barX, barY, barW, barH);
  ctx.fillStyle = c.brand;
  ctx.fillRect(barX, barY, Math.max(0, barW * pct), barH);
}

function detectPipMode(): PiPMode {
  if (typeof window === "undefined") return null;
  if ("documentPictureInPicture" in window) return "document";
  if ("requestPictureInPicture" in HTMLVideoElement.prototype) return "video";
  const probe = document.createElement("video") as WebkitVideo;
  if (
    typeof probe.webkitSupportsPresentationMode === "function" &&
    probe.webkitSupportsPresentationMode("picture-in-picture")
  ) {
    return "webkit";
  }
  return null;
}

interface MiniDisplayProps {
  state: SessionState;
  code: string;
}

export function MiniDisplay({ state, code }: MiniDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<WebkitVideo>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  });

  const [mode] = useState<PiPMode>(detectPipMode);
  const [active, setActive] = useState(false);
  const activeRef = useRef(false);

  const setPip = (next: boolean) => {
    activeRef.current = next;
    setActive(next);
  };

  // Live capture stream: while any PiP-capable mode exists, keep the hidden
  // video feeding frames from the canvas so the OS can float it (iOS auto-PiP
  // on background) or the button can enter it on demand. Starts only when the
  // session is actually underway.
  useEffect(() => {
    if (!mode || mode === "document") return;
    if (state.status !== "running" && state.status !== "paused") return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !video || !ctx) return;

    let stream: MediaStream | null = null;
    let stopped = false;
    const start = async () => {
      const track = streamRef.current ? streamRef.current.getVideoTracks()[0] : null;
      if (streamRef.current && track) {
        // already running — just resume playback if something paused it
        await video.play().catch(() => {});
        return;
      }
      try {
        stream = canvas.captureStream(0);
        if (stopped) return;
        streamRef.current = stream;
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        video.setAttribute("playsinline", "");
        await video.play();
        if (stopped) {
          streamRef.current = null;
          stream.getTracks().forEach((t) => t.stop());
        }
      } catch {
        streamRef.current = null;
      }
    };
    void start();

    const tick = () => {
      drawTimer(ctx, stateRef.current);
      const t = streamRef.current?.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack | undefined;
      t?.requestFrame?.();
    };
    tick();
    const id = window.setInterval(tick, 250);

    return () => {
      if (!stopped) {
        stopped = true;
        window.clearInterval(id);
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [mode, state.status]);

  // Enter PiP in the background (trainer switches apps with /run active).
  // Best-effort: Chromium needs a user gesture for requestPictureInPicture,
  // but WebKit iOS floats the playing video itself — this handler is the
  // belt to iOS's own suspenders.
  useEffect(() => {
    if (!mode || mode === "document") return;
    const onVis = () => {
      if (!document.hidden || activeRef.current) return;
      const video = videoRef.current;
      if (!video) return;
      if (mode === "video") {
        video.requestPictureInPicture().catch(() => {});
      } else if (mode === "webkit") {
        video.webkitSetPresentationMode?.("picture-in-picture");
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [mode]);

  // Track enter/leave PiP so the button stays truthful.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !mode || mode === "document") return;
    const onEnter = () => setPip(true);
    const onLeave = () => setPip(false);
    const onWebkitMode = () => {
      const v = video as WebkitVideo;
      setPip(v.webkitPresentationMode === "picture-in-picture");
    };
    video.addEventListener("enterpictureinpicture", onEnter);
    video.addEventListener("leavepictureinpicture", onLeave);
    video.addEventListener("webkitpresentationmodechanged", onWebkitMode);
    return () => {
      video.removeEventListener("enterpictureinpicture", onEnter);
      video.removeEventListener("leavepictureinpicture", onLeave);
      video.removeEventListener("webkitpresentationmodechanged", onWebkitMode);
    };
  }, [mode]);

  async function openDocumentPip() {
    const docPip = (window as unknown as {
      documentPictureInPicture?: {
        requestWindow: (options: { width: number; height: number }) => Promise<Window>;
      };
    }).documentPictureInPicture;
    if (!docPip || !code.trim()) return;
    const pip = await docPip.requestWindow({ width: 480, height: 320 });
    // The mini window embeds the real /display mirror (own Pusher channel),
    // so it stays live and self-correcting without duplicating timer logic.
    const iframe = pip.document.createElement("iframe");
    iframe.src = `/display/${code}`;
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "0";
    iframe.style.display = "block";
    pip.document.body.style.margin = "0";
    pip.document.body.style.overflow = "hidden";
    pip.document.body.appendChild(iframe);
    setPip(true);
    pip.addEventListener("pagehide", () => setPip(false));
  }

  async function toggle() {
    if (!mode) return;
    if (activeRef.current) {
      const video = videoRef.current;
      if (mode === "video") {
        video?.requestPictureInPicture().then(() => document.exitPictureInPicture()).catch(() => {});
      } else if (mode === "webkit" && video) {
        (video as WebkitVideo).webkitSetPresentationMode?.("inline");
      } else if (mode === "document") {
        setPip(false);
      }
      return;
    }
    if (mode === "document") {
      await openDocumentPip();
      return;
    }
    const video = videoRef.current;
    if (!video) return;
    if (mode === "video") {
      video.requestPictureInPicture().catch(() => {});
    } else if (mode === "webkit") {
      video.webkitSetPresentationMode?.("picture-in-picture");
      setPip((video as WebkitVideo).webkitPresentationMode === "picture-in-picture");
    }
  }

  return (
    <>
      <div className="pointer-events-none fixed h-px w-px overflow-hidden opacity-0" aria-hidden="true">
        <canvas ref={canvasRef} width={W} height={H} />
        <video ref={videoRef} muted playsInline />
      </div>
      {mode && (
        <button
          type="button"
          onClick={() => void toggle()}
          aria-label={active ? "Cerrar mini ventana" : "Abrir mini ventana del display"}
          className="text-[10px] uppercase tracking-widest text-phosphor-muted hover:text-brand-500 active:scale-95 transition-colors cursor-pointer"
        >
          {active ? "Cerrar mini" : "Mini pantalla"}
        </button>
      )}
    </>
  );
}