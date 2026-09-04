# GymTimer Pro — Diseño técnico Fase 1 (MVP)

Fuente de intención de producto: `GYMTIMER-PRO-PROMPT.md` (raíz del repo, 96 secciones).
Este documento traduce ese prompt maestro en decisiones técnicas concretas para el
primer ciclo de implementación. Solo cubre **Fase 1 (MVP)** del roadmap de la Sección 90.

## 1. Alcance de este ciclo

- Solo Fase 1 del roadmap: timer engine, workout engine, workout builder, display,
  audio, persistencia local, responsive, demo. Sin login, sin gimnasios, sin alumnos,
  sin pagos, sin backend.
- **Decisión de alcance clave (resuelve una contradicción del prompt maestro):** la
  Sección 90 pone "control remoto celular→TV" en Fase 2, pero la Sección 94 (criterios
  de aceptación) pide "pausar desde el celular y que la TV lo refleje". Para esta Fase 1
  resolvemos esto como: **Trainer y Display funcionan como pestañas/ventanas del mismo
  navegador o dispositivo**, sincronizadas con `BroadcastChannel` (API nativa, $0, sin
  dependencias). El caso de un celular físico controlando una TV física separada queda
  para Fase 2, cuando se incorpore un canal realtime real (candidato: Supabase Realtime,
  free tier).
- Sin esta acotación, el MVP requeriría backend desde el día 1, violando la Regla 3
  ("no backend pago para lo que se resuelve localmente") y la Regla 10 ("no arquitectura
  excesiva para el MVP") del propio documento.

## 2. Stack

Next.js (App Router) + React + TypeScript + Tailwind CSS. Sin librerías de estado
adicionales (no Redux/Zustand) — el estado del timer/workout vive en engines TS puros,
expuestos a React vía hooks custom con patrón subscribe/notify. Testing con Vitest
(nativo ESM/TS, recomendado por Next.js 15+ sobre Jest — evita agregar configuración
extra, ver Regla 2 del prompt maestro).

## 3. Arquitectura — capas

```
lib/
  timer/    Timer Engine: clase TS pura, basada en timestamps (Date.now()),
            start/pause/resume/reset/skip/addTime/subtractTime/getState().
            No usa setInterval como fuente de verdad (Regla 7).
  workout/  Workout Engine: avanza fases/rondas/ejercicios apoyándose en el
            Timer Engine. No conoce React ni UI.
  audio/    Audio Engine: AudioManager centralizado (Web Audio API +
            Speech Synthesis API opcional). Ningún componente reproduce
            audio directamente.
  storage/  Repository pattern: interfaz WorkoutRepository, implementación
            LocalWorkoutRepository (localStorage) hoy, reemplazable por
            SupabaseWorkoutRepository en Fase 3 sin tocar el resto (Regla 9).
  session/  Session Engine + transporte BroadcastChannel para sincronizar
            Trainer↔Display dentro del mismo origen en Fase 1.
```

Los engines son la fuente de verdad de negocio; los componentes React son
presentacionales y consumen el estado vía hooks (`useTimerEngine`,
`useWorkoutSession`), nunca calculan tiempo por su cuenta (Regla 8).

## 4. Rutas (App Router)

```
/                       Landing
/app                    Dashboard
/app/workouts           Biblioteca de workouts
/app/workouts/new       Workout Builder
/app/workouts/[id]      Editar workout
/app/workouts/[id]/run  Panel de control del timer (vista Trainer)
/display                Generación/selección de código de Display
/display/[code]         Pantalla remota — escucha BroadcastChannel(code)
```

Quedan fuera de este ciclo `/join/[code]` y `/wod/[id]` (sistema de alumnos, Fase 4).

## 5. Componentes

```
components/
  timer/     TimerDisplay, TimerControls, TimerProgress,
             PhaseIndicator, RoundIndicator
  workout/   WorkoutBuilder, BlockEditor, ExerciseEditor,
             WorkoutCard, WorkoutList
  display/   DisplayScreen, DisplayConnection, DisplayQRCode
  dashboard/ Dashboard, WorkoutOfTheDay, RecentWorkouts
  ui/        Button, Card, Modal, Input, Select
```

## 6. Flujo de datos

Una sola fuente de verdad: la `Session`. El Display nunca inventa tiempo propio
(Sección 34); es un espejo pasivo del estado emitido por el Trainer.

```
1. Trainer abre /app/workouts/[id]/run
   → crea Session en memoria + localStorage
     { id, code, workout, status, startedAt, pausedAt,
       currentPhase, currentRound, currentExercise }

2. Trainer aprieta START
   → SessionEngine.start() arranca el TimerEngine
   → TimerEngine: remaining = duration - (Date.now() - startedAt)
   → SessionEngine emite el estado por BroadcastChannel(session.code)

3. Display abre /display/[code], se suscribe al canal
   → re-renderiza con el snapshot recibido
   → interpola localmente usando el mismo targetTime recibido
     (no cuenta con lógica propia de fases)

4. Trainer aprieta PAUSE/NEXT/+10s → SessionEngine reemite estado
   → Display refleja el cambio en <100ms

5. WorkoutEngine detecta fin de bloque/ronda/workout
   → avanza fase automáticamente, dispara sonido vía AudioManager
   → emite estado FINISHED
```

`BroadcastChannel` se usa como transporte del tick/estado en vivo.
`localStorage` se usa solo para persistencia (workouts guardados, preferencias,
último workout), no como transporte del timer.

## 7. Manejo de errores y estados

Estados de conexión Display↔Trainer:

```ts
type ConnectionStatus = "waiting" | "connected" | "disconnected";
```

El Trainer emite heartbeat en cada broadcast; si el Display no recibe nada en
~5s, pasa a `disconnected` y muestra el indicador discreto (Sección 81) sin
tapar el timer.

`LocalWorkoutRepository` envuelve `save/load/delete/duplicate` devolviendo un
`Result<T, StorageError>` en vez de dejar subir excepciones crudas (ej.
localStorage bloqueado en modo privado) — la UI muestra un mensaje claro en
vez de romperse (Regla del prompt: no debe romperse si localStorage falla).

Confirmación solo antes de `RESET` con el workout corriendo. `PAUSE/NEXT/
PREVIOUS/+10s/-10s` son de un solo toque, sin fricción (Sección 80).

Validaciones (Sección 78) viven en el tipo/constructor del dominio: un
`WorkoutBlock` no se puede crear con `rounds <= 0` ni con lista de ejercicios
vacía, en vez de validarse de forma dispersa en la UI.

## 8. Testing

Vitest sobre la lógica crítica (Sección 60), sin testear visualmente cada
componente:

```
lib/timer/__tests__/    start/pause/resume/reset, countdown llega a 0 exacto
                         (fake timers + timestamps, no ticks reales), count up
                         crece indefinidamente, drift tras "dormir" el tab.
lib/workout/__tests__/  avance de fase, avance de ronda, última ronda →
                         FINISHED, EMOM reinicia cada minuto exacto.
lib/storage/__tests__/  save/load/delete/duplicate contra localStorage
                         mockeado, comportamiento con localStorage roto.
```

Verificación manual en navegador (Chrome desktop + mobile) antes de cerrar
cada paso de implementación, cubriendo el Caso 10 de la Sección 94.

## 9. Fuera de alcance explícito (Fase 1)

- Multi-dispositivo físico real (celular ↔ TV separada) — Fase 2.
- Login, gimnasios, roles — Fase 3.
- QR para alumnos, registro de resultados, estadísticas — Fase 4.
- Planes, suscripciones, pagos, multi-tenant — Fase 5.
- Branding/personalización por gimnasio — Fase 6.
