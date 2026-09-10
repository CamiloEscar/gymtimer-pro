"use client";

import { useEffect, useState } from "react";
import type { GymProfile } from "@/lib/storage/GymProfileRepository";
import { GymProfileRepository } from "@/lib/storage/GymProfileRepository";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function GymSettings() {
  const [profile, setProfile] = useState<GymProfile>({ name: "" });
  const [draft, setDraft] = useState<GymProfile>({ name: "" });
  const repo = new GymProfileRepository();

  function reload() {
    const result = repo.get();
    const value = result.ok ? result.value : { name: "" };
    setProfile(value);
    setDraft(value);
  }

  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps -- localStorage is the source of truth, intentional reload-on-mount */
  useEffect(() => {
    reload();
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

  const dirty =
    draft.name !== profile.name || (draft.logoUrl ?? "") !== (profile.logoUrl ?? "");

  return (
    <Card className="space-y-4">
      <h2 className="font-tactical text-xs uppercase tracking-widest text-brand-500">Gimnasio</h2>

      <p className="text-phosphor">Nombre y logo del gimnasio en la pantalla de conexión</p>

      <div className="space-y-3">
        <label className="block space-y-1">
          <span className="text-sm uppercase tracking-widest text-phosphor-dim">Nombre</span>
          <Input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="Box del Sur"
            aria-label="Nombre del gimnasio"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm uppercase tracking-widest text-phosphor-dim">
            Logo URL (opcional)
          </span>
          <Input
            value={draft.logoUrl ?? ""}
            onChange={(e) => setDraft({ ...draft, logoUrl: e.target.value })}
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
            const next: GymProfile = draft.logoUrl
              ? { name: draft.name, logoUrl: draft.logoUrl }
              : { name: draft.name };
            repo.save(next);
            setProfile(next);
          }}
        >
          Guardar
        </Button>
        <Button
          type="button"
          size="md"
          variant="ghost"
          disabled={!dirty}
          onClick={() => setDraft(profile)}
        >
          Descartar
        </Button>
      </div>
    </Card>
  );
}