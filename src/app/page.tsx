import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center gap-8 p-4 text-center">
      <div>
        <h1 className="text-5xl md:text-7xl font-black text-white">GYMTIMER</h1>
        <p className="text-gray-400 text-lg mt-2">
          Tu entrenamiento. Tu ritmo. Tu tiempo.
        </p>
      </div>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link href="/app/workouts/new">
          <Button size="lg" className="w-full">
            CREAR ENTRENAMIENTO
          </Button>
        </Link>
        <Link href="/app">
          <Button size="lg" variant="secondary" className="w-full">
            IR AL DASHBOARD
          </Button>
        </Link>
        <Link href="/display">
          <Button size="lg" variant="secondary" className="w-full">
            ABRIR PANTALLA
          </Button>
        </Link>
      </div>
    </div>
  );
}
