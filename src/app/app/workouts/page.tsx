import Link from "next/link";
import { WorkoutList } from "@/components/workout/WorkoutList";
import { Button } from "@/components/ui/Button";

export default function WorkoutsPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between p-4">
        <h1 className="text-xl font-bold text-white">Workouts</h1>
        <Link href="/app/workouts/new">
          <Button>+ New workout</Button>
        </Link>
      </div>
      <WorkoutList />
    </div>
  );
}
