import { ExerciseLibrary } from "@/components/library/ExerciseLibrary";

export default function ExercisesPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-xl font-bold text-phosphor p-4">Ejercicios</h1>
      <ExerciseLibrary />
    </div>
  );
}