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
          INICIAR
        </Button>
      ) : status === "running" ? (
        <Button size="lg" className="col-span-2" onClick={onPause}>
          PAUSAR
        </Button>
      ) : (
        <Button size="lg" className="col-span-2" onClick={onResume}>
          REANUDAR
        </Button>
      )}
      <Button size="md" variant="secondary" onClick={onPrevious}>
        ◀ ANTERIOR
      </Button>
      <Button size="md" variant="secondary" onClick={onNext}>
        SIGUIENTE ▶
      </Button>
      <Button size="md" variant="secondary" onClick={onSubtractTime}>
        -10 SEG
      </Button>
      <Button size="md" variant="secondary" onClick={onAddTime}>
        +10 SEG
      </Button>
      <Button size="md" variant="danger" className="col-span-2" onClick={onReset}>
        REINICIAR
      </Button>
    </div>
  );
}
