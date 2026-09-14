"use client";

import { useLocalStorageSnapshot, notifyLocalStorageChange } from "@/hooks/useLocalStorageSnapshot";
import { Icon } from "@/components/ui/Icon";
import type { UserExerciseOverride } from "@/types";
import { UserExerciseOverrideRepository } from "@/lib/storage/UserExerciseOverrideRepository";

const DISMISS_KEY = "gymtimer.onboarding.exerciseOverridesDismissed";

export function ExerciseOverridesOnboardingBanner() {
  const repo = new UserExerciseOverrideRepository();
  const overrides = useLocalStorageSnapshot<UserExerciseOverride[]>(
    "gymtimer.exerciseOverrides",
    () => {
      const result = repo.list();
      return result.ok ? result.value : [];
    },
    []
  );
  const dismissed = useLocalStorageSnapshot(
    DISMISS_KEY,
    () => window.localStorage.getItem(DISMISS_KEY) === "1",
    false
  );

  if (overrides.length > 0) return null;
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
        aria-label="Cerrar sugerencia de overrides"
        title="Cerrar"
        className="absolute right-3 top-3 inline-flex items-center justify-center size-10 rounded-md text-phosphor-dim hover:text-phosphor active:scale-95 transition-colors cursor-pointer"
      >
        <Icon name="close" className="size-4" />
      </button>
      <p className="font-tactical text-xs uppercase tracking-widest text-brand-500">
        Overrides de ejercicios
      </p>
      <p className="mt-2 text-sm text-phosphor leading-snug pr-8">
        Si tu gym llama distinto a un movimiento, o tiene su propio video de técnica, podés overrideear el catálogo acá. Los cambios aparecen en tus rutinas y en el display.
      </p>
    </div>
  );
}