"use client";

import { useState } from "react";
import type { BlockType, UserExerciseOverride, WorkoutBlock } from "@/types";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { EXERCISE_CATALOG, getEffectiveCatalog } from "@/lib/workout/exerciseCatalog";
import { CROSSFIT_CATALOG } from "@/lib/workout/exerciseCatalogCrossfit";
import { estimateWorkoutDurationSeconds, formatEstimateMinutes } from "@/lib/workout/estimateWorkoutDurationSeconds";
import { BLOCK_TYPE_INFO } from "@/lib/workout/blockTypeInfo";
import { formatTimeInput } from "@/lib/workout/formatTimeInput";
import { useGymProfile } from "@/hooks/useGymProfile";
import { ExerciseEditor } from "./ExerciseEditor";

const BLOCK_TYPES: BlockType[] = [
  "interval",
  "tabata",
  "amrap",
  "emom",
  "otm",
  "forTime",
  "basic",
  "rm",
  "fightGoneBad",
  "countdown",
  "countup",
  "rest",
];

// Hoisted out of JSX so the embedded "" characters don't trip the
// react/no-unescaped-entities rule (it only fires on text directly inside
// JSX elements, not on JS string values).
const INTERVAL_HINT =
  'Sin "cada cuánto", el bloque corre con work + descanso como largo de ronda y termina. Configurá "cada cuánto" para que suene la campana al inicio de cada intervalo.';

type CatalogKind = "gym" | "crossfit";

interface BlockEditorProps {
  block: WorkoutBlock;
  index: number;
  onChange: (block: WorkoutBlock) => void;
  onRemove: () => void;
  errors?: string[];
  overrides?: UserExerciseOverride[];
}

function secondsToTimeValue(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function timeValueToSeconds(value: string): number | null {
  if (!value) return null;
  const parts = value.split(":");
  if (parts.length < 2 || parts.length > 3) return null;
  const nums = parts.map(Number);
  if (nums.some((n) => Number.isNaN(n))) return null;
  const [h, m = 0, s = 0] = parts.length === 2 ? [nums[0], nums[1]] : nums;
  if (m >= 60 || s >= 60) return null;
  return h * 3600 + m * 60 + s;
}

interface TimeInputProps {
  ariaLabel: string;
  seconds: number;
  onChangeSeconds: (seconds: number) => void;
}

function TimeInput({ ariaLabel, seconds, onChangeSeconds }: TimeInputProps) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
      <Input
        aria-label={ariaLabel}
        type="time"
        step={1}
        value={secondsToTimeValue(seconds)}
        onChange={(e) => {
          const parsed = timeValueToSeconds(e.target.value);
          if (parsed !== null) onChangeSeconds(parsed);
        }}
        className="flex-1 min-w-0"
      />
      {seconds > 0 && (
        <span className="text-xs text-phosphor-dim font-tactical whitespace-nowrap">
          = {formatTimeInput(seconds)}
        </span>
      )}
    </div>
  );
}

export function BlockEditor({
  block,
  index,
  onChange,
  onRemove,
  errors = [],
  overrides,
}: BlockEditorProps) {
  const [catalogKind, setCatalogKind] = useState<CatalogKind>("gym");
  const catalog = catalogKind === "gym" ? EXERCISE_CATALOG : CROSSFIT_CATALOG;
  const effectiveCatalog = getEffectiveCatalog(catalog, overrides ?? []);
  const profile = useGymProfile();
  const typeInfo = BLOCK_TYPE_INFO[block.type];
  const isBasic = block.type === "basic";
  const isRm = block.type === "rm";
  const isFgb = block.type === "fightGoneBad";
  const requiresExercises = typeInfo.requiresExercises;
  const noExercisesHint = typeInfo.noExercisesHint;
  const isIntervalCycling = block.type === "interval" || block.type === "tabata" || block.type === "emom" || block.type === "otm";
  // EMOM/OTM get an optional "cada cuánto" (interval cap) so each round can
  // trigger the start-of-interval bell. The hint surfaces when the user
  // leaves it blank, since the engine silently falls back to work+rest as
  // the round length.
  const isCyclingWithInterval = block.type === "emom" || block.type === "otm";
  const showWorkRest = !isBasic && !isRm && !isFgb && isIntervalCycling;
  const showDuration = !isBasic && !isRm && !isFgb && !showWorkRest;
  const hasErrors = errors.length > 0;
  const blockEstimatedSeconds = estimateWorkoutDurationSeconds({ blocks: [block] });

  return (
    <Card className={`space-y-3 ${hasErrors ? "!border-danger-500" : ""}`}>
      <p className="font-tactical text-xs uppercase tracking-widest text-brand-500">
        BLOQUE {index} · {BLOCK_TYPE_INFO[block.type].label.toUpperCase()}
      </p>

      <div className="flex items-center gap-2">
        <Select
          aria-label="Tipo de bloque"
          value={block.type}
          onChange={(e) => {
            const type = e.target.value as BlockType;
            if (type === "rest") {
              // Rest blocks are a single-shot duration; rounds don't apply.
              // Strip any stale value so the engine doesn't carry dead data
              // (older drafts or quick re-types might have left rounds set).
              onChange({ ...block, type, rounds: undefined });
              return;
            }
            if (
              !block.workSeconds &&
              (type === "interval" || type === "tabata" || type === "emom" || type === "otm")
            ) {
              // Prefill work/rest from the gym profile defaults so a box that
              // always uses the same cadence doesn't retype it per block.
              onChange({
                ...block,
                type,
                ...(profile?.defaultWorkSeconds
                  ? { workSeconds: profile.defaultWorkSeconds }
                  : {}),
                ...(profile?.defaultRestSeconds ? { restSeconds: profile.defaultRestSeconds } : {}),
              });
              return;
            }
            onChange({ ...block, type });
          }}
          className="flex-1"
        >
          {BLOCK_TYPES.map((type) => (
            <option key={type} value={type}>
              {BLOCK_TYPE_INFO[type].label}
            </option>
          ))}
        </Select>
        <Button variant="ghost" type="button" onClick={onRemove} aria-label="Quitar bloque">
          <Icon name="trash" />
          Quitar
        </Button>
      </div>

      <p className="text-xs text-phosphor-dim italic">{BLOCK_TYPE_INFO[block.type].description}</p>

      {showDuration && (
        <div className="space-y-1">
          <TimeInput
            ariaLabel="Duración"
            seconds={block.durationSeconds}
            onChangeSeconds={(seconds) => onChange({ ...block, durationSeconds: seconds })}
          />
        </div>
      )}

      {isRm && (
        <div className="space-y-2">
          <p className="font-tactical text-xs uppercase tracking-widest text-phosphor-muted">
            TIMECAP
          </p>
          <TimeInput
            ariaLabel="Timcap"
            seconds={block.durationSeconds}
            onChangeSeconds={(seconds) => onChange({ ...block, durationSeconds: seconds })}
          />
        </div>
      )}

      {isFgb && (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <p className="font-tactical text-xs uppercase tracking-widest text-phosphor-muted">
                Rondas
              </p>
              <Input
                aria-label="Rondas"
                type="number"
                value={block.rounds ?? ""}
                onChange={(e) => onChange({ ...block, rounds: Number(e.target.value) })}
                placeholder="3"
              />
            </div>
            <div className="space-y-1">
              <p className="font-tactical text-xs uppercase tracking-widest text-phosphor-muted">
                Estación
              </p>
              <TimeInput
                ariaLabel="Segundos por estación"
                seconds={block.stationSeconds ?? 0}
                onChangeSeconds={(seconds) => onChange({ ...block, stationSeconds: seconds })}
              />
            </div>
            <div className="space-y-1">
              <p className="font-tactical text-xs uppercase tracking-widest text-phosphor-muted">
                Descanso
              </p>
              <TimeInput
                ariaLabel="Descanso entre rondas"
                seconds={block.roundRestSeconds ?? 0}
                onChangeSeconds={(seconds) => onChange({ ...block, roundRestSeconds: seconds })}
              />
            </div>
          </div>
        </div>
      )}

      {showWorkRest && (
        <div className="space-y-2">
          <div className={`grid gap-2 ${isCyclingWithInterval ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}>
            <div className="space-y-1">
              <TimeInput
                ariaLabel="Segundos de trabajo"
                seconds={block.workSeconds ?? 0}
                onChangeSeconds={(seconds) => onChange({ ...block, workSeconds: seconds })}
              />
            </div>
            <div className="space-y-1">
              <TimeInput
                ariaLabel="Segundos de descanso"
                seconds={block.restSeconds ?? 0}
                onChangeSeconds={(seconds) => onChange({ ...block, restSeconds: seconds })}
              />
            </div>
            <Input
              aria-label="Rondas"
              type="number"
              value={block.rounds ?? ""}
              onChange={(e) => onChange({ ...block, rounds: Number(e.target.value) })}
              placeholder="Rondas"
            />
            {isCyclingWithInterval && (
              <div className="space-y-1">
                <p className="font-tactical text-xs uppercase tracking-widest text-phosphor-muted">
                  Cada cuánto
                </p>
                <TimeInput
                  ariaLabel="Cada cuánto"
                  seconds={block.intervalSeconds ?? 0}
                  onChangeSeconds={(seconds) =>
                    onChange({ ...block, intervalSeconds: seconds || undefined })
                  }
                />
              </div>
            )}
          </div>
          {isCyclingWithInterval && !block.intervalSeconds && (
            <p className="text-xs text-phosphor-muted italic mt-1">{INTERVAL_HINT}</p>
          )}
        </div>
      )}

      {isBasic && (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <TimeInput
              ariaLabel="Tiempo de ejercicio"
              seconds={block.workSeconds ?? 0}
              onChangeSeconds={(seconds) => onChange({ ...block, workSeconds: seconds })}
            />
          </div>
          <div className="space-y-1">
            <TimeInput
              ariaLabel="Tiempo de pausa"
              seconds={block.restSeconds ?? 0}
              onChangeSeconds={(seconds) => onChange({ ...block, restSeconds: seconds })}
            />
          </div>
          <Input
            aria-label="Cantidad de series"
            type="number"
            value={block.rounds ?? ""}
            onChange={(e) => onChange({ ...block, rounds: Number(e.target.value) })}
            placeholder="Cantidad de series"
          />
          <Input
            aria-label="Reps por serie"
            type="number"
            value={block.repsPerRound ?? ""}
            onChange={(e) => onChange({ ...block, repsPerRound: Number(e.target.value) })}
            placeholder="Reps por serie"
          />
        </div>
      )}

      <p className="text-sm text-phosphor-dim font-tactical inline-flex items-center gap-2">
        <Icon name="clock" />
        <span>Tiempo total estimado: {formatEstimateMinutes(blockEstimatedSeconds)}</span>
      </p>

      {!requiresExercises && noExercisesHint && (
        <p className="text-xs text-phosphor-dim italic">{noExercisesHint}</p>
      )}

      {requiresExercises && (
        <>
          <div className="flex gap-2">
            <Button
              type="button"
              size="md"
              variant={catalogKind === "gym" ? "primary" : "secondary"}
              aria-pressed={catalogKind === "gym"}
              onClick={() => setCatalogKind("gym")}
            >
              Gimnasio
            </Button>
            <Button
              type="button"
              size="md"
              variant={catalogKind === "crossfit" ? "primary" : "secondary"}
              aria-pressed={catalogKind === "crossfit"}
              onClick={() => setCatalogKind("crossfit")}
            >
              CrossFit
            </Button>
          </div>

          <div className="space-y-2">
            {block.exercises.map((exercise) => (
              <ExerciseEditor
                key={exercise.id}
                exercise={exercise}
                catalog={effectiveCatalog}
                onChange={(updated) =>
                  onChange({
                    ...block,
                    exercises: block.exercises.map((ex) => (ex.id === exercise.id ? updated : ex)),
                  })
                }
                onRemove={() =>
                  onChange({ ...block, exercises: block.exercises.filter((ex) => ex.id !== exercise.id) })
                }
              />
            ))}
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                onChange({
                  ...block,
                  exercises: [...block.exercises, { id: crypto.randomUUID(), name: effectiveCatalog[0].name }],
                })
              }
            >
              + Agregar ejercicio
            </Button>
          </div>
        </>
      )}

      {hasErrors && (
        <ul className="text-danger-500 text-sm space-y-1">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}
    </Card>
  );
}
