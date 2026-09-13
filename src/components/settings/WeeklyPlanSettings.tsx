"use client";

import type { Workout } from "@/types";
import type { GymProfile } from "@/lib/storage/GymProfileRepository";
import { GymProfileRepository } from "@/lib/storage/GymProfileRepository";
import { LocalWorkoutRepository } from "@/lib/storage/LocalWorkoutRepository";
import { useLocalStorageSnapshot, notifyLocalStorageChange } from "@/hooks/useLocalStorageSnapshot";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

const DAY_LABELS: Record<(typeof DAY_KEYS)[number], string> = {
  mon: "Lunes",
  tue: "Martes",
  wed: "Miércoles",
  thu: "Jueves",
  fri: "Viernes",
  sat: "Sábado",
  sun: "Domingo",
};

export function WeeklyPlanSettings() {
  const repo = new GymProfileRepository();
  const profile = useLocalStorageSnapshot<GymProfile>(
    "gymtimer.gymProfile",
    () => {
      const result = repo.get();
      return result.ok ? result.value : { name: "" };
    },
    { name: "" }
  );
  const workouts = useLocalStorageSnapshot<Workout[]>(
    "gymtimer.workouts",
    () => {
      const result = new LocalWorkoutRepository().list();
      return result.ok ? result.value : [];
    },
    []
  );

  // Autosave on change. Spreading the whole profile carries wodWorkoutId and
  // every other field forward so editing the plan never drops the pinned WOD.
  function handleDayChange(dayKey: (typeof DAY_KEYS)[number], value: string) {
    const weeklyPlan = { ...profile.weeklyPlan };
    if (value) weeklyPlan[dayKey] = value;
    else delete weeklyPlan[dayKey];
    repo.save({ ...profile, weeklyPlan });
    notifyLocalStorageChange();
  }

  return (
    <Card className="p-4 space-y-4">
      <h2 className="font-tactical text-xs uppercase tracking-widest text-brand-500">
        Plan semanal
      </h2>
      <p className="text-sm text-phosphor-dim">
        Asigná una rutina por día. Es lo primero que aparece en el dashboard de cada día —
        tiene prioridad sobre la rutina destacada manualmente.
      </p>
      {DAY_KEYS.map((dayKey) => (
        <label key={dayKey} className="flex items-center gap-3">
          <span className="font-tactical text-xs uppercase tracking-widest text-phosphor-dim w-24 shrink-0">
            {DAY_LABELS[dayKey]}
          </span>
          <Select
            value={profile.weeklyPlan?.[dayKey] ?? ""}
            onChange={(e) => handleDayChange(dayKey, e.target.value)}
            aria-label={`Rutina para ${DAY_LABELS[dayKey]}`}
            className="flex-1"
          >
            <option value="">Sin asignar</option>
            {workouts.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name || "(sin nombre)"}
              </option>
            ))}
          </Select>
        </label>
      ))}
    </Card>
  );
}