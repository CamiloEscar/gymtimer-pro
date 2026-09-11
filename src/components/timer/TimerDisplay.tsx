interface TimerDisplayProps {
  remainingMs: number;
  elapsedMs: number;
  mode: "countdown" | "countup";
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

export function TimerDisplay({ remainingMs, elapsedMs, mode }: TimerDisplayProps) {
  const value = mode === "countdown" ? remainingMs : elapsedMs;
  return (
    <p className="font-industrial tabular-nums text-phosphor text-center leading-none tracking-tight text-[clamp(6rem,20vw,16rem)]">
      {formatTime(value)}
    </p>
  );
}
