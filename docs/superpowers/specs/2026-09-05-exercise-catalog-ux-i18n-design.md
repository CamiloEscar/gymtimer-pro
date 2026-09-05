# GymTimer Pro — Catálogo de ejercicios, Display, UX y localización (diseño técnico)

Ronda de pulido posterior al MVP (ver `docs/superpowers/plans/2026-09-04-gymtimer-pro-mvp.md`,
14 tareas, ya completadas y commiteadas). No agrega features del roadmap de fases
posteriores: son ajustes de UX, datos y localización sobre lo ya construido.
La app sigue siendo 100% cliente (localStorage + BroadcastChannel, sin backend) y
despliega en el dominio gratuito `*.vercel.app` de Vercel — no hay cambios de diseño
específicos de despliegue en este ciclo.

## 1. Alcance de este ciclo

- Parte 1: catálogo estático de ejercicios + campo `sets` faltante en el tipo `Exercise`
  + rework de `ExerciseEditor`.
- Parte 2: Display muestra la lista de ejercicios del bloque actual (sin inventar
  lógica de "ejercicio activo" que el WorkoutEngine no soporta hoy).
- Parte 3: auditoría de UX con fixes concretos por pantalla (confirmaciones,
  contadores, feedback visual de errores, copiar código, indicador de conexión).
- Parte 4: localización completa a español de todo el texto visible al usuario.

## 2. Parte 1 — Modelo de datos y catálogo de ejercicios

### 2.1 Cambio al tipo `Exercise`

`src/types/workout.ts` gana un único campo nuevo, `sets`. Es el único dato que
falta: `reps`, `weightKg` y `notes` ya existen en el tipo pero están muertos en la UI.

```ts
export interface Exercise {
  id: string;
  name: string;
  reps?: number;
  sets?: number;          // NUEVO
  timeSeconds?: number;   // sin uso — reservado a futuro, no se toca
  distanceMeters?: number; // sin uso — reservado a futuro, no se toca
  weightKg?: number;
  notes?: string;
}
```

`timeSeconds` y `distanceMeters` quedan reservados para casos de uso futuros
(ejercicios por tiempo o distancia) y no se tocan en este ciclo.

### 2.2 Catálogo estático de ejercicios

Nuevo archivo `src/lib/workout/exerciseCatalog.ts`: lista estática de
~40-50 ejercicios comunes en español, agrupados por categoría.

```ts
export interface CatalogExercise {
  id: string;
  name: string;
  category: string;
}
```

Categorías: Piernas, Pecho, Espalda, Core, Cardio/Funcional, Hombros/Brazos.

### 2.3 Rework de `ExerciseEditor.tsx`

- El input de texto libre para `name` se reemplaza por un `<Select>` (componente
  `ui/Select.tsx` existente) con un `<optgroup>` por categoría, poblado desde
  `exerciseCatalog.ts`.
- Se agregan tres campos nuevos al editor, junto al de Reps que ya existe:
  - Series (`sets`, numérico)
  - Peso/kg (`weightKg`, numérico)
  - Notas (`notes`, texto)
- "+ Add exercise" en `BlockEditor.tsx` deja de inicializar `name: ""`; ahora
  inicializa con el `name` de la primera entrada del catálogo, ya que el campo
  pasó a ser select-driven y no de texto libre.

### 2.4 Validación

Las 4 reglas existentes en `validateWorkout.ts` (nombre de workout requerido,
≥1 bloque, ≥1 ejercicio por bloque, `rounds > 0` en interval/tabata/emom) quedan
sin cambios. No se agrega validación nueva para `sets`, `weightKg` ni `notes`:
son campos opcionales sin restricciones de negocio en este ciclo.

## 3. Parte 2 — Display: lista de ejercicios del bloque actual

### 3.1 Decisión de alcance

Se descarta explícitamente introducir un concepto de "ejercicio activo único" en
el `WorkoutEngine` — no hay datos reales de timing por ejercicio que lo respalden
(`currentExerciseIndex` sigue hardcodeado a `0`, sin lógica real de avance).
En su lugar, `DisplayScreen` muestra la lista completa de ejercicios del bloque
actual: `state.workout.blocks[state.currentBlockIndex].exercises`.

No hay cambios al `WorkoutEngine` ni a la lógica de sincronización: el dato ya
viaja en el `SessionState` compartido por `SessionChannel`/`BroadcastChannel`,
solo hace falta leerlo y renderizarlo.

### 3.2 Ubicación y formato

Nueva sección en `DisplayScreen.tsx`, entre `PhaseIndicator` y `RoundIndicator`
(o debajo de `RoundIndicator` — a criterio del implementador según mejor
balance visual; el timer debe seguir siendo el elemento dominante).

Formato por línea:

```
NOMBRE · Nreps · Sseries · Pkg
```

Se omite cualquier segmento cuyo campo no esté seteado (nunca "· undefined"
ni "· 0kg" como placeholder).

### 3.3 Casos especiales

- Si el bloque actual es de tipo `"rest"`, la sección de lista de ejercicios se
  oculta por completo (`PhaseIndicator` ya muestra "DESCANSO").
- Máximo 4 líneas de ejercicio visibles; si el bloque tiene más, se trunca con
  un indicador "+N más" en vez de reducir más el tamaño de fuente o scrollear.

### 3.4 Tipografía

El timer principal sigue siendo el elemento dominante (~10rem o más). Las
líneas de la lista de ejercicios usan un tamaño menor, alrededor de 2.5-3rem,
manteniendo legibilidad a distancia de gimnasio.

## 4. Parte 3 — Auditoría de UX (fixes por pantalla)

### 4.1 Landing (`/`)

Sin cambios.

### 4.2 Dashboard (`/app`)

El mensaje de estado vacío en `WorkoutOfTheDay` ("no hay entrenamiento del día")
gana un botón/link de CTA directo a `/app/workouts/new`, en vez de ser solo texto.

### 4.3 Library (`/app/workouts`)

- **Confirmación de borrado:** hoy `delete` no tiene ninguna confirmación. Se
  agrega una confirmación con el componente `Modal` existente
  ("¿Eliminar '{nombre}'? Esta acción no se puede deshacer") antes de llamar a
  `repo.delete(id)`.
- Limpieza menor de labels/aria-labels de los botones de acción (ligado a la
  localización de la Parte 4).

### 4.4 Workout Builder

- Con el nuevo editor de ejercicios de 4 campos (nombre/reps/series/peso) más
  notas, `ExerciseEditor` pasa de una fila flex única a un layout de grid de
  2 columnas, para no amontonar campos en pantallas angostas.
- Se agrega un contador de bloques/ejercicios en el header del builder (ej.
  "3 bloques · 7 ejercicios") para dar contexto sobre la extensión del workout.
- Los errores de validación se asocian visualmente al bloque/campo específico
  que falló (ej. borde rojo en la card del bloque afectado), en vez de solo
  una lista de texto plana arriba del formulario.

### 4.5 Panel del entrenador (`/run`)

- **Confirmación de RESET:** hoy no tiene ninguna confirmación. Se aplica el
  mismo patrón de `Modal` que en el borrado de la Library, ya que resetear a
  mitad de una clase hace perder el progreso.
- Se agrega un botón "copiar código" al lado del código de sesión (usando la
  Clipboard API) para que el entrenador no tenga que seleccionar el texto a mano.

### 4.6 Display

- El indicador de estado de conexión ("Conectado"/"Desconectado") pasa de texto
  chico solo, a un punto de color + texto, para mejor contraste y visibilidad.

**Explícitamente fuera de alcance en esta sección** (no se tocan):
la arquitectura de BroadcastChannel mismo-dispositivo, los métodos de beep sin
cablear del `AudioManager` (`playCountdownBeep`, `playRoundChange`, etc.), y un
rediseño visual completo del Display.

## 5. Parte 4 — Localización completa a español

Alcance: únicamente texto visible al usuario (labels, placeholders,
aria-labels, headings, texto de botones). Nombres de código, variables y tipos
quedan en inglés sin cambios.

### `workout/ExerciseEditor.tsx`

| Antes | Después |
|---|---|
| aria-label "Exercise name" | "Ejercicio" (ahora etiqueta el `<Select>` de catálogo) |
| aria-label "Remove exercise" | "Quitar ejercicio" |
| — | aria-labels nuevos: "Series", "Peso (kg)", "Notas" |
| "Reps" | sin cambios (ya de uso común en fitness en español) |

### `workout/BlockEditor.tsx`

| Antes | Después |
|---|---|
| "Block type" | "Tipo de bloque" |
| "Duration (seconds)" | "Duración (segundos)" |
| aria-label "Work seconds" | "Segundos de trabajo" |
| aria-label "Rest seconds" | "Segundos de descanso" |
| aria-label "Rounds" | "Rondas" |
| placeholder "Work (s)" | "Trabajo (s)" |
| placeholder "Rest (s)" | "Descanso (s)" |
| placeholder "Rounds" | "Rondas" |
| "+ Add exercise" | "+ Agregar ejercicio" |
| "Remove block" | "Quitar bloque" |

### `workout/WorkoutBuilder.tsx`

| Antes | Después |
|---|---|
| aria-label "Workout name" | "Nombre del entrenamiento" |
| placeholder "Workout name (e.g. Murph Training)" | "Nombre del entrenamiento (ej: Entrenamiento de Murph)" |
| "+ Add block" | "+ Agregar bloque" |
| "Save workout" | "Guardar entrenamiento" |

### `workout/WorkoutList.tsx`

| Antes | Después |
|---|---|
| "No workouts yet. Create your first one." | "Todavía no hay entrenamientos. Creá el primero." |

### `workout/WorkoutCard.tsx`

| Antes | Después |
|---|---|
| "▶ Run" | "▶ Iniciar" |
| "✏ Edit" | "✏ Editar" |

### `dashboard/WorkoutOfTheDay.tsx`

| Antes | Después |
|---|---|
| texto de estado vacío | "Todavía no hay entrenamiento del día — creá uno." (más el CTA de la sección 4.2) |
| "Workout of the day" | "Entrenamiento del día" |
| "Start" | "Iniciar" |

### `dashboard/RecentWorkouts.tsx`

| Antes | Después |
|---|---|
| "Recent workouts" | "Entrenamientos recientes" |

### `timer/TimerControls.tsx`

| Antes | Después |
|---|---|
| "START" | "INICIAR" |
| "PAUSE" | "PAUSAR" |
| "RESUME" | "REANUDAR" |
| "RESET" | "REINICIAR" |
| "◀ PREVIOUS" | "◀ ANTERIOR" |
| "NEXT ▶" | "SIGUIENTE ▶" |
| "-10 SEC" / "+10 SEC" | "-10 SEG" / "+10 SEG" |

### `timer/PhaseIndicator.tsx`

| Antes | Después |
|---|---|
| "GET READY" | "PREPARATE" |
| "WORK" | "TRABAJO" |
| "REST" | "DESCANSO" |
| "TIME" | "TIEMPO" |

### `timer/RoundIndicator.tsx`

| Antes | Después |
|---|---|
| "ROUND {n} / {total}" | "RONDA {n} / {total}" |

### `display/DisplayScreen.tsx`

| Antes | Después |
|---|---|
| "Connected" / "Disconnected" | "Conectado" / "Desconectado" |
| "Toggle fullscreen" | "Pantalla completa" |
| "WORKOUT COMPLETE" | "ENTRENAMIENTO COMPLETADO" |

### `display/DisplayConnection.tsx`

| Antes | Después |
|---|---|
| "CONNECTED ✓" | "CONECTADO ✓" |
| "Waiting for coach…" | "Esperando al entrenador…" |

### `app/app/workouts/page.tsx`

| Antes | Después |
|---|---|
| "Workouts" | "Entrenamientos" |
| "+ New workout" | "+ Nuevo entrenamiento" |

### `app/app/workouts/[id]/page.tsx` y `run/page.tsx`

| Antes | Después |
|---|---|
| "Loading…" | "Cargando…" |
| "Workout not found." | "Entrenamiento no encontrado." |
| "Display code:" | "Código de pantalla:" |
| "open display" | "abrir pantalla" (más el botón de copiar de la sección 4.5) |

### `app/display/page.tsx`

| Antes | Después |
|---|---|
| "Open a display" | "Abrir una pantalla" |
| "Connection code" | "Código de conexión" |
| "Connect" | "Conectar" |

### `app/layout.tsx`

| Antes | Después |
|---|---|
| `lang="en"` | `lang="es"` |
| metadata title "Create Next App" (boilerplate de Next.js sin editar) | "GymTimer Pro" |

## 6. Fuera de alcance explícito (este ciclo)

- Escape hatch de "otro ejercicio personalizado" con texto libre en el
  selector de catálogo — se eligió catálogo cerrado, sin fallback custom,
  para esta ronda.
- Lógica real de timing/avance por ejercicio individual en `WorkoutEngine`.
- Rediseño visual completo del Display.
- Sincronización entre dispositivos físicos más allá de `BroadcastChannel`
  mismo-navegador.
- Cableado de los métodos de beep sin usar del `AudioManager`.
