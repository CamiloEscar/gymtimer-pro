"use client";

import { useEffect, useState } from "react";
import type { UserExerciseOverride } from "@/types";
import { UserExerciseOverrideRepository } from "@/lib/storage/UserExerciseOverrideRepository";
import {
  EXERCISE_CATALOG,
  getEffectiveCatalog,
  groupCatalogByCategory,
} from "@/lib/workout/exerciseCatalog";
import type { CatalogExercise } from "@/lib/workout/exerciseCatalog";
import { CROSSFIT_CATALOG } from "@/lib/workout/exerciseCatalogCrossfit";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type CatalogKind = "gym" | "crossfit";

interface EditState {
  exerciseId: string;
  name: string;
  videoUrl: string;
  thumbnailUrl: string;
  description: string;
}

const EMPTY_EDIT: EditState = {
  exerciseId: "",
  name: "",
  videoUrl: "",
  thumbnailUrl: "",
  description: "",
};

export function ExerciseOverridesSettings() {
  const [overrides, setOverrides] = useState<UserExerciseOverride[]>([]);
  const [catalogKind, setCatalogKind] = useState<CatalogKind>("gym");
  const [edit, setEdit] = useState<EditState>(EMPTY_EDIT);
  const repo = new UserExerciseOverrideRepository();

  function reload() {
    const result = repo.list();
    setOverrides(result.ok ? result.value : []);
  }

  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps -- localStorage is the source of truth, intentional reload-on-mount */
  useEffect(() => {
    reload();
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

  const currentCatalog = catalogKind === "gym" ? EXERCISE_CATALOG : CROSSFIT_CATALOG;
  const effectiveCatalog = getEffectiveCatalog(currentCatalog, overrides);
  const grouped = groupCatalogByCategory(effectiveCatalog);

  const allEffective = new Map<string, CatalogExercise>();
  for (const exercise of [
    ...getEffectiveCatalog(EXERCISE_CATALOG, overrides),
    ...getEffectiveCatalog(CROSSFIT_CATALOG, overrides),
  ]) {
    allEffective.set(exercise.id, exercise);
  }

  function handleSelectExercise(exerciseId: string) {
    const entry = effectiveCatalog.find((exercise) => exercise.id === exerciseId);
    setEdit({
      exerciseId,
      name: entry?.name ?? "",
      videoUrl: entry?.videoUrl ?? "",
      thumbnailUrl: entry?.thumbnailUrl ?? "",
      description: entry?.description ?? "",
    });
  }

  function handleCatalogChange(kind: CatalogKind) {
    setCatalogKind(kind);
    setEdit(EMPTY_EDIT);
  }

  function handleSaveOverride() {
    if (!edit.exerciseId) return;
    const override: UserExerciseOverride = { exerciseId: edit.exerciseId };
    const name = edit.name.trim();
    const videoUrl = edit.videoUrl.trim();
    const thumbnailUrl = edit.thumbnailUrl.trim();
    const description = edit.description.trim();
    if (name && name !== allEffective.get(edit.exerciseId)?.name) override.name = name;
    if (videoUrl) override.videoUrl = videoUrl;
    if (thumbnailUrl) override.thumbnailUrl = thumbnailUrl;
    if (description) override.description = description;
    repo.save(override);
    reload();
  }

  function handleRemove(exerciseId: string) {
    repo.remove(exerciseId);
    reload();
  }

  return (
    <Card className="space-y-4">
      <h2 className="font-tactical text-xs uppercase tracking-widest text-brand-500">
        Overrides de ejercicios
      </h2>

        <div className="flex gap-2">
          <Button
            type="button"
            size="md"
            variant={catalogKind === "gym" ? "primary" : "secondary"}
            aria-pressed={catalogKind === "gym"}
            onClick={() => handleCatalogChange("gym")}
          >
            Gimnasio
          </Button>
          <Button
            type="button"
            size="md"
            variant={catalogKind === "crossfit" ? "primary" : "secondary"}
            aria-pressed={catalogKind === "crossfit"}
            onClick={() => handleCatalogChange("crossfit")}
          >
            CrossFit
          </Button>
        </div>

        <Select
          aria-label="Ejercicio"
          value={edit.exerciseId}
          onChange={(e) => handleSelectExercise(e.target.value)}
        >
          <option value="">Elegí un ejercicio</option>
          {Object.entries(grouped).map(([category, exercises]) => (
            <optgroup key={category} label={category}>
              {exercises.map((exercise) => (
                <option key={exercise.id} value={exercise.id}>
                  {exercise.name}
                </option>
              ))}
            </optgroup>
          ))}
        </Select>

        <Input
          aria-label="Nombre (opcional)"
          type="text"
          value={edit.name}
          onChange={(e) => setEdit({ ...edit, name: e.target.value })}
          placeholder="Nombre (opcional)"
        />
        <Input
          aria-label="URL de video"
          type="text"
          value={edit.videoUrl}
          onChange={(e) => setEdit({ ...edit, videoUrl: e.target.value })}
          placeholder="URL de video"
        />
        <Input
          aria-label="URL de miniatura"
          type="text"
          value={edit.thumbnailUrl}
          onChange={(e) => setEdit({ ...edit, thumbnailUrl: e.target.value })}
          placeholder="URL de miniatura"
        />
        <textarea
          aria-label="Descripción"
          value={edit.description}
          onChange={(e) => setEdit({ ...edit, description: e.target.value })}
          placeholder="Descripción"
          className="border border-surface-800 bg-surface-900 text-white rounded p-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />

        <Button type="button" size="md" onClick={handleSaveOverride} disabled={!edit.exerciseId}>
          Guardar override
        </Button>

        <div className="border-t border-surface-800 pt-3 space-y-2">
          <h3 className="font-tactical text-xs uppercase tracking-widest text-phosphor-muted">
            Overrides aplicados
          </h3>
          {overrides.length === 0 ? (
            <p className="text-sm text-phosphor-dim">No hay overrides todavía.</p>
          ) : (
            <ul className="space-y-2">
              {overrides.map((override) => {
                const name = allEffective.get(override.exerciseId)?.name ?? override.exerciseId;
                const fields = [
                  override.name && `Nombre: ${override.name}`,
                  override.videoUrl && `Video: ${override.videoUrl}`,
                  override.thumbnailUrl && `Miniatura: ${override.thumbnailUrl}`,
                  override.description && `Descripción: ${override.description}`,
                ].filter(Boolean);
                return (
                  <li
                    key={override.exerciseId}
                    className="flex items-start justify-between gap-3 rounded-lg bg-surface-950 border border-surface-800 p-3"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-sm text-phosphor font-medium">{name}</p>
                      {fields.length > 0 && (
                        <ul className="space-y-0.5">
                          {fields.map((field) => (
                            <li key={field} className="text-xs text-phosphor-muted truncate">
                              {field}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      type="button"
                      aria-label={`Quitar ${name}`}
                      onClick={() => handleRemove(override.exerciseId)}
                    >
                      Quitar
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
    </Card>
  );
}