import type { UserExerciseOverride } from "@/types";

export interface CatalogExercise {
  id: string;
  name: string;
  category: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  description?: string;
}

export const EXERCISE_CATALOG: CatalogExercise[] = [
  // Piernas
  {
    id: "leg-01",
    name: "Sentadilla",
    category: "Piernas",
    description:
      "Piernas flexionadas, espalda neutra. Bajá hasta que los muslos queden paralelos al piso y subí controlado.",
  },
  {
    id: "leg-02",
    name: "Sentadilla búlgara",
    category: "Piernas",
    description:
      "Un pie atrás elevado en banco, rodilla delantera baja hasta cerca del piso y empujás arriba.",
  },
  {
    id: "leg-03",
    name: "Zancada",
    category: "Piernas",
    description:
      "Paso largo adelante, rodilla trasera cerca del piso. Empujá con el talón delantero para subir.",
  },
  {
    id: "leg-04",
    name: "Peso muerto",
    category: "Piernas",
    description:
      "Pies al ancho de cadera, barra cerca de las tibias. Espalda neutra y cadera atrás al bajar.",
  },
  {
    id: "leg-05",
    name: "Peso muerto rumano",
    category: "Piernas",
    description:
      "Barra al frente, bajada corta con piernas casi rectas y empuje desde talones con cadera atrás.",
  },
  {
    id: "leg-06",
    name: "Hip thrust",
    category: "Piernas",
    description:
      "Espalda alta en banco, barra apoyada sobre cadera. Empujá hacia arriba contrayendo glúteos.",
  },
  {
    id: "leg-07",
    name: "Prensa de piernas",
    category: "Piernas",
    description:
      "Sentado en máquina, pies al ancho de hombros. Empujá la plataforma sin bloquear rodillas.",
  },
  {
    id: "leg-08",
    name: "Elevación de talones",
    category: "Piernas",
    description:
      "De pie con puntas en elevación, subí talones contrayendo gemelos y bajá controlado.",
  },
  {
    id: "leg-09",
    name: "Sentadilla goblet",
    category: "Piernas",
    description:
      "Sostén mancuerna o kettlebell al pecho, sentadilla profunda con torso erguido.",
  },
  {
    id: "leg-10",
    name: "Step up",
    category: "Piernas",
    description:
      "Pie firme en cajón, subí empujando con talón y rodilla. Bajá controlado sin perder el equilibrio.",
  },

  // Pecho
  {
    id: "chest-01",
    name: "Press banca",
    category: "Pecho",
    description:
      "Acostado en banco, agarre medio. Bajá la barra al pecho con control y empujá arriba.",
  },
  {
    id: "chest-02",
    name: "Press banca inclinado",
    category: "Pecho",
    description:
      "Banco inclinado a 30°, barra al pecho alto. Empujá con foco en la parte superior del pectoral.",
  },
  {
    id: "chest-03",
    name: "Flexiones de brazos",
    category: "Pecho",
    description:
      "Manos al ancho de hombros, cuerpo en línea. Bajá el pecho al piso y empujá firme.",
  },
  {
    id: "chest-04",
    name: "Aperturas con mancuernas",
    category: "Pecho",
    description:
      "Brazos levemente flexionados, abrí las mancuernas al nivel del pecho y cerrá contrayendo.",
  },
  {
    id: "chest-05",
    name: "Fondos en paralelas",
    category: "Pecho",
    description:
      "En paralelas, cuerpo levemente inclinado al frente. Bajá flexionando codos y empujá arriba.",
  },
  {
    id: "chest-06",
    name: "Press con mancuernas",
    category: "Pecho",
    description:
      "En banco, empujá mancuernas desde el pecho con trayectoria levemente arqueada hacia el centro.",
  },
  {
    id: "chest-07",
    name: "Cruce de poleas",
    category: "Pecho",
    description:
      "De pie frente a poleas, manos juntas al centro. Abrí y cerrá manteniendo tensión constante.",
  },
  {
    id: "chest-08",
    name: "Flexiones declinadas",
    category: "Pecho",
    description:
      "Pies elevados en banco, manos al piso. Bajá el pecho entre las manos y empujá arriba.",
  },

  // Espalda
  {
    id: "back-01",
    name: "Dominadas",
    category: "Espalda",
    description:
      "Agarre prono, tiré del cuerpo hasta pasar la barra por encima de la clavícula con codos altos.",
  },
  {
    id: "back-02",
    name: "Remo con barra",
    category: "Espalda",
    description:
      "Piernas flexionadas, espalda neutra. Tirá de la barra al abdomen contrayendo dorsal.",
  },
  {
    id: "back-03",
    name: "Remo con mancuerna",
    category: "Espalda",
    description:
      "Una mano y rodilla en banco, tiré de la mancuerna a la cadera con codo pegado al cuerpo.",
  },
  {
    id: "back-04",
    name: "Jalón al pecho",
    category: "Espalda",
    description:
      "Sentado en polea, tiré del agarre al pecho alto abriendo los codos y contrayendo espalda.",
  },
  {
    id: "back-05",
    name: "Peso muerto sumo",
    category: "Espalda",
    description:
      "Agarre amplio, piernas abiertas. Levantá la barra desde el piso bloqueando arriba con cadera.",
  },
  {
    id: "back-06",
    name: "Remo en polea baja",
    category: "Espalda",
    description:
      "Sentado en polea baja, tiré del mango al abdomen con piernas semiflexionadas y torso fijo.",
  },
  {
    id: "back-07",
    name: "Face pull",
    category: "Espalda",
    description:
      "Polea alta con cuerda al rostro. Tirá hacia la cara separando manos al final del movimiento.",
  },
  {
    id: "back-08",
    name: "Superman",
    category: "Espalda",
    description:
      "Acostado boca abajo, brazos al frente. Elevá brazos y piernas contrayendo espalda baja.",
  },

  // Core
  {
    id: "core-01",
    name: "Plancha",
    category: "Core",
    description:
      "Apoyado en antebrazos y puntas, cuerpo en línea. Mantené la posición sin caer la cadera.",
  },
  {
    id: "core-02",
    name: "Abdominales",
    category: "Core",
    description:
      "Acostado boca arriba, rodillas flexionadas. Subí el torso hacia las rodillas contrayendo abdomen.",
  },
  {
    id: "core-03",
    name: "Elevación de piernas",
    category: "Core",
    description:
      "Colgado o acostado, subí piernas rectas hasta 90° y bajá controlado sin tocar el piso.",
  },
  {
    id: "core-04",
    name: "Russian twist",
    category: "Core",
    description:
      "Sentado con torso inclinado, girás el tronco de lado a lado manteniendo el abdomen contraído.",
  },
  {
    id: "core-05",
    name: "Plancha lateral",
    category: "Core",
    description:
      "Apoyado en un antebrazo y lateral del pie, cuerpo en línea. Mantené la posición sin aflojar.",
  },
  {
    id: "core-06",
    name: "Mountain climbers",
    category: "Core",
    description:
      "En plancha, llevá una rodilla al pecho y alterná rápido sin levantar la cadera.",
  },
  {
    id: "core-07",
    name: "Rueda abdominal",
    category: "Core",
    description:
      "Arrodillado, rueda al frente manteniendo abdomen firme. Volvé contrayendo sin arquear espalda.",
  },
  {
    id: "core-08",
    name: "Hollow hold",
    category: "Core",
    description:
      "Acostado, brazos y piernas extendidos. Pegá lumbares al piso formando una curva hueca.",
  },

  // Cardio/Funcional
  {
    id: "cardio-01",
    name: "Burpees",
    category: "Cardio/Funcional",
    description:
      "De pie, bajá a plancha, hacé una flexión y saltá al frente con brazos arriba.",
  },
  {
    id: "cardio-02",
    name: "Jumping jacks",
    category: "Cardio/Funcional",
    description:
      "De pie, saltá lateralmente abriendo y cerrando piernas y brazos en simultáneo, sin pausa.",
  },
  {
    id: "cardio-03",
    name: "Cuerda para saltar",
    category: "Cardio/Funcional",
    description:
      "Saltá la cuerda con muñecas activas y pies juntos, ritmo constante durante el bloque.",
  },
  {
    id: "cardio-04",
    name: "Remo (máquina)",
    category: "Cardio/Funcional",
    description:
      "Sentado en máquina de remo, empujá con piernas primero y terminá tirando con brazos.",
  },
  {
    id: "cardio-05",
    name: "Wall balls",
    category: "Cardio/Funcional",
    description:
      "De pie frente a una pelota medicinal, sentadilla y lanzamiento al punto del muro.",
  },
  {
    id: "cardio-06",
    name: "Kettlebell swing",
    category: "Cardio/Funcional",
    description:
      "Cadera atrás, kettlebell entre piernas. Balanceá desde la cadera con brazos rectos.",
  },
  {
    id: "cardio-07",
    name: "Box jump",
    category: "Cardio/Funcional",
    description:
      "De pie frente a cajón, saltá con ambos pies cayendo suave sobre el cajón con cadera atrás.",
  },
  {
    id: "cardio-08",
    name: "Sprint",
    category: "Cardio/Funcional",
    description:
      "Salida explosiva en línea recta, máxima velocidad durante la distancia marcada.",
  },

  // Hombros/Brazos
  {
    id: "arms-01",
    name: "Press militar",
    category: "Hombros/Brazos",
    description:
      "De pie, barra al frente a la altura de los hombros. Empujá arriba contrayendo hombros y glúteos.",
  },
  {
    id: "arms-02",
    name: "Elevaciones laterales",
    category: "Hombros/Brazos",
    description:
      "Mancuernas al costado, brazos levemente flexionados. Subí hasta nivel del hombro y bajá controlado.",
  },
  {
    id: "arms-03",
    name: "Curl de bíceps",
    category: "Hombros/Brazos",
    description:
      "Mancuernas al frente, subí flexionando codos sin balancear el cuerpo.",
  },
  {
    id: "arms-04",
    name: "Extensión de tríceps",
    category: "Hombros/Brazos",
    description:
      "Mancuerna detrás de la cabeza, codo alto fijo. Extendé el brazo contrayendo tríceps.",
  },
  {
    id: "arms-05",
    name: "Press Arnold",
    category: "Hombros/Brazos",
    description:
      "Mancuernas al frente con palmas hacia vos, abrí al subir y cerrá arriba en press.",
  },
  {
    id: "arms-06",
    name: "Elevaciones frontales",
    category: "Hombros/Brazos",
    description:
      "Mancuernas al frente, subí los brazos rectos hasta la altura del hombro alternando o simultáneo.",
  },
  {
    id: "arms-07",
    name: "Curl martillo",
    category: "Hombros/Brazos",
    description:
      "Mancuernas al costado con palmas enfrentadas. Subí flexionando codos sin rotar el antebrazo.",
  },
  {
    id: "arms-08",
    name: "Fondos de tríceps en banco",
    category: "Hombros/Brazos",
    description:
      "Manos en banco detrás, bajá cadera flexionando codos y empujá contrayendo tríceps.",
  },
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

export function getEffectiveCatalog(
  catalog: CatalogExercise[],
  overrides: UserExerciseOverride[]
): CatalogExercise[] {
  const byId = new Map(overrides.map(({ exerciseId, ...fields }) => [exerciseId, fields]));
  return catalog.map((ex) => ({ ...ex, ...(byId.get(ex.id) ?? {}) }));
}
