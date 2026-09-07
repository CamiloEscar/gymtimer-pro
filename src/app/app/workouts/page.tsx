import Link from "next/link";
import { WorkoutList } from "@/components/workout/WorkoutList";
import { Button } from "@/components/ui/Button";

interface WorkoutsPageProps {
  searchParams: Promise<{ code?: string }>;
}

export default async function WorkoutsPage({ searchParams }: WorkoutsPageProps) {
  const { code } = await searchParams;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between p-4">
        <h1 className="text-xl font-bold text-white">Entrenamientos</h1>
        <Link href={code ? `/app/workouts/new?code=${code}` : "/app/workouts/new"}>
          <Button>+ Nuevo entrenamiento</Button>
        </Link>
      </div>
      {code && (
        <p className="px-4 pb-2 text-xs uppercase tracking-widest text-brand-500">
          [ CONECTANDO A PANTALLA: {code} ]
        </p>
      )}
      <WorkoutList code={code} />
    </div>
  );
}
