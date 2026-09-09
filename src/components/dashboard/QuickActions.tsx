import Link from "next/link";
import type { Workout } from "@/types";
import { Button } from "@/components/ui/Button";

interface QuickActionsProps {
  workoutOfTheDay: Workout | null;
}

export function QuickActions({ workoutOfTheDay }: QuickActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link href="/app/workouts/new">
        <Button size="md">+ Nueva rutina</Button>
      </Link>
      <Link href="/display">
        <Button size="md" variant="secondary">
          📺 Abrir Display
        </Button>
      </Link>
      {workoutOfTheDay && (
        <Link href={`/app/workouts/${workoutOfTheDay.id}/run`}>
          <Button size="md" variant="secondary">
            ▶ Continuar {workoutOfTheDay.name}
          </Button>
        </Link>
      )}
    </div>
  );
}
