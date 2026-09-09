"use client";

import { useState, useEffect } from "react";
import type { BlockType, WorkoutBlock } from "@/types";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EXERCISE_CATALOG } from "@/lib/workout/exerciseCatalog";
import { CROSSFIT_CATALOG } from "@/lib/workout/exerciseCatalogCrossfit";
import { estimateWorkoutDurationSeconds, formatEstimateMinutes } from "@/lib/workout/estimateWorkoutDurationSeconds";
import { BLOCK_TYPE_INFO } from "@/lib/workout/blockTypeInfo";
import { parseTimeInput, formatTimeInput } from "@/lib/workout/parseTimeInput";
import { ExerciseEditor } from "./ExerciseEditor";

const BLOCK_TYPES: BlockType[] = [
  "countdown",
  "countup",
  "amrap",
  "emom",
  "interval",
  "tabata",
  "forTime",
  "rest",
  "basic",
];

type CatalogKind = "gym" | "crossfit";

interface BlockEditorProps {
  block: WorkoutBlock;
  index: number;
  onChange: (block: WorkoutBlock) => void;
  onRemove: () => void;
  errors?: string[];
}

function timeInputToDisplay(seconds: number): string {
  return seconds > 0 ? formatTimeInput(seconds) : "";
}

interface TimeInputProps {
  ariaLabel: string;
  seconds: number;
  onChangeSeconds: (seconds: number) => void;
  placeholder?: string;
}

function TimeInput({ ariaLabel, seconds, onChangeSeconds, placeholder }: TimeInputProps) {
  const [raw, setRaw] = useState(() => timeInputToDisplay(seconds));
  useEffect(() => {
    setRaw(timeInputToDisplay(seconds));
  }, [seconds]);
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
      <Input
        aria-label={ariaLabel}
        type="text"
        inputMode="numeric"
        value={raw}
        onChange={(e) => {
          const next = e.target.value;
          setRaw(next);
          const parsed = parseTimeInput(next);
          if (parsed !== null) onChangeSeconds(parsed);
        }}
        placeholder={placeholder}
        className="flex-1 min-w-0"
      />
      {seconds > 0 && (
        <span className="text-xs text-gray-400 font-tactical whitespace-nowrap">
          = {formatTimeInput(seconds)}
        </span>
      )}
    </div>
  );
}

export function BlockEditor({ block, index, onChange, onRemove, errors = [] }: BlockEditorProps) {
  const [catalogKind, setCatalogKind] = useState<CatalogKind>("gym");
  const catalog = catalogKind === "gym" ? EXERCISE_CATALOG : CROSSFIT_CATALOG;
  const typeInfo = BLOCK_TYPE_INFO[block.type];
  const isBasic = block.type === "basic";
  const requiresExercises = typeInfo.requiresExercises;
  const noExercisesHint = typeInfo.noExercisesHint;
  const showWorkRest = !isBasic && (block.type === "interval" || block.type === "tabata" || block.type === "emom");
  const showDuration = !isBasic && !showWorkRest;
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
          onChange={(e) => onChange({ ...block, type: e.target.value as BlockType })}
          className="flex-1"
        >
          {BLOCK_TYPES.map((type) => (
            <option key={type} value={type}>
              {BLOCK_TYPE_INFO[type].label}
            </option>
          ))}
        </Select>
        <Button variant="ghost" type="button" onClick={onRemove} aria-label="Quitar bloque">
          🗑
        </Button>
      </div>

      <p className="text-xs text-gray-400 italic">{BLOCK_TYPE_INFO[block.type].description}</p>

      {showDuration && (
        <div className="space-y-1">
          <TimeInput
            ariaLabel="Duración"
            seconds={block.durationSeconds}
            onChangeSeconds={(seconds) => onChange({ ...block, durationSeconds: seconds })}
            placeholder="10:00"
          />
        </div>
      )}

      {showWorkRest && (
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <TimeInput
              ariaLabel="Segundos de trabajo"
              seconds={block.workSeconds ?? 0}
              onChangeSeconds={(seconds) => onChange({ ...block, workSeconds: seconds })}
              placeholder="0:45"
            />
          </div>
          <div className="space-y-1">
            <TimeInput
              ariaLabel="Segundos de descanso"
              seconds={block.restSeconds ?? 0}
              onChangeSeconds={(seconds) => onChange({ ...block, restSeconds: seconds })}
              placeholder="0:15"
            />
          </div>
          <Input
            aria-label="Rondas"
            type="number"
            value={block.rounds ?? ""}
            onChange={(e) => onChange({ ...block, rounds: Number(e.target.value) })}
            placeholder="Rondas"
          />
        </div>
      )}

      {isBasic && (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <TimeInput
              ariaLabel="Tiempo de ejercicio"
              seconds={block.workSeconds ?? 0}
              onChangeSeconds={(seconds) => onChange({ ...block, workSeconds: seconds })}
              placeholder="0:45"
            />
          </div>
          <div className="space-y-1">
            <TimeInput
              ariaLabel="Tiempo de pausa"
              seconds={block.restSeconds ?? 0}
              onChangeSeconds={(seconds) => onChange({ ...block, restSeconds: seconds })}
              placeholder="0:15"
            />
          </div>
          <Input
            aria-label="Cantidad de series"
            type="number"
            value={block.rounds ?? ""}
            onChange={(e) => onChange({ ...block, rounds: Number(e.target.value) })}
            placeholder="🔁 Cantidad de series"
          />
          <Input
            aria-label="Reps por serie"
            type="number"
            value={block.repsPerRound ?? ""}
            onChange={(e) => onChange({ ...block, repsPerRound: Number(e.target.value) })}
            placeholder="💪 Reps por serie"
          />
        </div>
      )}

      <p className="text-sm text-gray-400 font-tactical">
        ⏱ Tiempo total estimado: {formatEstimateMinutes(blockEstimatedSeconds)}
      </p>

      {!requiresExercises && noExercisesHint && (
        <p className="text-xs text-gray-400 italic">{noExercisesHint}</p>
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
                catalog={catalog}
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
                  exercises: [...block.exercises, { id: crypto.randomUUID(), name: catalog[0].name }],
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
