import type { WorkoutPhase } from "@/types";

interface TimerDisplayProps {
  remainingMs: number;
  elapsedMs: number;
  mode: "countdown" | "countup";
  // When the engine is in getReady, PhaseIndicator already paints the
  // giant 3-2-1 countdown; rendering TimerDisplay here too stacks two
  // huge numbers on top of each other. Hiding the timer during the
  // preroll keeps a single visual anchor.
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

export function TimerDisplay({ remainingMs, elapsedMs, mode, phase }: TimerDisplayProps) {
  if (phase === "getReady") return null;
  const value = mode === "countdown" ? remainingMs : elapsedMs;
  return (
    <p className="font-industrial tabular-nums text-phosphor text-center leading-none tracking-tight text-[clamp(4rem,17vw,14rem)]">
      {formatTime(value)}
    </p>
  );
}
