"use client";

import { useState } from "react";
import type { GymProfile } from "@/lib/storage/GymProfileRepository";
import { GymProfileRepository } from "@/lib/storage/GymProfileRepository";
import { LocalWorkoutRepository } from "@/lib/storage/LocalWorkoutRepository";
import { useLocalStorageSnapshot, notifyLocalStorageChange } from "@/hooks/useLocalStorageSnapshot";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

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
  const workouts = useLocalStorageSnapshot(
    "gymtimer.workouts",
    () => {
      const result = new LocalWorkoutRepository().list();
      return result.ok ? result.value : [];
    },
    []
  );
  const [draft, setDraft] = useState<GymProfile | null>(null);
  const form = draft ?? profile;

  const dirty =
    form.name !== profile.name ||
    (form.logoUrl ?? "") !== (profile.logoUrl ?? "") ||
    (form.linkCode ?? "") !== (profile.linkCode ?? "") ||
    (form.defaultWorkSeconds ?? 0) !== (profile.defaultWorkSeconds ?? 0) ||
    (form.defaultRestSeconds ?? 0) !== (profile.defaultRestSeconds ?? 0) ||
    JSON.stringify(form.weeklyPlan ?? {}) !== JSON.stringify(profile.weeklyPlan ?? {});

  function handleSave() {
    const next: GymProfile = { name: form.name };
    if (form.logoUrl) next.logoUrl = form.logoUrl;
    const linkCode = form.linkCode?.trim().toUpperCase();
    if (linkCode) next.linkCode = linkCode;
    if (form.defaultWorkSeconds) next.defaultWorkSeconds = form.defaultWorkSeconds;
    if (form.defaultRestSeconds) next.defaultRestSeconds = form.defaultRestSeconds;
    if (form.weeklyPlan && Object.keys(form.weeklyPlan).length > 0) next.weeklyPlan = form.weeklyPlan;
    repo.save(next);
    setDraft(null);
    notifyLocalStorageChange();
  }

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

        <label className="block space-y-1">
          <span className="text-sm uppercase tracking-widest text-phosphor-dim">
            Código de enlace fijo (opcional)
          </span>
          <Input
            value={form.linkCode ?? ""}
            onChange={(e) => setDraft({ ...form, linkCode: e.target.value.toUpperCase() })}
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
              placeholder="20"
              aria-label="Segundos de descanso por defecto"
            />
          </label>
        </div>

        <span className="text-xs text-phosphor-dim">
          Cada bloque de tipo interval/tabata/emom/otm que crees arranca con estos tiempos.
        </span>
      </div>

      <div className="space-y-3 border-t border-surface-800 pt-4">
        <h2 className="font-tactical text-xs uppercase tracking-widest text-brand-500">
          Plan semanal
        </h2>
        <p className="text-sm text-phosphor-dim">
          Asigná una rutina por día. Es lo primero que aparece en el dashboard de cada día —
          tiene prioridad sobre el WOD fijado manualmente.
        </p>
        {(["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const).map((dayKey) => {
          const dayLabel: Record<string, string> = {
            mon: "Lunes",
            tue: "Martes",
            wed: "Miércoles",
            thu: "Jueves",
            fri: "Viernes",
            sat: "Sábado",
            sun: "Domingo",
          };
          return (
            <label key={dayKey} className="flex items-center gap-3">
              <span className="font-tactical text-xs uppercase tracking-widest text-phosphor-dim w-24 shrink-0">
                {dayLabel[dayKey]}
              </span>
              <Select
                value={form.weeklyPlan?.[dayKey] ?? ""}
                onChange={(e) => {
                  const weeklyPlan = { ...form.weeklyPlan };
                  if (e.target.value) weeklyPlan[dayKey] = e.target.value;
                  else delete weeklyPlan[dayKey];
                  setDraft({ ...form, weeklyPlan });
                }}
                aria-label={`Rutina para ${dayLabel[dayKey]}`}
                className="flex-1"
              >
                <option value="">Sin asignar</option>
                {workouts.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name || "(sin nombre)"}
                  </option>
                ))}
              </Select>
            </label>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          size="md"
          variant="primary"
          disabled={!dirty}
          onClick={handleSave}
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