"use client";

import { useEffect, useState } from "react";

// Captures the deferred `beforeinstallprompt` event so we can show a banner
// at our own pace. `event.prompt()` is what surfaces the native install
// dialog — we don't fire it until the user clicks "Instalar".
//
// Standard pattern from web.dev: the event is fired once per page lifetime
// when the install criteria are met (manifest + SW + user engagement).
// Calling prompt() always shows the dialog; if the user dismisses it we
// keep the event null so we don't re-prompt on the next render.
export type InstallChoice = "accepted" | "dismissed";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: InstallChoice; platform: string }>;
  prompt(): Promise<void>;
}

export function useInstallPrompt(): {
  promptEvent: BeforeInstallPromptEvent | null;
  installed: boolean;
  installedPlatform: string | null;
  prompt: () => Promise<InstallChoice | null>;
} {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
    }
    function onAppInstalled(e: Event) {
      setInstalled(true);
      setPromptEvent(null);
      void e;
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const prompt = async (): Promise<InstallChoice | null> => {
    if (!promptEvent) return null;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    setPromptEvent(null);
    return choice.outcome;
  };

  return {
    promptEvent,
    installed,
    installedPlatform: null,
    prompt,
  };
}
