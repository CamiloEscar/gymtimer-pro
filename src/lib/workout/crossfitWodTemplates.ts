import type { Workout, WorkoutBlock } from "@/types";

// A ready-to-run routine minus identity fields: cloning assigns id/createdAt
// and the template stays immutable (instantiateTemplate deep-clones blocks).
export interface WorkoutTemplate {
  name: string;
  description: string;
  blocks: WorkoutBlock[];
}

// Classic CrossFit benchmark WODs. Exercise names MUST match the catalogs
// (exerciseCatalog*.ts) exactly so cloned routines stay editable in
// ExerciseEditor and video resolution by name keeps working. Known gaps use
// the closest catalog name: Annie's Sit-up renders as "GHD Sit-up" and DT's
// Hang Power Clean as "Hang Clean" (no exact catalog entry for either).
// weightKg carries standard men's RX loads; the trainer can edit after cloning.
export const CROSSFIT_WOD_TEMPLATES: WorkoutTemplate[] = [
  {
    name: "Fran",
    description:
      "21-15-9 por tiempo — Thruster 43/30 kg + Pull-up. El clásico de los clásicos.",
    blocks: [
      {
        id: "b1",
        type: "forTime",
        durationSeconds: 300,
        rounds: 3,
        exercises: [
          {
            id: "e1",
            name: "Thruster",
            weightKg: 43,
            repScheme: { start: 21, step: -6, min: 9 },
          },
          {
            id: "e2",
            name: "Pull-up",
            repScheme: { start: 21, step: -6, min: 9 },
          },
        ],
      },
    ],
  },
  {
    name: "Cindy",
    description:
      "AMRAP 20 min — 5 Pull-up + 10 Push-up + 15 Air Squat. Ritmo constante, sin quemarse.",
    blocks: [
      {
        id: "b1",
        type: "amrap",
        durationSeconds: 1200,
        rounds: 1,
        exercises: [
          { id: "e1", name: "Pull-up", reps: 5 },
          { id: "e2", name: "Push-up", reps: 10 },
          { id: "e3", name: "Air Squat", reps: 15 },
        ],
      },
    ],
  },
  {
    name: "Annie",
    description:
      "50-40-30-20-10 por tiempo — Double-Under + Sit-up. Cuerda y gimnasia, sin descanso.",
    blocks: [
      {
        id: "b1",
        type: "forTime",
        durationSeconds: 300,
        rounds: 5,
        exercises: [
          {
            id: "e1",
            name: "Double-Under",
            repScheme: { start: 50, step: -10, min: 10 },
          },
          {
            id: "e2",
            name: "GHD Sit-up",
            repScheme: { start: 50, step: -10, min: 10 },
          },
        ],
      },
    ],
  },
  {
    name: "Helen",
    description:
      "3 rondas por tiempo — 400 m de corrida + 21 Kettlebell Swing 24 kg + 12 Pull-up.",
    blocks: [
      {
        id: "b1",
        type: "forTime",
        durationSeconds: 600,
        rounds: 3,
        exercises: [
          {
            id: "e1",
            name: "Run",
            metricKind: "distanceMeters",
            distanceMeters: 400,
          },
          { id: "e2", name: "Kettlebell Swing", reps: 21, weightKg: 24 },
          { id: "e3", name: "Pull-up", reps: 12 },
        ],
      },
    ],
  },
  {
    name: "Grace",
    description: "30 Clean & Jerk por tiempo — 61/43 kg. Rápido y sin cortar.",
    blocks: [
      {
        id: "b1",
        type: "forTime",
        durationSeconds: 300,
        exercises: [{ id: "e1", name: "Clean & Jerk", reps: 30, weightKg: 61 }],
      },
    ],
  },
  {
    name: "Isabel",
    description:
      "30 Snatch por tiempo — 61/43 kg. Técnica antes que velocidad.",
    blocks: [
      {
        id: "b1",
        type: "forTime",
        durationSeconds: 300,
        exercises: [{ id: "e1", name: "Snatch", reps: 30, weightKg: 61 }],
      },
    ],
  },
  {
    name: "DT",
    description:
      "5 rondas por tiempo — 12 Deadlift + 9 Hang Power Clean + 6 Push Jerk a 70/47 kg. Una sola barra.",
    blocks: [
      {
        id: "b1",
        type: "forTime",
        durationSeconds: 600,
        rounds: 5,
        exercises: [
          { id: "e1", name: "Deadlift", reps: 12, weightKg: 70 },
          { id: "e2", name: "Hang Clean", reps: 9, weightKg: 70 },
          { id: "e3", name: "Push Jerk", reps: 6, weightKg: 70 },
        ],
      },
    ],
  },
  {
    name: "Murph",
    description:
      "Por tiempo — 1 milla de corrida, 100 Pull-up, 200 Push-up, 300 Air Squat y otra milla. El héroe.",
    blocks: [
      {
        id: "b1",
        type: "forTime",
        durationSeconds: 3600,
        rounds: 1,
        exercises: [
          {
            id: "e1",
            name: "Run",
            metricKind: "distanceMeters",
            distanceMeters: 1609,
          },
          { id: "e2", name: "Pull-up", reps: 100 },
          { id: "e3", name: "Push-up", reps: 200 },
          { id: "e4", name: "Air Squat", reps: 300 },
          {
            id: "e5",
            name: "Run",
            metricKind: "distanceMeters",
            distanceMeters: 1609,
          },
        ],
      },
    ],
  },
  {
    name: "Fight Gone Bad",
    description:
      "3 rondas — 1 min por estación (Wall Ball 9 kg, Sumo Deadlift High Pull 34 kg, Box Jump, Push Press 34 kg y Row) + 1 min de descanso. Máximas reps.",
    blocks: [
      {
        id: "b1",
        type: "fightGoneBad",
        durationSeconds: 0,
        rounds: 3,
        stationSeconds: 60,
        roundRestSeconds: 60,
        exercises: [
          { id: "e1", name: "Wall Ball Shot", weightKg: 9 },
          { id: "e2", name: "Sumo Deadlift High Pull", weightKg: 34 },
          { id: "e3", name: "Box Jump" },
          { id: "e4", name: "Push Press", weightKg: 34 },
          { id: "e5", name: "Row", metricKind: "calories" },
        ],
      },
    ],
  },
  {
    name: "Kelly",
    description:
      "5 rondas por tiempo — 400 m de corrida + 30 Box Jump + 30 Wall Ball.",
    blocks: [
      {
        id: "b1",
        type: "forTime",
        durationSeconds: 1200,
        rounds: 5,
        exercises: [
          {
            id: "e1",
            name: "Run",
            metricKind: "distanceMeters",
            distanceMeters: 400,
          },
          { id: "e2", name: "Box Jump", reps: 30 },
          { id: "e3", name: "Wall Ball Shot", reps: 30 },
        ],
      },
    ],
  },
];

export function instantiateTemplate(template: WorkoutTemplate): Workout {
  return {
    id: crypto.randomUUID(),
    name: template.name,
    description: template.description,
    createdAt: new Date().toISOString(),
    favorite: false,
    // Deep clone so the saved routine never aliases the template's arrays/objects.
    blocks: structuredClone(template.blocks),
  };
}
