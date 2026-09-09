interface TimerDisplayProps {
  remainingMs: number;
  elapsedMs: number;
  mode: "countdown" | "countup";
}

function formatTime(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function TimerDisplay({ remainingMs, elapsedMs, mode }: TimerDisplayProps) {
  const value = mode === "countdown" ? remainingMs : elapsedMs;
  return (
    <p className="font-industrial tabular-nums text-phosphor text-center leading-none tracking-tight text-[clamp(6rem,20vw,16rem)]">
      {formatTime(value)}
    </p>
  );
}
