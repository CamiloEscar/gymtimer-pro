"use client";

import { useLocalStorageSnapshot, notifyLocalStorageChange } from "@/hooks/useLocalStorageSnapshot";
import { Icon } from "@/components/ui/Icon";
import type { GymProfile } from "@/lib/storage/GymProfileRepository";
import { GymProfileRepository } from "@/lib/storage/GymProfileRepository";
import type { Workout } from "@/types";
import { LocalWorkoutRepository } from "@/lib/storage/LocalWorkoutRepository";

const DISMISS_KEY = "gymtimer.onboarding.weeklyPlanDismissed";
const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

export function WeeklyPlanOnboardingBanner() {
  const profileRepo = new GymProfileRepository();
  const workoutsRepo = new LocalWorkoutRepository();

  const profile = useLocalStorageSnapshot<GymProfile>(
    "gymtimer.gymProfile",
    () => {
      const result = profileRepo.get();
      return result.ok ? result.value : { name: "" };
    },
    { name: "" }
  );
  const workouts = useLocalStorageSnapshot<Workout[]>(
    "gymtimer.workouts",
    () => {
      const result = workoutsRepo.list();
      return result.ok ? result.value : [];
    },
    []
  );
  const dismissed = useLocalStorageSnapshot(
    DISMISS_KEY,
    () => window.localStorage.getItem(DISMISS_KEY) === "1",
    false
  );

  // Hide when there's nothing to assign (no routines yet) or when the user
  // has already started filling the plan — the dropdowns speak for themselves
  // at that point. Without the workouts.length guard the banner would nag a
  // brand-new user who hasn't created their first routine yet.
  if (workouts.length === 0) return null;
  const assignedDays = DAY_KEYS.filter((k) => Boolean(profile.weeklyPlan?.[k])).length;
  if (assignedDays > 0) return null;
  if (dismissed) return null;

  function dismiss() {
    window.localStorage.setItem(DISMISS_KEY, "1");
    notifyLocalStorageChange();
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-brand-500/40 bg-surface-900 p-4">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Cerrar sugerencia de plan semanal"
        title="Cerrar"
        className="absolute right-3 top-3 inline-flex items-center justify-center size-10 rounded-md text-phosphor-dim hover:text-phosphor active:scale-95 transition-colors cursor-pointer"
      >
        <Icon name="close" className="size-4" />
      </button>
      <p className="font-tactical text-xs uppercase tracking-widest text-brand-500">
        Asigná tu plan semanal
      </p>
      <p className="mt-2 text-sm text-phosphor leading-snug pr-8">
        Elegí qué rutina corre cada día. Es lo primero que aparece en el dashboard y pisa la rutina destacada manualmente.
      </p>
    </div>
  );
}