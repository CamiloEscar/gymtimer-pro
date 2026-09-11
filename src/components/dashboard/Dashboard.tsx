"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Workout } from "@/types";
import { LocalWorkoutRepository } from "@/lib/storage/LocalWorkoutRepository";
import { WorkoutHistoryRepository } from "@/lib/storage/WorkoutHistoryRepository";
import { computeHistoryStats } from "@/lib/history/computeHistoryStats";
import { useLocalStorageSnapshot, notifyLocalStorageChange } from "@/hooks/useLocalStorageSnapshot";
import { useGymProfile } from "@/hooks/useGymProfile";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { StatsRow } from "./StatsRow";
import { QuickActions } from "./QuickActions";
import { WorkoutOfTheDay } from "./WorkoutOfTheDay";
import { RecentWorkouts } from "./RecentWorkouts";

function greeting(hour: number): string {
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat("es", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

export function Dashboard() {
  const workouts = useLocalStorageSnapshot<Workout[]>(
    "gymtimer.workouts",
    () => {
      const result = new LocalWorkoutRepository().list();
      return result.ok ? result.value : [];
    },
    []
  );
  const historyStats = useLocalStorageSnapshot(
    "gymtimer.history",
    () => {
      const result = new WorkoutHistoryRepository().list();
      return computeHistoryStats(result.ok ? result.value : []);
    },
    computeHistoryStats([])
  );
  const [query, setQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Workout | null>(null);
  // Starts null (not computed from Date.now() during render) so the server-
  // rendered markup for this "use client" component never depends on the
  // server's timezone — computed client-side in the effect below instead,
  // avoiding a hydration mismatch against the user's local hour.
  const [greetingText, setGreetingText] = useState<string | null>(null);
  const [dateText, setDateText] = useState<string | null>(null);
  const gymProfile = useGymProfile();

  /* eslint-disable react-hooks/set-state-in-effect -- client-only greeting, hour must not come from the server */
  useEffect(() => {
    const now = new Date();
    setGreetingText(greeting(now.getHours()));
    setDateText(formatLongDate(now));
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  function confirmDelete() {
    if (!pendingDelete) return;
    new LocalWorkoutRepository().delete(pendingDelete.id);
    setPendingDelete(null);
    notifyLocalStorageChange();
  }

  const workoutOfTheDay = workouts.length > 0 ? workouts[workouts.length - 1] : null;
  const isSearching = query.trim().length > 0;
  const filtered = isSearching
    ? workouts.filter((w) => w.name.toLowerCase().includes(query.trim().toLowerCase()))
    : workouts.filter((w) => w.id !== workoutOfTheDay?.id);

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <header className="relative overflow-hidden rounded-2xl border border-surface-800 bg-surface-900 p-6">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          aria-hidden
          style={{
            backgroundImage:
              "radial-gradient(circle at 85% 15%, oklch(0.7 0.19 150 / 0.18), transparent 55%), radial-gradient(circle at 10% 90%, oklch(0.82 0.16 90 / 0.08), transparent 60%)",
          }}
        />
        <div className="relative space-y-2">
          <div className="flex items-center gap-2">
            {gymProfile?.logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element -- dashboard logo comes from user-configured URL, no optimization guarantees */
              <img
                src={gymProfile.logoUrl}
                alt=""
                className="h-7 w-7 rounded-md border border-surface-800 bg-surface-950 object-contain"
              />
            ) : (
              <Icon name="dumbbell" className="size-5 text-brand-500" />
            )}
            <p className="font-tactical text-xs uppercase tracking-widest text-brand-500">
              {gymProfile?.name?.trim() ? gymProfile.name : "GymTimer Pro"}
            </p>
          </div>
          <h1 className="font-industrial text-3xl md:text-4xl leading-none text-phosphor">
            {greetingText ?? " "}
          </h1>
          <p className="font-tactical text-xs uppercase tracking-widest text-phosphor-muted">
            {dateText ?? " "}
          </p>
          {gymProfile?.linkCode && (
            <Link
              href={`/display/${gymProfile.linkCode}`}
              className="inline-flex items-center gap-2 rounded-lg border border-surface-800 bg-surface-950/60 px-3 py-1.5 hover:border-brand-500 transition-colors"
              aria-label="Abrir display del gimnasio"
            >
              <Icon name="display" className="size-3.5 text-brand-500" />
              <span className="font-tactical text-[10px] uppercase tracking-widest text-phosphor-muted">
                Link del gym
              </span>
              <span className="font-industrial text-sm uppercase tracking-widest text-phosphor">
                {gymProfile.linkCode}
              </span>
            </Link>
          )}
          <p className="text-sm text-phosphor-dim pt-1">
            ¿Qué entrenamos hoy?
          </p>
        </div>
      </header>

      <StatsRow stats={historyStats} totalRoutines={workouts.length} />

      <QuickActions />

      <Input
        placeholder="Buscar entrenamiento..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Buscar entrenamiento"
      />

      {!isSearching && <WorkoutOfTheDay workout={workoutOfTheDay} />}

      {filtered.length === 0 && !isSearching && (
        <Card className="relative overflow-hidden text-center space-y-3 border-dashed">
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            aria-hidden
            style={{
              backgroundImage:
                "radial-gradient(circle at 50% 0%, oklch(0.7 0.19 150 / 0.10), transparent 70%)",
            }}
          />
          <div className="relative space-y-2">
            <Icon name="dumbbell" className="size-10 text-phosphor-muted mx-auto" />
            <p className="font-industrial text-xl text-phosphor">No tenés rutinas todavía</p>
            <p className="text-sm text-phosphor-dim max-w-md mx-auto">
              Empezá creando una — podés armar AMRAP, EMOM, Tabata o cargar ejercicios desde el
              catálogo. Después la lanzás a la pantalla del gym con un click.
            </p>
          </div>
          <div className="relative flex flex-wrap items-center justify-center gap-2 pt-1">
            <Link href="/app/workouts/new">
              <Button size="lg">+ Crear la primera rutina</Button>
            </Link>
            <Link href="/app/workouts">
              <Button size="md" variant="ghost">
                Ver listado
              </Button>
            </Link>
          </div>
        </Card>
      )}

      <RecentWorkouts
        workouts={filtered}
        onDuplicate={(id) => {
          new LocalWorkoutRepository().duplicate(id);
          notifyLocalStorageChange();
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
