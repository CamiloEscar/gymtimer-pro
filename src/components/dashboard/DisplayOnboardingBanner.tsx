"use client";

import { useLocalStorageSnapshot, notifyLocalStorageChange } from "@/hooks/useLocalStorageSnapshot";
import { Icon } from "@/components/ui/Icon";

const DISMISS_KEY = "gymtimer.onboarding.displayDismissed";

const STEPS = ["Creá una rutina", "Tocá Iniciar", "Abrí el código en el TV"];

export function DisplayOnboardingBanner() {
  const dismissed = useLocalStorageSnapshot(
    DISMISS_KEY,
    () => window.localStorage.getItem(DISMISS_KEY) === "1",
    false
  );

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
        aria-label="Cerrar introducción de pantalla"
        title="Cerrar"
        className="absolute right-3 top-3 inline-flex items-center justify-center size-10 rounded-md text-phosphor-dim hover:text-phosphor active:scale-95 transition-colors cursor-pointer"
      >
        <Icon name="close" className="size-4" />
      </button>
      <p className="font-tactical text-xs uppercase tracking-widest text-brand-500">
        Display en 3 pasos
      </p>
      <ol className="mt-3 space-y-1">
        {STEPS.map((step, i) => (
          <li key={step} className="flex items-center gap-3 text-xs text-phosphor">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-brand-500/40 font-tactical text-xs text-brand-500">
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
    </div>
  );
}