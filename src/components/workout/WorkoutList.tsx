"use client";

import { useEffect, useState } from "react";
import type { Workout } from "@/types";
import { LocalWorkoutRepository } from "@/lib/storage/LocalWorkoutRepository";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { WorkoutCard } from "./WorkoutCard";

interface WorkoutListProps {
  code?: string;
}

export function WorkoutList({ code }: WorkoutListProps) {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [pendingDelete, setPendingDelete] = useState<Workout | null>(null);
  const repo = new LocalWorkoutRepository();

  function reload() {
    const result = repo.list();
    setWorkouts(result.ok ? result.value : []);
  }

  useEffect(() => {
    reload();
  }, []);

  function confirmDelete() {
    if (!pendingDelete) return;
    repo.delete(pendingDelete.id);
    setPendingDelete(null);
    reload();
  }

  if (workouts.length === 0) {
    return <p className="text-phosphor-dim p-4">Todavía no hay entrenamientos. Creá el primero.</p>;
  }

  return (
    <div className="space-y-3 p-4">
      {workouts.map((workout) => (
        <WorkoutCard
          key={workout.id}
          workout={workout}
          code={code}
          onDuplicate={(id) => {
            repo.duplicate(id);
            reload();
          }}
          onDelete={() => setPendingDelete(workout)}
        />
      ))}
      <Modal
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        title={`¿Eliminar '${pendingDelete?.name ?? ""}'?`}
      >
        <p className="text-phosphor-dim mb-4">Esta acción no se puede deshacer.</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setPendingDelete(null)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Eliminar
          </Button>
        </div>
      </Modal>
    </div>
  );
}
