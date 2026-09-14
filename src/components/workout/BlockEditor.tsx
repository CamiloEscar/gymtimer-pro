"use client";

import { useEffect, useRef, useState } from "react";
import type { BlockType, UserExerciseOverride, WorkoutBlock } from "@/types";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { EXERCISE_CATALOG, getEffectiveCatalog } from "@/lib/workout/exerciseCatalog";
import { CROSSFIT_CATALOG } from "@/lib/workout/exerciseCatalogCrossfit";
import { WEIGHTLIFTING_CATALOG } from "@/lib/workout/exerciseCatalogWeightlifting";
import { estimateWorkoutDurationSeconds, formatEstimateMinutes } from "@/lib/workout/estimateWorkoutDurationSeconds";
import { BLOCK_TYPES, BLOCK_TYPE_INFO } from "@/lib/workout/blockTypeInfo";
import { formatTimeInput } from "@/lib/workout/formatTimeInput";
import { useGymProfile } from "@/hooks/useGymProfile";
import { ExerciseEditor } from "./ExerciseEditor";

// Hoisted out of JSX so the embedded "" characters don't trip the
// react/no-unescaped-entities rule (it only fires on text directly inside
// JSX elements, not on JS string values).
const INTERVAL_HINT =
  'Sin "cada cuánto", el bloque corre con work + descanso como largo de ronda y termina. Configurá "cada cuánto" para que suene la campana al inicio de cada intervalo.';

type CatalogKind = "gym" | "crossfit" | "weightlifting";

const CATALOGS = {
  gym: EXERCISE_CATALOG,
  crossfit: CROSSFIT_CATALOG,
  weightlifting: WEIGHTLIFTING_CATALOG,
} as const;

interface BlockEditorProps {
  block: WorkoutBlock;
  index: number;
  onChange: (block: WorkoutBlock) => void;
  onRemove: () => void;
  errors?: string[];
  overrides?: UserExerciseOverride[];
}

interface TimeInputProps {
  ariaLabel: string;
  seconds: number;
  onChangeSeconds: (seconds: number) => void;
  // Widget used to enter the value. Prototype of "modos distintos de colocar
  // el tiempo": numeric keyboard for precise technical values, a scrollable
  // wheel for short ranges, a bar for "duration feel" (AMRAP long windows).
  // The editor shows a small switcher so the trainer can swap per field while
  // we validate which widget fits which cadence.
  variant?: TimeInputVariant;
}

export type TimeInputVariant = "numeric" | "wheel" | "slider";

const TIME_WHEEL_STEP = 5;
const TIME_WHEEL_MAX = 1800; // 30 min cap — long enough for any block window
const TIME_WHEEL_VALUES: number[] = [];
for (let s = 0; s <= TIME_WHEEL_MAX; s += TIME_WHEEL_STEP) {
  TIME_WHEEL_VALUES.push(s);
}

const VARIANT_LABELS: Record<TimeInputVariant, string> = {
  numeric: "123",
  wheel: "Rueda",
  slider: "Barra",
};

function TimeInput({ ariaLabel, seconds, onChangeSeconds, variant = "numeric" }: TimeInputProps) {
  const [mode, setMode] = useState<TimeInputVariant>(variant);
  const wheelRef = useRef<HTMLDivElement>(null);
  const total = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(total / 60);
  const secs = total % 60;

  // Center the selected value in the scrollable wheel whenever it changes.
  // guard: scrollIntoView is not implemented in jsdom (tests run headless).
  useEffect(() => {
    if (mode !== "wheel" || !wheelRef.current) return;
    const el = wheelRef.current.querySelector<HTMLElement>(`[data-seconds="${total}"]`);
    if (el && typeof el.scrollIntoView === "function") {
      el.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
    }
  }, [total, mode]);

  if (mode === "slider") {
    return (
      <div role="group" aria-label={ariaLabel} className="flex flex-col gap-1">
        <div className="flex items-center gap-1">
          <input
            aria-label={ariaLabel}
            type="range"
            min={0}
            max={TIME_WHEEL_MAX}
            step={TIME_WHEEL_STEP}
            value={Math.min(total, TIME_WHEEL_MAX)}
            onChange={(e) => onChangeSeconds(Number(e.target.value))}
            className="w-full accent-brand-500"
          />
        </div>
        <span className="text-xs text-phosphor-dim font-tactical whitespace-nowrap">
          = {formatTimeInput(total)}
        </span>
        <VariantSwitcher ariaLabel={ariaLabel} mode={mode} onModeChange={setMode} />
      </div>
    );
  }

  if (mode === "wheel") {
    return (
      <div role="group" aria-label={ariaLabel} className="flex flex-col gap-1">
        <div
          ref={wheelRef}
          className="flex h-12 items-center overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {TIME_WHEEL_VALUES.map((value) => (
            <button
              key={value}
              type="button"
              data-seconds={value}
              aria-pressed={total === value}
              onClick={() => onChangeSeconds(value)}
              className={`shrink-0 w-16 font-tactical tabular-nums transition-colors cursor-pointer ${
                total === value ? "text-brand-500 text-base" : "text-phosphor-dim text-sm hover:text-phosphor"
              }`}
            >
              {formatTimeInput(value)}
            </button>
          ))}
        </div>
        <span className="text-xs text-phosphor-dim font-tactical whitespace-nowrap">
          = {formatTimeInput(total)}
        </span>
        <VariantSwitcher ariaLabel={ariaLabel} mode={mode} onModeChange={setMode} />
      </div>
    );
  }

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2"
    >
      <div className="flex items-center gap-1">
        <Input
          aria-label={`${ariaLabel} minutos`}
          type="number"
          inputMode="numeric"
          min={0}
          value={minutes}
          // iOS numpads place the cursor at the START of a prefilled "0",
          // so typing a digit appends BEFORE it (5 renders "50"). Selecting
          // everything on focus makes the first keystroke replace the old
          // value instead of prepending to it.
          onFocus={(e) => e.currentTarget.select()}
          onChange={(e) => onChangeSeconds(Number(e.target.value || 0) * 60 + secs)}
          className="w-16 text-center"
        />
        <span className="text-phosphor-dim text-sm">:</span>
        <Input
          aria-label={`${ariaLabel} segundos`}
          type="number"
          inputMode="numeric"
          min={0}
          max={59}
          value={secs}
          onFocus={(e) => e.currentTarget.select()}
          onChange={(e) => onChangeSeconds(minutes * 60 + Number(e.target.value || 0))}
          className="w-16 text-center"
        />
      </div>
      {seconds > 0 && (
        <span className="text-xs text-phosphor-dim font-tactical whitespace-nowrap">
          = {formatTimeInput(seconds)}
        </span>
      )}
      <VariantSwitcher ariaLabel={ariaLabel} mode={mode} onModeChange={setMode} />
    </div>
  );
}

function VariantSwitcher({
  ariaLabel,
  mode,
  onModeChange,
}: {
  ariaLabel: string;
  mode: TimeInputVariant;
  onModeChange: (mode: TimeInputVariant) => void;
}) {
  return (
    <div className="inline-flex items-center gap-0.5">
      {(Object.keys(VARIANT_LABELS) as TimeInputVariant[]).map((variantMode) => (
        <button
          key={variantMode}
          type="button"
          aria-label={`${ariaLabel}: ${VARIANT_LABELS[variantMode]}`}
          aria-pressed={mode === variantMode}
          onClick={() => onModeChange(variantMode)}
          className={`rounded px-1.5 py-0.5 text-[10px] font-tactical uppercase tracking-wider transition-colors cursor-pointer ${
            mode === variantMode
              ? "text-brand-500 bg-brand-500/10"
              : "text-phosphor-dim hover:text-phosphor"
          }`}
        >
          {VARIANT_LABELS[variantMode]}
        </button>
      ))}
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
  const catalog = CATALOGS[catalogKind];
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
    <Card className={`space-y-3 p-4 ${hasErrors ? "!border-danger-500" : ""}`}>
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
              {BLOCK_TYPE_INFO[type].label} {BLOCK_TYPE_INFO[type].selectHint}
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
            variant="slider"
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
            variant="slider"
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
                variant="wheel"
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
                variant="wheel"
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
                variant="wheel"
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
          <div className="flex gap-2 flex-wrap">
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
            <Button
              type="button"
              size="md"
              variant={catalogKind === "weightlifting" ? "primary" : "secondary"}
              aria-pressed={catalogKind === "weightlifting"}
              onClick={() => setCatalogKind("weightlifting")}
            >
              Weightlifting
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
