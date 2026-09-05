"use client";

import Link from "next/link";
import type { Workout } from "@/types";

interface RecentWorkoutsProps {
  workouts: Workout[];
}

export function RecentWorkouts({ workouts }: RecentWorkoutsProps) {
  const recent = [...workouts]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  if (recent.length === 0) return null;

  return (
    <div className="space-y-2">
      <h2 className="text-white font-semibold">Recent workouts</h2>
      <ul className="space-y-1">
        {recent.map((workout) => (
          <li key={workout.id}>
            <Link href={`/app/workouts/${workout.id}/run`} className="text-brand-500 hover:underline">
              {workout.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
