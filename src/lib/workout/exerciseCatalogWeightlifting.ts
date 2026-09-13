import type { CatalogExercise } from "./exerciseCatalog";

// Standalone weightlifting catalog — federated lifts outside the CrossFit
// weightlifting subset (cf-wl-*). Reuses the existing /public/exercises/
// videos where the id matches so the run page can show a thumbnail during
// squats/deadlifts without shipping new assets yet. Exercises without a
// video id render the dumbbell fallback in the library and skip the video
// player on the run page.
//
// ponytail: 8 federated lifts to start. When you want to expand the catalog
// (olympic variations, paused/elevated variants, bodybuilding accessories)
// add them here — same shape, no other wiring needed.
export const WEIGHTLIFTING_CATALOG: CatalogExercise[] = [
  {
    id: "wl-01",
    videoUrl: "/exercises/cf-wl-01.mp4",
    name: "Back Squat",
    category: "Weightlifting",
    description:
      "Barra en espalda alta, pies al ancho de hombros. Bajá hasta profundidad con torso estable y subí firme sin perder el brace.",
  },
  {
    id: "wl-02",
    videoUrl: "/exercises/cf-wl-02.mp4",
    name: "Front Squat",
    category: "Weightlifting",
    description:
      "Barra al frente sobre los deltoides, codos altos. Bajá con torso erguido y subí manteniendo la posición de la barra.",
  },
  {
    id: "wl-03",
    videoUrl: undefined,
    name: "Bench Press",
    category: "Weightlifting",
    description:
      "Acostado en banco plano, pies firmes, omóplatos retraídos. Bajá la barra al pecho con control y empujá en línea recta.",
  },
  {
    id: "wl-04",
    videoUrl: undefined,
    name: "Conventional Deadlift",
    category: "Weightlifting",
    description:
      "Pies al ancho de cadera, barra sobre el medio pie. Espalda neutra, empujá el piso con las piernas y extendé cadera arriba.",
  },
  {
    id: "wl-05",
    videoUrl: "/exercises/cf-wl-09.mp4",
    name: "Overhead Press",
    category: "Weightlifting",
    description:
      "Barra al frente a los hombros, brace firme. Empujá la barra recto arriba pasando la cara, cabeza por debajo al lockout.",
  },
  {
    id: "wl-06",
    videoUrl: undefined,
    name: "Pendlay Row",
    category: "Weightlifting",
    description:
      "Barra al piso en cada rep, torso paralelo, tirá explosivo al abdomen bajo manteniendo el ángulo de torso. Sin rebote.",
  },
  {
    id: "wl-07",
    videoUrl: undefined,
    name: "Sumo Deadlift",
    category: "Weightlifting",
    description:
      "Stance ancho, pies向外, manos dentro. Abrí caderas y empujá el piso; el trabajo principal es de piernas y aductores.",
  },
  {
    id: "wl-08",
    videoUrl: "/exercises/cf-wl-12.mp4",
    name: "Power Clean",
    category: "Weightlifting",
    description:
      "Setup como deadlift. Tirá explosivo, catching en front rack con codos altos a media sentadilla. Stand up firme.",
  },
];
