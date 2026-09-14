"use client";

import { useLocalStorageSnapshot, notifyLocalStorageChange } from "@/hooks/useLocalStorageSnapshot";
import { Icon } from "@/components/ui/Icon";
import type { GymProfile } from "@/lib/storage/GymProfileRepository";
import { GymProfileRepository } from "@/lib/storage/GymProfileRepository";

const DISMISS_KEY = "gymtimer.onboarding.gymProfileDismissed";

export function GymProfileOnboardingBanner() {
  const repo = new GymProfileRepository();
  const profile = useLocalStorageSnapshot<GymProfile>(
    "gymtimer.gymProfile",
    () => {
      const result = repo.get();
      return result.ok ? result.value : { name: "" };
    },
    { name: "" }
  );
  const dismissed = useLocalStorageSnapshot(
    DISMISS_KEY,
    () => window.localStorage.getItem(DISMISS_KEY) === "1",
    false
  );

  if (profile.name.trim()) return null;
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
        aria-label="Cerrar sugerencia de perfil"
        title="Cerrar"
        className="absolute right-3 top-3 inline-flex items-center justify-center size-10 rounded-md text-phosphor-dim hover:text-phosphor active:scale-95 transition-colors cursor-pointer"
      >
        <Icon name="close" className="size-4" />
      </button>
      <p className="font-tactical text-xs uppercase tracking-widest text-brand-500">
        Configurá tu gimnasio
      </p>
      <p className="mt-2 text-sm text-phosphor leading-snug pr-8">
        Poné el nombre del gym y, si querés, un logo. La pantalla del TV lo va a mostrar arriba para que los atletas identifiquen tu box.
      </p>
    </div>
  );
}