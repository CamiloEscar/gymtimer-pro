interface TimerProgressBarProps {
  mode: "countdown" | "countup";
  elapsedMs: number;
  durationMs: number;
}

export function TimerProgressBar({ mode, elapsedMs, durationMs }: TimerProgressBarProps) {
  if (mode !== "countdown") return null;
  const progress = durationMs > 0 ? Math.min(1, Math.max(0, elapsedMs / durationMs)) : 0;
  return (
    <div className="w-full max-w-md h-1 bg-surface-800">
      <div
        data-testid="timer-progress-bar"
        className="h-full bg-phosphor"
        style={{ width: `${progress * 100}%` }}
      />
    </div>
  );
}