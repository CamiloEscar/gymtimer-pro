import type { Exercise, Workout, WorkoutBlock } from "@/types";
import { BLOCK_TYPE_INFO } from "./blockTypeInfo";
import { isChipper, isLadderType } from "./repScheme";

export interface ValidationError {
  message: string;
  blockId?: string;
}

// repScheme geometry (spec R7): step must actually move, and the clamp at
// min must have room to work — a descending ladder starting below min and an
// ascending ladder starting above min are degenerate (clamp from the first
// round) and rejected.
function validateRepScheme(block: WorkoutBlock, errors: ValidationError[]): void {
  const scheme = block.repScheme;
  if (!scheme) return;

  if (!isLadderType(block.type)) {
    errors.push({
      message: "La escalera solo se usa en bloques AMRAP, FOR TIME, EMOM u OTM",
      blockId: block.id,
    });
    return;
  }

  if (isChipper(block)) {
    errors.push({ message: "La escalera no se combina con un circuito (chipper)", blockId: block.id });
    return;
  }

  const isValidNumber = (n: number) => Number.isFinite(n);
  if (
    !isValidNumber(scheme.start) ||
    !isValidNumber(scheme.step) ||
    !isValidNumber(scheme.min) ||
    scheme.min < 0
  ) {
    errors.push({ message: "La escalera necesita inicio, paso y mínimo válidos", blockId: block.id });
    return;
  }

  if (scheme.step === 0) {
    errors.push({ message: "El paso de la escalera no puede ser 0", blockId: block.id });
    return;
  }

  if (scheme.step < 0 && scheme.start < scheme.min) {
    errors.push({
      message: "En una escalera descendente el inicio debe ser mayor o igual al mínimo",
      blockId: block.id,
    });
    return;
  }

  if (scheme.step > 0 && scheme.start > scheme.min) {
    errors.push({
      message: "En una escalera ascendente el inicio debe ser menor o igual al mínimo",
      blockId: block.id,
    });
    return;
  }

  // Spec R3: per-exercise reps on a ladder are FORBIDDEN. The ladder is the
  // ONE shared cadencia for every station; a per-exercise `reps` would be dead
  // data (formatExerciseLine already ignores it under a repScheme) and is a
  // sign of authoring confusion, so it is rejected here at save time.
  for (const exercise of block.exercises) {
    if (exercise.reps !== undefined) {
      errors.push({
        message: `Con escalera las reps las define el bloque, no "${exercise.name}"`,
        blockId: block.id,
      });
    }
  }
}

// Metric amounts (spec R7): reps and per-exercise timeSeconds are whole
// non-negative counts; distanceMeters and calories are non-negative decimals.
function validateMetricAmounts(block: WorkoutBlock, errors: ValidationError[]): void {
  for (const exercise of block.exercises) {
    validateExerciseAmount(exercise, block, errors);
  }
}

function validateExerciseAmount(exercise: Exercise, block: WorkoutBlock, errors: ValidationError[]): void {
  if (exercise.reps !== undefined && (!Number.isInteger(exercise.reps) || exercise.reps < 0)) {
    errors.push({
      message: `Las reps de "${exercise.name}" deben ser un número entero mayor o igual a 0`,
      blockId: block.id,
    });
  }
  if (
    exercise.distanceMeters !== undefined &&
    (!Number.isFinite(exercise.distanceMeters) || exercise.distanceMeters < 0)
  ) {
    errors.push({
      message: `La distancia de "${exercise.name}" debe ser un número mayor o igual a 0`,
      blockId: block.id,
    });
  }
  if (
    exercise.calories !== undefined &&
    (!Number.isFinite(exercise.calories) || exercise.calories < 0)
  ) {
    errors.push({
      message: `Las calorías de "${exercise.name}" deben ser un número mayor o igual a 0`,
      blockId: block.id,
    });
  }
  if (
    exercise.timeSeconds !== undefined &&
    (!Number.isInteger(exercise.timeSeconds) || exercise.timeSeconds < 0)
  ) {
    errors.push({
      message: `El tiempo de "${exercise.name}" debe ser un número entero mayor o igual a 0`,
      blockId: block.id,
    });
  }
}

export function validateWorkout(workout: Workout): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!workout.name.trim()) {
    errors.push({ message: "El nombre es obligatorio" });
  }

  if (workout.blocks.length === 0) {
    errors.push({ message: "Agregá al menos un bloque" });
  }

  for (const block of workout.blocks) {
    const requiresExercises = BLOCK_TYPE_INFO[block.type].requiresExercises;
    if (requiresExercises && block.exercises.length === 0) {
      errors.push({ message: "Cada bloque necesita al menos un ejercicio", blockId: block.id });
    }
    const needsRounds =
      block.type === "interval" ||
      block.type === "tabata" ||
      block.type === "emom" ||
      block.type === "otm" ||
      block.type === "fightGoneBad";
    if (needsRounds && (block.rounds ?? 0) <= 0) {
      errors.push({ message: "Las rondas deben ser mayores a 0", blockId: block.id });
    }
    // forTime rounds are optional (absent = 1 pass / chipper); once set they
    // must describe a real loop.
    if (block.type === "forTime" && block.rounds !== undefined && block.rounds < 1) {
      errors.push({ message: "Las rondas deben ser mayores a 0", blockId: block.id });
    }
    if (block.type === "rm" && block.durationSeconds <= 0) {
      errors.push({ message: "El timecap debe ser mayor a 0", blockId: block.id });
    }
    validateRepScheme(block, errors);
    validateMetricAmounts(block, errors);
  }

  return errors;
}