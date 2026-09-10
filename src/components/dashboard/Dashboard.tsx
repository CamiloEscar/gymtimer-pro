"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Workout } from "@/types";
import { LocalWorkoutRepository } from "@/lib/storage/LocalWorkoutRepository";
import { WorkoutHistoryRepository } from "@/lib/storage/WorkoutHistoryRepository";
import { computeHistoryStats } from "@/lib/history/computeHistoryStats";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatsRow } from "./StatsRow";
import { QuickActions } from "./QuickActions";
import { WorkoutOfTheDay } from "./WorkoutOfTheDay";
import { RecentWorkouts } from "./RecentWorkouts";

function greeting(hour: number): string {
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

export function Dashboard() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [historyStats, setHistoryStats] = useState(computeHistoryStats([]));
  const [query, setQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Workout | null>(null);
  // Starts null (not computed from Date.now() during render) so the server-
  // rendered markup for this "use client" component never depends on the
  // server's timezone — computed client-side in the effect below instead,
  // avoiding a hydration mismatch against the user's local hour.
  const [greetingText, setGreetingText] = useState<string | null>(null);
  const workoutRepo = useMemo(() => new LocalWorkoutRepository(), []);

  function reload() {
    const result = workoutRepo.list();
    setWorkouts(result.ok ? result.value : []);
    const historyResult = new WorkoutHistoryRepository().list();
    setHistoryStats(computeHistoryStats(historyResult.ok ? historyResult.value : []));
  }

  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps -- localStorage is the source of truth, intentional reload-on-mount; greeting depends on the current hour */
  useEffect(() => {
    reload();
    setGreetingText(greeting(new Date().getHours()));
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

  function confirmDelete() {
    if (!pendingDelete) return;
    workoutRepo.delete(pendingDelete.id);
    setPendingDelete(null);
    reload();
  }

  const workoutOfTheDay = workouts.length > 0 ? workouts[workouts.length - 1] : null;
  const isSearching = query.trim().length > 0;
  const filtered = isSearching
    ? workouts.filter((w) => w.name.toLowerCase().includes(query.trim().toLowerCase()))
    : workouts.filter((w) => w.id !== workoutOfTheDay?.id);

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div>
        <p className="text-brand-500 text-sm uppercase tracking-wide">{greetingText}</p>
        <h1 className="text-2xl font-bold text-phosphor font-industrial">¿Qué entrenamos hoy?</h1>
      </div>

      <StatsRow stats={historyStats} totalRoutines={workouts.length} />

      <QuickActions workoutOfTheDay={workoutOfTheDay} />

      <Input
        placeholder="Buscar entrenamiento..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Buscar entrenamiento"
      />

      {!isSearching && <WorkoutOfTheDay workout={workoutOfTheDay} />}

      {filtered.length === 0 && !isSearching && (
        <Card className="text-center space-y-2">
          <p className="text-phosphor">No tenés rutinas todavía</p>
          <p className="text-sm text-phosphor-dim">
            Empezá creando una — podés armar AMRAP, EMOM, Tabata o cargar desde el catálogo de ejercicios.
          </p>
          <Link href="/app/workouts/new">
            <Button size="md">+ Crear la primera rutina</Button>
          </Link>
        </Card>
      )}

      <RecentWorkouts
        workouts={filtered}
        onDuplicate={(id) => {
          workoutRepo.duplicate(id);
          reload();
        }}
        onDelete={(id) => {
          const workout = workouts.find((w) => w.id === id) ?? null;
          setPendingDelete(workout);
        }}
      />

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
