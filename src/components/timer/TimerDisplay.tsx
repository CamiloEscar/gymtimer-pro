import type { SessionStatus, WorkoutPhase } from "@/types";

interface TimerDisplayProps {
  remainingMs: number;
  elapsedMs: number;
  mode: "countdown" | "countup";
  // Lets the component tell a prepared-but-not-started session apart from a
  // live 3-2-1 preroll: at ready there's no preroll yet, so the full block
  // duration should render for a sanity check (05:00, not a raw 300).
  status?: SessionStatus;
  // During the live getReady countdown PhaseIndicator paints the giant
  // 3-2-1; rendering TimerDisplay too stacks two huge numbers. Optional so
  // callers that only know the phase (tests, etc.) keep working.
  phase?: WorkoutPhase;
}

function formatTime(ms: number): string {
  const sign = ms < 0 ? "-" : "";
  const abs = Math.abs(ms);
  const totalSeconds = Math.ceil(abs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  // Long WODs (Murph, 1h AMRAP, endurance pieces) read better with hours
  // baked in. Short WODs stay compact as MM:SS.
  if (hours > 0) return `${sign}${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  return `${sign}${pad(minutes)}:${pad(seconds)}`;
}

export function TimerDisplay({ remainingMs, elapsedMs, mode, status, phase }: TimerDisplayProps) {
  if (phase === "getReady" && (status === "running" || status === "paused")) return null;
  const value = mode === "countdown" ? remainingMs : elapsedMs;
  return (
    <p className="font-industrial tabular-nums text-phosphor text-center leading-none tracking-tight text-[clamp(4rem,15vw,12rem)]">
      {formatTime(value)}
    </p>
  );
}
