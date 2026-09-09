"use client";

import { useEffect, useState } from "react";
import type { DisplaySettings as DisplaySettingsModel } from "@/lib/storage/DisplaySettingsRepository";
import { DisplaySettingsRepository } from "@/lib/storage/DisplaySettingsRepository";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function DisplaySettings() {
  const [settings, setSettings] = useState<DisplaySettingsModel>({ showVideoOnDisplay: false });
  const repo = new DisplaySettingsRepository();

  function reload() {
    const result = repo.get();
    setSettings(result.ok ? result.value : { showVideoOnDisplay: false });
  }

  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps -- localStorage is the source of truth, intentional reload-on-mount */
  useEffect(() => {
    reload();
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

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
            setSettings(next);
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
            setSettings(next);
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