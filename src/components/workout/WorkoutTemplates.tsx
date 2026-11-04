"use client";

import { useRouter } from "next/navigation";
import type { WorkoutTemplate } from "@/lib/workout/crossfitWodTemplates";
import {
  CROSSFIT_WOD_TEMPLATES,
  instantiateTemplate,
} from "@/lib/workout/crossfitWodTemplates";
import { LocalWorkoutRepository } from "@/lib/storage/LocalWorkoutRepository";
import { notifyLocalStorageChange } from "@/hooks/useLocalStorageSnapshot";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { countBlocksAndExercises } from "@/lib/workout/countBlocksAndExercises";
import {
  estimateWorkoutDurationSeconds,
  formatEstimateMinutes,
} from "@/lib/workout/estimateWorkoutDurationSeconds";
import { BLOCK_TYPE_INFO } from "@/lib/workout/blockTypeInfo";

interface WorkoutTemplatesProps {
  code?: string;
}

// Collapsed by default (native <details>, zero state): the trainer's own
// routines stay at the top on mobile — the templates are one tap away.
export function WorkoutTemplates({ code }: WorkoutTemplatesProps) {
  const router = useRouter();
  const repo = new LocalWorkoutRepository();

  function handleUseTemplate(template: WorkoutTemplate) {
    const workout = instantiateTemplate(template);
    const result = repo.save(workout);
    if (!result.ok) return;
    notifyLocalStorageChange();
    router.push(
      code
        ? `/app/workouts/${workout.id}?code=${code}`
        : `/app/workouts/${workout.id}`,
    );
  }

  return (
    <section className="p-4">
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 border-b border-surface-800 pb-2 [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2">
            <Icon
              name="chevron-down"
              className="h-4 w-4 shrink-0 text-phosphor-dim transition-transform group-open:rotate-180"
            />
            <h2 className="font-industrial text-xl leading-none text-phosphor">
              Clásicos de CrossFit
            </h2>
          </span>
          <span className="font-tactical text-xs uppercase tracking-widest text-phosphor-muted">
            {CROSSFIT_WOD_TEMPLATES.length} plantillas
          </span>
        </summary>
        <div className="space-y-3 pt-3">
          <p className="font-tactical text-xs uppercase tracking-widest text-phosphor-muted">
            Cargá un clásico y ajustalo a tu box
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {CROSSFIT_WOD_TEMPLATES.map((template) => {
              const { blocks, exercises } = countBlocksAndExercises({
                ...template,
                id: "",
                createdAt: "",
                favorite: false,
              });
              const estimatedSeconds = estimateWorkoutDurationSeconds(template);
              const blockTypes = Array.from(
                new Set(template.blocks.map((b) => b.type)),
              );
              return (
                <Card key={template.name} className="p-4 flex flex-col gap-2">
                  {blockTypes.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {blockTypes.map((type) => (
                        <span
                          key={type}
                          className="font-tactical text-xs uppercase tracking-widest px-2 py-0.5 rounded-md bg-surface-800 text-phosphor-dim border border-surface-700"
                        >
                          {BLOCK_TYPE_INFO[type].label}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="font-industrial text-xl leading-tight text-phosphor">
                    {template.name}
                  </p>
                  <p className="font-tactical text-xs text-phosphor-muted">
                    {template.description}
                  </p>
                  <div className="mt-2 grid grid-cols-3 gap-x-3 font-tactical text-xs uppercase tracking-widest text-phosphor-dim">
                    <span>
                      <span className="text-phosphor">{blocks}</span> bloque
                      {blocks === 1 ? "" : "s"}
                    </span>
                    <span>
                      <span className="text-phosphor">{exercises}</span>{" "}
                      ejercicio{exercises === 1 ? "" : "s"}
                    </span>
                    {estimatedSeconds > 0 && (
                      <span>
                        <span className="text-phosphor">
                          ~{formatEstimateMinutes(estimatedSeconds)}
                        </span>{" "}
                        estimados
                      </span>
                    )}
                  </div>
                  <Button
                    size="md"
                    className="mt-auto w-full"
                    onClick={() => handleUseTemplate(template)}
                  >
                    Usar plantilla
                  </Button>
                </Card>
              );
            })}
          </div>
        </div>
      </details>
    </section>
  );
}
