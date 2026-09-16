import { useEffect, useRef, useState } from "react";
import type { SessionState, WorkoutPhase } from "@/types";
import { formatTimeInput } from "@/lib/workout/formatTimeInput";
import { deriveCurrentExercise } from "@/lib/workout/deriveCurrentExercise";
import { formatExerciseLine } from "@/lib/workout/formatExerciseLine";

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
// Priority: Document PiP (desktop Chromium, iframe to the trainer-side
// mirror `/display/{code}?view=run`) > WebKit video PiP > video
// requestPictureInPicture.
//
// Mobile reality (2026):
// - The stream MUST carry an audio track or neither OS floats it on
//   background: iOS auto-PiP and Android's backgrounding heuristics treat a
//   silent video as dead playback. We attach a silent audio track (gain 0).
// - iOS: feature-detect via webkitSupportsPresentationMode and NOT via
//   `requestPictureInPicture in HTMLVideoElement.prototype` — Safari exposes
//   the standard API but it rejects there, and it LIES in standalone PWAs
//   (Home Screen): webkitSupportsPresentationMode("picture-in-picture")
//   returns false while pictureInPictureEnabled still reports true. In that
//   container PiP is simply broken (WebKit Bug 303885), so the button hides.
// - Android Chromium (134+): `autoPictureInPicture` makes the browser enter
//   PiP itself when the tab is hidden — no user activation needed, which is
//   why the old visibilitychange→requestPictureInPicture() path was rejected.

const W = 640;
const H = 360;

type PiPMode = "document" | "video" | "webkit" | null;

interface WebkitVideo extends HTMLVideoElement {
  webkitSupportsPresentationMode?: (mode: string) => boolean;
  webkitSetPresentationMode?: (mode: string) => void;
  webkitPresentationMode?: string;
}

type AutoPipVideo = HTMLVideoElement & { autoPictureInPicture?: boolean };

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

function clipText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let clipped = text;
  while (clipped.length > 1 && ctx.measureText(clipped + "…").width > maxWidth) {
    clipped = clipped.slice(0, -1);
  }
  return clipped + "…";
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

  if (state.totalRounds > 1) {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "600 18px system-ui";
    ctx.fillStyle = c.ready;
    ctx.fillText(`RONDA ${state.currentRound}/${state.totalRounds}`, W / 2, 64);
  }

  const isCountup = state.timer.mode === "countup";
  const ms = isCountup ? state.timer.elapsedMs : Math.max(0, state.timer.remainingMs);
  const text = formatTimeInput(ms);
  ctx.fillStyle = phaseColor(state.currentPhase);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const fit = Math.min(124, Math.floor((W * 0.9) / Math.max(4, text.length * 0.58)));
  ctx.font = `700 ${fit}px system-ui`;
  ctx.fillText(text, W / 2, H / 2 + 4);

  // Echo the /run trainer line: current movement, and the next station when
  // there is one. deriveCurrentExercise hides the line on rest/wait/finished
  // and RM/rest/countdown blocks, matching the run-page banner.
  const block = state.workout.blocks[state.currentBlockIndex];
  const derived = deriveCurrentExercise({
    block,
    currentRound: state.currentRound,
    currentExerciseIndex: state.currentExerciseIndex,
    status: state.status,
    phase: state.currentPhase,
  });
  if (derived.visible && derived.current && block) {
    ctx.font = "600 24px system-ui";
    ctx.fillStyle = c.phosphor;
    const line = formatExerciseLine(derived.current, { block, round: state.currentRound });
    ctx.fillText(clipText(ctx, line, W - 56), W / 2, H - 100);
    if (derived.next) {
      ctx.font = "500 16px system-ui";
      ctx.fillStyle = c.dim;
      const nextLine = "SIGUE: " + formatExerciseLine(derived.next, { block, round: state.currentRound });
      ctx.fillText(clipText(ctx, nextLine, W - 56), W / 2, H - 70);
    }
  }

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
  const probe = document.createElement("video") as WebkitVideo;
  if (typeof probe.webkitSupportsPresentationMode === "function") {
    // The ONLY truthful signal on iOS. The standard requestPictureInPicture
    // rejects there, and pictureInPictureEnabled reports true in standalone
    // PWAs where PiP is outright broken (WebKit Bug 303885) — so when the
    // WebKit probe says "not supported", trust it and hide the button.
    return probe.webkitSupportsPresentationMode("picture-in-picture") ? "webkit" : null;
  }
  if ("requestPictureInPicture" in HTMLVideoElement.prototype) return "video";
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
    let audioCtx: AudioContext | null = null;
    let osc: OscillatorNode | null = null;
    let stopped = false;
    const start = async () => {
      const track = streamRef.current ? streamRef.current.getVideoTracks()[0] : null;
      if (streamRef.current && track) {
        // already running — just resume playback if something paused it
        await video.play().catch(() => {});
        return;
      }
      try {
        stream = canvas.captureStream(15);
        if (stopped) return;
        // PiP on mobile only floats media with audio. Attach a silent audio
        // track (oscillator into a MediaStreamDestination, gain 0) so the OS
        // treats the stream as active playback while making no sound.
        try {
          audioCtx = new AudioContext();
          const dest = audioCtx.createMediaStreamDestination();
          osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          gain.gain.value = 0;
          osc.connect(gain);
          gain.connect(dest);
          osc.start();
          stream.addTrack(dest.stream.getAudioTracks()[0]);
        } catch {
          // audio is a bonus; the video track alone still works on Chromium
        }
        streamRef.current = stream;
        video.srcObject = stream;
        video.width = W;
        video.height = H;
        video.muted = true;
        video.playsInline = true;
        video.setAttribute("playsinline", "");
        // Chromium 134+: hiding the tab makes the browser enter PiP itself, no
        // user activation required. This is the actual "minimizo y queda
        // flotando" on Android (and newer iOS Safari handles webkit mode in
        // the visibilitychange below).
        (video as AutoPipVideo).autoPictureInPicture = true;
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
        osc?.stop();
        void audioCtx?.close();
      }
    };
  }, [mode, state.status]);

  // Enter PiP in the background (trainer switches apps with /run active).
  // Chromium 134+ is handled by autoPictureInPicture above; WebKit still
  // needs an explicit call, and it rejects without the playing audio track.
  useEffect(() => {
    if (!mode || mode === "document") return;
    const onVis = () => {
      if (!document.hidden || activeRef.current) return;
      const video = videoRef.current as WebkitVideo;
      if (!video) return;
      if (mode === "webkit") {
        video.webkitSetPresentationMode?.("picture-in-picture");
      } else if (mode === "video") {
        video.requestPictureInPicture().catch(() => {});
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
    // The mini window embeds the trainer-side mirror of the live session
    // (same Pusher channel as the TV, but framed like the /run screen), so it
    // stays live and self-correcting without duplicating timer logic.
    const iframe = pip.document.createElement("iframe");
    iframe.src = `/display/${code}?view=run`;
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
      <div className="pointer-events-none fixed -left-[9999px] top-0 size-[2px] overflow-hidden opacity-[0.01]" aria-hidden="true">
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