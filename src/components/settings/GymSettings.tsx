"use client";

import { useState } from "react";
import type { GymProfile } from "@/lib/storage/GymProfileRepository";
import { GymProfileRepository } from "@/lib/storage/GymProfileRepository";
import { useLocalStorageSnapshot, notifyLocalStorageChange } from "@/hooks/useLocalStorageSnapshot";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function GymSettings() {
  const repo = new GymProfileRepository();
  const profile = useLocalStorageSnapshot<GymProfile>(
    "gymtimer.gymProfile",
    () => {
      const result = repo.get();
      return result.ok ? result.value : { name: "" };
    },
    { name: "" }
  );
  const [draft, setDraft] = useState<GymProfile | null>(null);
  const form = draft ?? profile;

  const dirty =
    form.name !== profile.name || (form.logoUrl ?? "") !== (profile.logoUrl ?? "");

  return (
    <Card className="space-y-4">
      <h2 className="font-tactical text-xs uppercase tracking-widest text-brand-500">Gimnasio</h2>

      <p className="text-phosphor">Nombre y logo del gimnasio en la pantalla de conexión</p>

      <div className="space-y-3">
        <label className="block space-y-1">
          <span className="text-sm uppercase tracking-widest text-phosphor-dim">Nombre</span>
          <Input
            value={form.name}
            onChange={(e) => setDraft({ ...form, name: e.target.value })}
            placeholder="Box del Sur"
            aria-label="Nombre del gimnasio"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm uppercase tracking-widest text-phosphor-dim">
            Logo URL (opcional)
          </span>
          <Input
            value={form.logoUrl ?? ""}
            onChange={(e) => setDraft({ ...form, logoUrl: e.target.value })}
            placeholder="/logos/gimnasio.png"
            aria-label="Logo URL del gimnasio"
          />
        </label>
      </div>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          size="md"
          variant="primary"
          disabled={!dirty}
          onClick={() => {
            const next: GymProfile = form.logoUrl
              ? { name: form.name, logoUrl: form.logoUrl }
              : { name: form.name };
            repo.save(next);
            setDraft(null);
            notifyLocalStorageChange();
          }}
        >
          Guardar
        </Button>
        <Button
          type="button"
          size="md"
          variant="ghost"
          disabled={!dirty}
          onClick={() => setDraft(null)}
        >
          Descartar
        </Button>
      </div>
    </Card>
  );
}