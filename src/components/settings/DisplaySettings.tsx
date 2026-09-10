"use client";

import type { DisplaySettings as DisplaySettingsModel } from "@/lib/storage/DisplaySettingsRepository";
import { DisplaySettingsRepository } from "@/lib/storage/DisplaySettingsRepository";
import { useLocalStorageSnapshot, notifyLocalStorageChange } from "@/hooks/useLocalStorageSnapshot";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function DisplaySettings() {
  const repo = new DisplaySettingsRepository();
  const settings = useLocalStorageSnapshot<DisplaySettingsModel>(
    "gymtimer.displaySettings",
    () => {
      const result = repo.get();
      return result.ok ? result.value : { showVideoOnDisplay: true };
    },
    { showVideoOnDisplay: true }
  );

  return (
    <Card className="space-y-4">
      <h2 className="font-tactical text-xs uppercase tracking-widest text-brand-500">Pantalla</h2>

      <p className="text-phosphor">Mostrar videos de ejercicios en el display (TV)</p>

      <div className="flex gap-2">
        <Button
          type="button"
          size="md"
          variant={!settings.showVideoOnDisplay ? "primary" : "secondary"}
          aria-pressed={!settings.showVideoOnDisplay}
          onClick={() => {
            const next = { showVideoOnDisplay: false };
            repo.save(next);
            notifyLocalStorageChange();
          }}
        >
          Apagado
        </Button>
        <Button
          type="button"
          size="md"
          variant={settings.showVideoOnDisplay ? "primary" : "secondary"}
          aria-pressed={settings.showVideoOnDisplay}
          onClick={() => {
            const next = { showVideoOnDisplay: true };
            repo.save(next);
            notifyLocalStorageChange();
          }}
        >
          Encendido
        </Button>
      </div>

      <p className="text-sm text-phosphor-dim">
        Se aplica a los videos de ejercicios con video cargado durante la fase de trabajo.
      </p>
    </Card>
  );
}