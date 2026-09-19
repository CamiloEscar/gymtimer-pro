import type { CatalogExercise } from "./exerciseCatalog";

// Standalone weightlifting catalog — federated lifts outside the CrossFit
// weightlifting subset (cf-wl-*). Reuses the existing /public/exercises/
// videos where the id matches so the run page can show a thumbnail during
// squats/deadlifts without shipping new assets yet. Exercises without a
// video id render the dumbbell fallback in the library and skip the video
// player on the run page.
//
// isLiftExercise gates the TV barbell display and the bar-size selector in
// the editor: only movements in this catalog carry a bar.
export const WEIGHTLIFTING_CATALOG: CatalogExercise[] = [
  // ---------------------------------------------------------------------------
  // Powerlifting
  // ---------------------------------------------------------------------------
  {
    id: "wl-01",
    videoUrl: "/exercises/cf-wl-01.mp4",
    name: "Back Squat",
    category: "Powerlifting",
    description:
      "Barra en espalda alta, pies al ancho de hombros. Bajá hasta profundidad con torso estable y subí firme sin perder el brace.",
  },
  {
    id: "wl-02",
    videoUrl: "/exercises/cf-wl-02.mp4",
    name: "Front Squat",
    category: "Powerlifting",
    description:
      "Barra al frente sobre los deltoides, codos altos. Bajá con torso erguido y subí manteniendo la posición de la barra.",
  },
  {
    id: "wl-03",
    videoUrl: undefined,
    name: "Bench Press",
    category: "Powerlifting",
    description:
      "Acostado en banco plano, pies firmes, omóplatos retraídos. Bajá la barra al pecho con control y empujá en línea recta.",
  },
  {
    id: "wl-04",
    videoUrl: undefined,
    name: "Conventional Deadlift",
    category: "Powerlifting",
    description:
      "Pies al ancho de cadera, barra sobre el medio pie. Espalda neutra, empujá el piso con las piernas y extendé cadera arriba.",
  },
  {
    id: "wl-05",
    videoUrl: "/exercises/cf-wl-09.mp4",
    name: "Overhead Press",
    category: "Powerlifting",
    description:
      "Barra al frente a los hombros, brace firme. Empujá la barra recto arriba pasando la cara, cabeza por debajo al lockout.",
  },
  {
    id: "wl-07",
    videoUrl: undefined,
    name: "Sumo Deadlift",
    category: "Powerlifting",
    description:
      "Stance ancho, pies mirando hacia afuera, manos dentro. Abrí caderas y empujá el piso; el trabajo principal es de piernas y aductores.",
  },
  // ---------------------------------------------------------------------------
  // Olympic Lifts
  // ---------------------------------------------------------------------------
  {
    id: "wl-08",
    videoUrl: "/exercises/cf-wl-12.mp4",
    name: "Power Clean",
    category: "Olympic Lifts",
    description:
      "Setup como deadlift. Tirá explosivo, catching en front rack con codos altos a media sentadilla. Stand up firme.",
  },
  {
    id: "wl-09",
    videoUrl: undefined,
    name: "Muscle Snatch",
    category: "Olympic Lifts",
    description:
      "Subí la barra directo a overhead sin caer a sentadilla, baja de rodilla para el cierre. Empezás desde los muslos, sin cargada previa.",
  },
  {
    id: "wl-10",
    videoUrl: undefined,
    name: "Muscle Clean",
    category: "Olympic Lifts",
    description:
      "Cargada sin recepción profunda: pasá la barra a front rack con los codos altos y sin caer a sentadilla. Stand up firme.",
  },
  {
    id: "wl-11",
    videoUrl: undefined,
    name: "Snatch Pull",
    category: "Olympic Lifts",
    description:
      "Tirón de arranque: triple extensión explosiva de piernas y cadera, barra pegada al cuerpo hasta poder de los hombros. Sin recepción.",
  },
  {
    id: "wl-12",
    videoUrl: undefined,
    name: "Clean Pull",
    category: "Olympic Lifts",
    description:
      "Tirón de cargada: triple extensión explosiva hasta poder de los hombros, barra pegada al cuerpo y recta. Sin recepción.",
  },
  // ---------------------------------------------------------------------------
  // Lower Body
  // ---------------------------------------------------------------------------
  {
    id: "wl-13",
    videoUrl: undefined,
    name: "Romanian Deadlift",
    category: "Lower Body",
    description:
      "Rodillas suaves, cadera atrás, barra pegada a las piernas bajando hasta el límite de isquiotibiales. Espalda neutra, subí con glúteos.",
  },
  {
    id: "wl-14",
    videoUrl: undefined,
    name: "Barbell Lunge",
    category: "Lower Body",
    description:
      "Zancada con barra en espalda o rack frontal, paso largo y rodilla trasera al piso sin rebotar. Alterná las piernas.",
  },
  {
    id: "wl-15",
    videoUrl: undefined,
    name: "Good Morning",
    category: "Lower Body",
    description:
      "Barra en trampa, rodillas suaves, inclinate con cadera atrás como bisagra hasta sentir isquiotibiales. Subí con glúteos.",
  },
  {
    id: "wl-16",
    videoUrl: undefined,
    name: "Barbell Hip Thrust",
    category: "Lower Body",
    description:
      "Espalda en banco, barra sobre la cadera. Extendé fuerte hasta alinear hombro-cadera-rodilla y apretá glúteos arriba.",
  },
  {
    id: "wl-17",
    videoUrl: undefined,
    name: "Zercher Squat",
    category: "Lower Body",
    description:
      "Barra en el pliegue de los codos, torso erguido. La posición frontal exige core fuerte para subir parejo.",
  },
  // ---------------------------------------------------------------------------
  // Upper Body
  // ---------------------------------------------------------------------------
  {
    id: "wl-06",
    videoUrl: undefined,
    name: "Pendlay Row",
    category: "Upper Body",
    description:
      "Barra al piso en cada rep, torso paralelo, tirá explosivo al abdomen bajo manteniendo el ángulo de torso. Sin rebote.",
  },
  {
    id: "wl-18",
    videoUrl: undefined,
    name: "Incline Bench Press",
    category: "Upper Body",
    description:
      "Banco a 30°, empujá la barra hacia arriba sin despegar los omóplatos. Bajá al pecho alto con control.",
  },
  {
    id: "wl-19",
    videoUrl: undefined,
    name: "Close-Grip Bench Press",
    category: "Upper Body",
    description:
      "Manos al ancho de hombros, codos pegados al torso. Trabaja tríceps y pecho interno sin despegar los omóplatos.",
  },
  {
    id: "wl-20",
    videoUrl: undefined,
    name: "Standing Barbell Curl",
    category: "Upper Body",
    description:
      "Codos fijos al costado, subí controlado sin balanceo de cadera. Bajá lento hasta estirar el bíceps completo.",
  },
  {
    id: "wl-21",
    videoUrl: undefined,
    name: "Upright Row",
    category: "Upper Body",
    description:
      "Tirá la barra pegada al cuerpo hasta el mentón, codos por arriba de las muñecas. Agarre al ancho de hombros.",
  },
  {
    id: "wl-22",
    videoUrl: undefined,
    name: "Skull Crusher",
    category: "Upper Body",
    description:
      "Acostado en banco, bajá la barra a la frente con codos fijos y extendé arriba. Control total en la bajada.",
  },
  {
    id: "wl-23",
    videoUrl: undefined,
    name: "Barbell Shrug",
    category: "Upper Body",
    description:
      "Hombros hacia arriba con fuerza, pausa breve arriba y bajá controlado. Sin girar los hombros.",
  },
  // ---------------------------------------------------------------------------
  // Core & Accessories
  // ---------------------------------------------------------------------------
  {
    id: "wl-24",
    videoUrl: undefined,
    name: "Barbell Rollout",
    category: "Core & Accessories",
    description:
      "De rodillas con agarre cerrado, extendé el cuerpo rodando la barra adelante sin arquear la zona lumbar. Volvé con el core.",
  },
  {
    id: "wl-25",
    videoUrl: undefined,
    name: "Back Extension",
    category: "Core & Accessories",
    description:
      "En banco romano con la barra en trampa o al pecho, subí hasta alinear el torso sin hiperextender. Glúteos arriba.",
  },
  {
    id: "wl-26",
    videoUrl: undefined,
    name: "Barbell Glute Bridge",
    category: "Core & Accessories",
    description:
      "Acostado con la barra sobre la cadera, empujá hasta alinear hombro-cadera-rodilla. Apretá glúteos en el punto alto.",
  },
  {
    id: "wl-27",
    videoUrl: undefined,
    name: "Barbell Step-Up",
    category: "Core & Accessories",
    description:
      "Con barra en espalda, plantá el pie completo en el cajón y subí empujando. Bajá controlado en dos tiempos.",
  },
  {
    id: "wl-28",
    videoUrl: undefined,
    name: "Box Squat",
    category: "Core & Accessories",
    description:
      "Sentarte y levantarte de un cajón enseña impulso de cadera y profundidad. Bajá controlado y parate en seco arriba.",
  },
];

export const WEIGHTLIFTING_NAMES = new Set(
  WEIGHTLIFTING_CATALOG.map((e) => e.name.trim().toLowerCase()),
);

// Spanish gym-catalog barbell movements (bar + plates) share the TV barbell
// display and the bar-size selector even though they live outside the
// weightlifting catalog. Moves done with dumbbells/machines are intentionally
// absent — a loaded bar only renders for actual bar work.
export const GYM_BARBELL_LIFT_NAMES = new Set([
  "sentadilla",
  "peso muerto",
  "peso muerto rumano",
  "peso muerto sumo",
  "hip thrust",
  "press banca",
  "press banca inclinado",
  "press militar",
  "remo con barra",
]);

export function isLiftExercise(name: string): boolean {
  const normalized = name.trim().toLowerCase();
  return WEIGHTLIFTING_NAMES.has(normalized) || GYM_BARBELL_LIFT_NAMES.has(normalized);
}