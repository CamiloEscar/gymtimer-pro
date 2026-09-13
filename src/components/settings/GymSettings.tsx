"use client";

import { useEffect, useState } from "react";
import type { GymProfile } from "@/lib/storage/GymProfileRepository";
import { GymProfileRepository } from "@/lib/storage/GymProfileRepository";
import { useLocalStorageSnapshot, notifyLocalStorageChange } from "@/hooks/useLocalStorageSnapshot";
import { Card } from "@/components/ui/Card";
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
  const [saved, setSaved] = useState(false);
  const form = draft ?? profile;

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 2000);
    return () => clearTimeout(t);
  }, [saved]);

  // Save on blur, carrying every field the form doesn't edit (wodWorkoutId,
  // weeklyPlan, ...) forward so a name edit never silently drops the pinned
  // WOD or the weekly schedule.
  function commitField(changed: boolean, patch: Partial<GymProfile>) {
    if (!changed) return;
    repo.save({ ...profile, ...form, ...patch });
    setDraft(null);
    setSaved(true);
    notifyLocalStorageChange();
  }

  return (
    <Card className="p-4 space-y-4">
      <h2 className="font-tactical text-xs uppercase tracking-widest text-brand-500">Gimnasio</h2>

      <p className="text-phosphor">Nombre y logo del gimnasio en la pantalla de conexión</p>

      {saved && (
        <p role="status" className="text-xs uppercase tracking-widest text-brand-500">
          Cambios guardados
        </p>
      )}

      <div className="space-y-3">
        <label className="block space-y-1">
          <span className="text-sm uppercase tracking-widest text-phosphor-dim">Nombre</span>
          <Input
            value={form.name}
            onChange={(e) => setDraft({ ...form, name: e.target.value })}
            onBlur={() =>
              commitField(form.name.trim() !== profile.name, { name: form.name.trim() })
            }
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
            onBlur={() =>
              commitField(
                (form.logoUrl ?? "") !== (profile.logoUrl ?? ""),
                { logoUrl: form.logoUrl || undefined }
              )
            }
            placeholder="/logos/gimnasio.png"
            aria-label="Logo URL del gimnasio"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm uppercase tracking-widest text-phosphor-dim">
            Código de enlace fijo (opcional)
          </span>
          <Input
            value={form.linkCode ?? ""}
            onChange={(e) => setDraft({ ...form, linkCode: e.target.value.toUpperCase() })}
            onBlur={() =>
              commitField(
                (form.linkCode ?? "") !== (profile.linkCode ?? ""),
                { linkCode: form.linkCode || undefined }
              )
            }
            placeholder="BOXDEL"
            maxLength={6}
            aria-label="Código de enlace fijo del gimnasio"
            className="font-mono uppercase tracking-widest"
          />
          <span className="text-xs text-phosphor-dim">
            Si lo configurás, el trainer y el display usan siempre este mismo código (6 caracteres).
            Dejalo vacío para generar uno nuevo cada sesión.
          </span>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1">
            <span className="text-sm uppercase tracking-widest text-phosphor-dim">
              Trabajo por defecto
            </span>
            <Input
              type="number"
              min={0}
              value={form.defaultWorkSeconds ?? ""}
              onChange={(e) =>
                setDraft({
                  ...form,
                  defaultWorkSeconds: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              onBlur={() =>
                commitField(
                  (form.defaultWorkSeconds ?? 0) !== (profile.defaultWorkSeconds ?? 0),
                  { defaultWorkSeconds: form.defaultWorkSeconds }
                )
              }
              placeholder="40"
              aria-label="Segundos de trabajo por defecto"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm uppercase tracking-widest text-phosphor-dim">
              Descanso por defecto
            </span>
            <Input
              type="number"
              min={0}
              value={form.defaultRestSeconds ?? ""}
              onChange={(e) =>
                setDraft({
                  ...form,
                  defaultRestSeconds: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              onBlur={() =>
                commitField(
                  (form.defaultRestSeconds ?? 0) !== (profile.defaultRestSeconds ?? 0),
                  { defaultRestSeconds: form.defaultRestSeconds }
                )
              }
              placeholder="20"
              aria-label="Segundos de descanso por defecto"
            />
          </label>
        </div>

        <span className="text-xs text-phosphor-dim">
          Cada bloque de tipo interval/tabata/emom/otm que crees arranca con estos tiempos.
        </span>
      </div>
    </Card>
  );
}