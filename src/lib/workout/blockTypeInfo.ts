import type { BlockType } from "@/types";

export const BLOCK_TYPE_INFO: Record<
  BlockType,
  {
    label: string;
    description: string;
    requiresExercises: boolean;
    noExercisesHint?: string;
  }
> = {
  amrap: {
    label: "AMRAP",
    description: "Tantas rondas como puedas en N minutos.",
    requiresExercises: true,
  },
  emom: {
    label: "EMOM",
    description: "Cada minuto hacé las reps indicadas. Descanso lo que sobre.",
    requiresExercises: true,
  },
  tabata: {
    label: "TABATA",
    description: "20 seg trabajo · 10 seg descanso · 8 rondas (podés ajustar todo).",
    requiresExercises: true,
  },
  forTime: {
    label: "FOR TIME",
    description: "Completá el trabajo lo más rápido posible.",
    requiresExercises: true,
  },
  countdown: {
    label: "Cuenta regresiva",
    description: "Timer simple que cuenta hacia atrás desde el tiempo que definas.",
    requiresExercises: false,
    noExercisesHint: "Solo configurá cuánto dura el timer.",
  },
  countup: {
    label: "Cuenta progresiva",
    description: "Timer que cuenta hacia arriba; pará cuando quieras.",
    requiresExercises: false,
    noExercisesHint: "Solo configurá el tiempo que querés contar.",
  },
  interval: {
    label: "Intervalo",
    description: "Bloques de trabajo/descanso por N rondas.",
    requiresExercises: true,
  },
  basic: {
    label: "Básico",
    description: "Series con tiempo de ejercicio, pausa y reps por serie.",
    requiresExercises: false,
    noExercisesHint: "Los bloques básicos no necesitan ejercicios específicos — solo tiempo y reps.",
  },
  rest: {
    label: "Descanso",
    description: "Solo pausa. Útil entre bloques.",
    requiresExercises: false,
    noExercisesHint: "Solo configurá cuánto dura el descanso.",
  },
};
