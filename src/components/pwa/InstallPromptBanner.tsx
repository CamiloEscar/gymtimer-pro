"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { useInstallPrompt } from "./useInstallPrompt";

const DISMISS_KEY = "gymtimer.pwa.installDismissed";

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

function isIosSafari(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  if (!/iPad|iPhone|iPod/.test(ua)) return false;
  if (/CriOS|FxiOS|EdgiOS|OPTiOS|OPiOS|DuckDuckGo|GSA/.test(ua)) return false;
  return true;
}

export function InstallPromptBanner() {
  const { promptEvent, installed, prompt } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [iosSafari, setIosSafari] = useState(false);

  useEffect(() => {
    Promise.resolve().then(() => {
      setHydrated(true);
      setStandalone(isStandalone());
      setIosSafari(isIosSafari());
      setDismissed(
        () => window.localStorage.getItem(DISMISS_KEY) === "1"
      );
    });
  }, []);

  function handleDismiss() {
    window.localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  async function handleInstall() {
    const choice = await prompt();
    void choice;
    handleDismiss();
  }

  if (!hydrated) return null;
  if (installed || dismissed || standalone) return null;

  const showChromeVariant = Boolean(promptEvent);
  const showIosVariant = !showChromeVariant && iosSafari;

  if (!showChromeVariant && !showIosVariant) return null;

  if (showIosVariant) {
    return (
      <div
        role="dialog"
        aria-label="Instalar GymTimer en iOS"
        data-testid="install-prompt-banner"
        data-variant="ios"
        className="fixed bottom-20 md:bottom-4 right-4 left-4 md:left-auto md:max-w-sm z-40 rounded-xl border border-brand-500/40 bg-surface-900/95 backdrop-blur shadow-lg shadow-black/50 p-3"
      >
        <div className="flex items-start gap-3">
          <Icon name="share" className="size-5 text-brand-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-tactical text-xs uppercase tracking-widest text-brand-500">
              GymTimer Pro
            </p>
            <p className="text-sm text-phosphor leading-snug mt-0.5">
              Tocá el botón <strong className="font-semibold">Compartir</strong> en Safari y elegí <strong className="font-semibold">Agregar a pantalla de inicio</strong> para instalar la app.
            </p>
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

  return (
    <div
      role="dialog"
      aria-label="Instalar GymTimer"
      data-testid="install-prompt-banner"
      data-variant="chrome"
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