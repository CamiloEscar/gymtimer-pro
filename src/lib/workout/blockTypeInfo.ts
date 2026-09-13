import type { BlockType } from "@/types";

export const BLOCK_TYPE_INFO: Record<
  BlockType,
  {
    label: string;
    selectHint: string;
    description: string;
    requiresExercises: boolean;
    noExercisesHint?: string;
  }
> = {
  amrap: {
    label: "AMRAP",
    selectHint: "(tantas rondas como puedas)",
    description: "Tantas rondas como puedas en N minutos.",
    requiresExercises: true,
  },
  emom: {
    label: "EMOM",
    selectHint: "(cada minuto, las reps indicadas)",
    description: "Cada minuto hacé las reps indicadas. Descanso lo que sobre.",
    requiresExercises: true,
  },
  otm: {
    label: "OTM",
    selectHint: "(cada X tiempo, las reps)",
    description: "Cada X tiempo hacé las reps. Descanso lo que sobre.",
    requiresExercises: true,
  },
  tabata: {
    label: "TABATA",
    selectHint: "(20s trabajo · 10s descanso · 8 rondas)",
    description: "20 seg trabajo · 10 seg descanso · 8 rondas (podés ajustar todo).",
    requiresExercises: true,
  },
  forTime: {
    label: "FOR TIME",
    selectHint: "(completalo lo más rápido posible)",
    description: "Completá el trabajo lo más rápido posible.",
    requiresExercises: true,
  },
  countdown: {
    label: "Cuenta regresiva",
    selectHint: "(cuenta atrás desde el tiempo que definas)",
    description: "Timer simple que cuenta hacia atrás desde el tiempo que definas.",
    requiresExercises: false,
    noExercisesHint: "Solo configurá cuánto dura el timer.",
  },
  countup: {
    label: "Cuenta progresiva",
    selectHint: "(contá hacia arriba, pará cuando quieras)",
    description: "Timer que cuenta hacia arriba; pará cuando quieras.",
    requiresExercises: false,
    noExercisesHint: "Solo configurá el tiempo que querés contar.",
  },
  interval: {
    label: "Intervalo",
    selectHint: "(trabajo/descanso por rondas)",
    description: "Bloques de trabajo/descanso por N rondas.",
    requiresExercises: true,
  },
  basic: {
    label: "Básico",
    selectHint: "(series con tiempo y reps)",
    description: "Series con tiempo de ejercicio, pausa y reps por serie.",
    requiresExercises: false,
    noExercisesHint: "Los bloques básicos no necesitan ejercicios específicos — solo tiempo y reps.",
  },
  rest: {
    label: "Descanso",
    selectHint: "(solo pausa)",
    description: "Solo pausa. Útil entre bloques.",
    requiresExercises: false,
    noExercisesHint: "Solo configurá cuánto dura el descanso.",
  },
  rm: {
    label: "RM",
    selectHint: "(máxima reps en el tiempo que definas)",
    description: "Cantidad máxima de reps en el tiempo que definas.",
    requiresExercises: true,
  },
  fightGoneBad: {
    label: "FIGHT GONE BAD",
    selectHint: "(estaciones rotativas con descanso)",
    description: "Rondas de estaciones rotativas con descanso entre rondas.",
    requiresExercises: true,
  },
};
