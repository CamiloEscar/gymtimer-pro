import Link from "next/link";
import type { Workout } from "@/types";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

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
          <Icon name="display" />
          Abrir Display
        </Button>
      </Link>
      {workoutOfTheDay && (
        <Link href={`/app/workouts/${workoutOfTheDay.id}/run`}>
          <Button size="md" variant="secondary">
            <Icon name="play" />
            Continuar {workoutOfTheDay.name}
          </Button>
        </Link>
      )}
    </div>
  );
}
