import { Button } from "@/components/ui/Button";

interface TimerControlsProps {
  status: "ready" | "running" | "paused" | "finished" | "waiting";
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onAddTime: () => void;
  onSubtractTime: () => void;
}

export function TimerControls({
  status,
  onStart,
  onPause,
  onResume,
  onReset,
  onNext,
  onPrevious,
  onAddTime,
  onSubtractTime,
}: TimerControlsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 w-full max-w-md mx-auto">
      {status === "ready" || status === "finished" ? (
        <Button size="lg" className="col-span-2" onClick={onStart}>
          START
        </Button>
      ) : status === "running" ? (
        <Button size="lg" className="col-span-2" onClick={onPause}>
          PAUSE
        </Button>
      ) : (
        <Button size="lg" className="col-span-2" onClick={onResume}>
          RESUME
        </Button>
      )}
      <Button size="md" variant="secondary" onClick={onPrevious}>
        ◀ PREVIOUS
      </Button>
      <Button size="md" variant="secondary" onClick={onNext}>
        NEXT ▶
      </Button>
      <Button size="md" variant="secondary" onClick={onSubtractTime}>
        -10 SEC
      </Button>
      <Button size="md" variant="secondary" onClick={onAddTime}>
        +10 SEC
      </Button>
      <Button size="md" variant="danger" className="col-span-2" onClick={onReset}>
        RESET
      </Button>
    </div>
  );
}
