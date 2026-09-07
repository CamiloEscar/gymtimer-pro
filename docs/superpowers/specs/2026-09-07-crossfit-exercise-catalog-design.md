# GymTimer Pro — Catálogo de ejercicios CrossFit (diseño técnico)

Extiende el trabajo de `docs/superpowers/specs/2026-09-05-exercise-catalog-ux-i18n-design.md`
(catálogo genérico de gimnasio, ya implementado: `EXERCISE_CATALOG`,
`groupCatalogByCategory`, `ExerciseEditor` con `<Select>` por optgroups). Este
ciclo agrega un segundo catálogo especializado en movimientos de CrossFit,
seleccionable por bloque mediante un toggle.

## 1. Alcance

- Nuevo catálogo estático de movimientos de CrossFit, independiente del
  catálogo genérico de gimnasio existente.
- Toggle "Gimnasio / CrossFit" a nivel de bloque (`BlockEditor`), que decide
  qué catálogo se ofrece en el `<Select>` de cada `ExerciseEditor` de ese bloque.
- El toggle es estado transitorio de UI: no se persiste, no toca el modelo de
  datos (`WorkoutBlock`, `Exercise`) ni la validación.

## 2. Datos — nuevo catálogo

Nuevo archivo `src/lib/workout/exerciseCatalogCrossfit.ts`, mismo shape que el
catálogo existente (reutiliza el tipo `CatalogExercise` de `exerciseCatalog.ts`
y la función `groupCatalogByCategory`, sin duplicarlos):

```ts
import type { CatalogExercise } from "./exerciseCatalog";

export const CROSSFIT_CATALOG: CatalogExercise[] = [
  // Weightlifting
  { id: "cf-wl-01", name: "Back Squat", category: "Weightlifting" },
  { id: "cf-wl-02", name: "Front Squat", category: "Weightlifting" },
  { id: "cf-wl-03", name: "Overhead Squat", category: "Weightlifting" },
  { id: "cf-wl-04", name: "Deadlift", category: "Weightlifting" },
  { id: "cf-wl-05", name: "Sumo Deadlift High Pull", category: "Weightlifting" },
  { id: "cf-wl-06", name: "Clean", category: "Weightlifting" },
  { id: "cf-wl-07", name: "Power Clean", category: "Weightlifting" },
  { id: "cf-wl-08", name: "Hang Clean", category: "Weightlifting" },
  { id: "cf-wl-09", name: "Clean & Jerk", category: "Weightlifting" },
  { id: "cf-wl-10", name: "Snatch", category: "Weightlifting" },
  { id: "cf-wl-11", name: "Power Snatch", category: "Weightlifting" },
  { id: "cf-wl-12", name: "Hang Snatch", category: "Weightlifting" },
  { id: "cf-wl-13", name: "Thruster", category: "Weightlifting" },
  { id: "cf-wl-14", name: "Push Press", category: "Weightlifting" },
  { id: "cf-wl-15", name: "Push Jerk", category: "Weightlifting" },
  { id: "cf-wl-16", name: "Split Jerk", category: "Weightlifting" },

  // Gymnastics
  { id: "cf-gy-01", name: "Pull-up", category: "Gymnastics" },
  { id: "cf-gy-02", name: "Chest-to-Bar Pull-up", category: "Gymnastics" },
  { id: "cf-gy-03", name: "Muscle-up", category: "Gymnastics" },
  { id: "cf-gy-04", name: "Ring Dip", category: "Gymnastics" },
  { id: "cf-gy-05", name: "Handstand Push-up", category: "Gymnastics" },
  { id: "cf-gy-06", name: "Handstand Walk", category: "Gymnastics" },
  { id: "cf-gy-07", name: "Toes-to-Bar", category: "Gymnastics" },
  { id: "cf-gy-08", name: "Knees-to-Elbows", category: "Gymnastics" },
  { id: "cf-gy-09", name: "Pistol Squat", category: "Gymnastics" },
  { id: "cf-gy-10", name: "Air Squat", category: "Gymnastics" },
  { id: "cf-gy-11", name: "Push-up", category: "Gymnastics" },
  { id: "cf-gy-12", name: "Rope Climb", category: "Gymnastics" },
  { id: "cf-gy-13", name: "L-Sit", category: "Gymnastics" },
  { id: "cf-gy-14", name: "Ring Row", category: "Gymnastics" },
  { id: "cf-gy-15", name: "GHD Sit-up", category: "Gymnastics" },

  // Monostructural/Cardio
  { id: "cf-mo-01", name: "Row", category: "Monostructural/Cardio" },
  { id: "cf-mo-02", name: "Assault Bike", category: "Monostructural/Cardio" },
  { id: "cf-mo-03", name: "Ski Erg", category: "Monostructural/Cardio" },
  { id: "cf-mo-04", name: "Run", category: "Monostructural/Cardio" },
  { id: "cf-mo-05", name: "Double-Under", category: "Monostructural/Cardio" },
  { id: "cf-mo-06", name: "Single-Under", category: "Monostructural/Cardio" },
  { id: "cf-mo-07", name: "Burpee", category: "Monostructural/Cardio" },
  { id: "cf-mo-08", name: "Burpee Box Jump Over", category: "Monostructural/Cardio" },
  { id: "cf-mo-09", name: "Wall Ball Shot", category: "Monostructural/Cardio" },
  { id: "cf-mo-10", name: "Kettlebell Swing", category: "Monostructural/Cardio" },
  { id: "cf-mo-11", name: "Box Jump", category: "Monostructural/Cardio" },
  { id: "cf-mo-12", name: "Farmers Carry", category: "Monostructural/Cardio" },
  { id: "cf-mo-13", name: "Sled Push", category: "Monostructural/Cardio" },
  { id: "cf-mo-14", name: "Shuttle Run", category: "Monostructural/Cardio" },
];
```

Nombres en inglés técnico sin traducir: es la convención universal en
CrossFit incluso en boxes hispanohablantes (nadie dice "Arranque" en una
clase). Contrasta deliberadamente con el catálogo genérico, que sí está en
español — ambos catálogos conviven con esa asimetría de idioma.

`exerciseCatalogCrossfit.ts` no define su propia `groupCatalogByCategory`:
importa y reutiliza la de `exerciseCatalog.ts`.

## 3. UI — toggle por bloque

`BlockEditor.tsx` agrega:

```ts
const [catalogKind, setCatalogKind] = useState<"gym" | "crossfit">("gym");
const catalog = catalogKind === "gym" ? EXERCISE_CATALOG : CROSSFIT_CATALOG;
```

- Toggle visual (dos botones tipo tab, o un `<Select>` de dos opciones —
  a criterio del implementador según el sistema de componentes existente)
  arriba de la lista de `ExerciseEditor` del bloque, con labels "Gimnasio" /
  "CrossFit".
- `catalog` se pasa como prop a cada `ExerciseEditor` del bloque.
- Es `useState` local del componente `BlockEditor`: no se persiste en
  `WorkoutBlock`, no viaja a localStorage, no se sincroniza entre
  dispositivos. Al recargar la página o reabrir el workout para editar,
  vuelve a "Gimnasio" por defecto — los ejercicios ya elegidos en bloques
  existentes no se ven afectados, porque el toggle solo filtra qué opciones
  mostrar al **agregar/cambiar** un ejercicio, no valida contra el nombre ya
  guardado.

## 4. Cambio en `ExerciseEditor.tsx`

Hoy (`src/components/workout/ExerciseEditor.tsx:4,15`) importa
`EXERCISE_CATALOG` y computa `CATALOG_BY_CATEGORY` a nivel de módulo,
hardcodeado al catálogo genérico. Pasa a:

```ts
interface ExerciseEditorProps {
  exercise: Exercise;
  catalog: CatalogExercise[]; // NUEVO — reemplaza el import hardcodeado
  onChange: (exercise: Exercise) => void;
  onRemove: () => void;
}
```

`CATALOG_BY_CATEGORY` se computa dentro del componente vía
`groupCatalogByCategory(catalog)` (o memoizado con `useMemo`, a criterio del
implementador) en vez de a nivel de módulo. El resto del `<Select>` con
optgroups queda idéntico — no cambia estructura visual, solo la fuente de
datos.

## 5. Fuera de alcance explícito

- Mezclar catálogo gym y crossfit dentro del mismo bloque (el toggle es
  exclusivo, no aditivo).
- Persistir la elección del toggle en el modelo de datos o localStorage.
- Traducir los nombres de movimientos de CrossFit al español.
- Campos de RX/Scaled, porcentajes de 1RM, o pesos prescritos por movimiento.
- Plantillas de benchmark WODs (Fran, Murph, Grace, Cindy, etc.) — este
  ciclo es solo el catálogo de movimientos individuales, no workouts
  predefinidos.
- Cambios al catálogo genérico de gimnasio existente.
