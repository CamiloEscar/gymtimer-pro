export interface CatalogExercise {
  id: string;
  name: string;
  category: string;
}

export const EXERCISE_CATALOG: CatalogExercise[] = [
  // Piernas
  { id: "leg-01", name: "Sentadilla", category: "Piernas" },
  { id: "leg-02", name: "Sentadilla búlgara", category: "Piernas" },
  { id: "leg-03", name: "Zancada", category: "Piernas" },
  { id: "leg-04", name: "Peso muerto", category: "Piernas" },
  { id: "leg-05", name: "Peso muerto rumano", category: "Piernas" },
  { id: "leg-06", name: "Hip thrust", category: "Piernas" },
  { id: "leg-07", name: "Prensa de piernas", category: "Piernas" },
  { id: "leg-08", name: "Elevación de talones", category: "Piernas" },
  { id: "leg-09", name: "Sentadilla goblet", category: "Piernas" },
  { id: "leg-10", name: "Step up", category: "Piernas" },

  // Pecho
  { id: "chest-01", name: "Press banca", category: "Pecho" },
  { id: "chest-02", name: "Press banca inclinado", category: "Pecho" },
  { id: "chest-03", name: "Flexiones de brazos", category: "Pecho" },
  { id: "chest-04", name: "Aperturas con mancuernas", category: "Pecho" },
  { id: "chest-05", name: "Fondos en paralelas", category: "Pecho" },
  { id: "chest-06", name: "Press con mancuernas", category: "Pecho" },
  { id: "chest-07", name: "Cruce de poleas", category: "Pecho" },
  { id: "chest-08", name: "Flexiones declinadas", category: "Pecho" },

  // Espalda
  { id: "back-01", name: "Dominadas", category: "Espalda" },
  { id: "back-02", name: "Remo con barra", category: "Espalda" },
  { id: "back-03", name: "Remo con mancuerna", category: "Espalda" },
  { id: "back-04", name: "Jalón al pecho", category: "Espalda" },
  { id: "back-05", name: "Peso muerto sumo", category: "Espalda" },
  { id: "back-06", name: "Remo en polea baja", category: "Espalda" },
  { id: "back-07", name: "Face pull", category: "Espalda" },
  { id: "back-08", name: "Superman", category: "Espalda" },

  // Core
  { id: "core-01", name: "Plancha", category: "Core" },
  { id: "core-02", name: "Abdominales", category: "Core" },
  { id: "core-03", name: "Elevación de piernas", category: "Core" },
  { id: "core-04", name: "Russian twist", category: "Core" },
  { id: "core-05", name: "Plancha lateral", category: "Core" },
  { id: "core-06", name: "Mountain climbers", category: "Core" },
  { id: "core-07", name: "Rueda abdominal", category: "Core" },
  { id: "core-08", name: "Hollow hold", category: "Core" },

  // Cardio/Funcional
  { id: "cardio-01", name: "Burpees", category: "Cardio/Funcional" },
  { id: "cardio-02", name: "Jumping jacks", category: "Cardio/Funcional" },
  { id: "cardio-03", name: "Cuerda para saltar", category: "Cardio/Funcional" },
  { id: "cardio-04", name: "Remo (máquina)", category: "Cardio/Funcional" },
  { id: "cardio-05", name: "Wall balls", category: "Cardio/Funcional" },
  { id: "cardio-06", name: "Kettlebell swing", category: "Cardio/Funcional" },
  { id: "cardio-07", name: "Box jump", category: "Cardio/Funcional" },
  { id: "cardio-08", name: "Sprint", category: "Cardio/Funcional" },

  // Hombros/Brazos
  { id: "arms-01", name: "Press militar", category: "Hombros/Brazos" },
  { id: "arms-02", name: "Elevaciones laterales", category: "Hombros/Brazos" },
  { id: "arms-03", name: "Curl de bíceps", category: "Hombros/Brazos" },
  { id: "arms-04", name: "Extensión de tríceps", category: "Hombros/Brazos" },
  { id: "arms-05", name: "Press Arnold", category: "Hombros/Brazos" },
  { id: "arms-06", name: "Elevaciones frontales", category: "Hombros/Brazos" },
  { id: "arms-07", name: "Curl martillo", category: "Hombros/Brazos" },
  { id: "arms-08", name: "Fondos de tríceps en banco", category: "Hombros/Brazos" },
];

export function groupCatalogByCategory(
  catalog: CatalogExercise[]
): Record<string, CatalogExercise[]> {
  return catalog.reduce<Record<string, CatalogExercise[]>>((acc, exercise) => {
    if (!acc[exercise.category]) acc[exercise.category] = [];
    acc[exercise.category].push(exercise);
    return acc;
  }, {});
}
