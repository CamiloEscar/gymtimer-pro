"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { useInstallPrompt } from "./useInstallPrompt";

const DISMISS_KEY = "gymtimer.pwa.installDismissed";

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari uses a different signal.
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

export function InstallPromptBanner() {
  const { promptEvent, installed, prompt } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    setHydrated(true);
    setStandalone(isStandalone());
    setDismissed(
      () => window.localStorage.getItem(DISMISS_KEY) === "1"
    );
  }, []);

  function handleDismiss() {
    window.localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  async function handleInstall() {
    const choice = await prompt();
    // Whether accepted or declined, the dialog won't reappear on the next
    // navigation within this session; persist either way to avoid annoyance.
    handleDismiss();
    void choice;
  }

  // Don't render during SSR, after install, after dismiss, or when the
  // browser hasn't offered install (no promptEvent captured yet).
  if (!hydrated) return null;
  if (installed || dismissed || standalone) return null;
  if (!promptEvent) return null;

  return (
    <div
      role="dialog"
      aria-label="Instalar GymTimer"
      data-testid="install-prompt-banner"
      className="fixed bottom-20 md:bottom-4 right-4 left-4 md:left-auto md:max-w-sm z-40 rounded-xl border border-brand-500/40 bg-surface-900/95 backdrop-blur shadow-lg shadow-black/50 p-3"
    >
      <div className="flex items-start gap-3">
        <Icon name="dumbbell" className="size-5 text-brand-500 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-tactical text-xs uppercase tracking-widest text-brand-500">
            GymTimer Pro
          </p>
          <p className="text-sm text-phosphor leading-snug mt-0.5">
            Instalá la app para abrir más rápido y usarla sin conexión.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={handleInstall}
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-black font-semibold text-sm active:scale-95 transition-colors"
            >
              Instalar
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-surface-800 hover:bg-surface-700 text-phosphor text-sm active:scale-95 transition-colors"
            >
              Más tarde
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Cerrar sugerencia de instalación"
          className="shrink-0 inline-flex items-center justify-center size-8 rounded-md text-phosphor-dim hover:text-phosphor active:scale-95 transition-colors"
        >
          <Icon name="close" className="size-4" />
        </button>
      </div>
    </div>
  );
}
