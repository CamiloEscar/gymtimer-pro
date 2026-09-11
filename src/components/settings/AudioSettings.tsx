"use client";

import type { AudioSettings } from "@/lib/storage/AudioSettingsRepository";
import { AudioSettingsRepository } from "@/lib/storage/AudioSettingsRepository";
import { useLocalStorageSnapshot, notifyLocalStorageChange } from "@/hooks/useLocalStorageSnapshot";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

function volumePercent(v: number): string {
  return `${Math.round(v * 100)}%`;
}

export function AudioSettings() {
  const repo = new AudioSettingsRepository();
  const defaults: AudioSettings = { volume: 0.5, soundEnabled: true, voiceEnabled: false };
  const settings = useLocalStorageSnapshot<AudioSettings>(
    "gymtimer.audioSettings",
    () => {
      const result = repo.get();
      return result.ok ? result.value : defaults;
    },
    defaults
  );

  function patch(partial: Partial<AudioSettings>) {
    const next = { ...settings, ...partial };
    repo.save(next);
    notifyLocalStorageChange();
  }

  return (
    <Card className="space-y-4">
      <h2 className="font-tactical text-xs uppercase tracking-widest text-brand-500">Sonido</h2>

      <div className="space-y-3">
        {/* Volume slider */}
        <label className="block space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm uppercase tracking-widest text-phosphor-dim">Volumen</span>
            <span className="text-sm font-mono text-phosphor">{volumePercent(settings.volume)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={settings.volume}
            onChange={(e) => patch({ volume: Number(e.target.value) })}
            className="w-full accent-brand-500"
            aria-label="Volumen de los sonidos"
          />
        </label>

        {/* Sound effects toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm uppercase tracking-widest text-phosphor-dim">Efectos de sonido</span>
          <div className="flex gap-2">
            <Button
              type="button"
              size="md"
              variant={!settings.soundEnabled ? "primary" : "secondary"}
              aria-pressed={!settings.soundEnabled}
              onClick={() => patch({ soundEnabled: false })}
            >
              Apagado
            </Button>
            <Button
              type="button"
              size="md"
              variant={settings.soundEnabled ? "primary" : "secondary"}
              aria-pressed={settings.soundEnabled}
              onClick={() => patch({ soundEnabled: true })}
            >
              Encendido
            </Button>
          </div>
        </div>

        {/* Voice announcements toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm uppercase tracking-widest text-phosphor-dim">Anuncios de voz</span>
          <div className="flex gap-2">
            <Button
              type="button"
              size="md"
              variant={!settings.voiceEnabled ? "primary" : "secondary"}
              aria-pressed={!settings.voiceEnabled}
              onClick={() => patch({ voiceEnabled: false })}
            >
              Apagado
            </Button>
            <Button
              type="button"
              size="md"
              variant={settings.voiceEnabled ? "primary" : "secondary"}
              aria-pressed={settings.voiceEnabled}
              onClick={() => patch({ voiceEnabled: true })}
            >
              Encendido
            </Button>
          </div>
        </div>

        <p className="text-xs text-phosphor-dim">
          La voz dice «work», «rest» y el nombre de cada ejercicio en las transiciones. Los efectos suenan en cada cambio de fase.
        </p>
      </div>
    </Card>
  );
}
