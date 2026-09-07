import { WorkoutBuilder } from "@/components/workout/WorkoutBuilder";

interface NewWorkoutPageProps {
  searchParams: Promise<{ code?: string }>;
}

export default async function NewWorkoutPage({ searchParams }: NewWorkoutPageProps) {
  const { code } = await searchParams;
  return <WorkoutBuilder code={code} />;
}
