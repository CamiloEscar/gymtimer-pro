# GymTimer Pro — Display: numeración, progreso y ubicación de bloque (diseño técnico)

Ronda de mejora de contenido sobre el Display, posterior al restyle visual ya
implementado en `docs/superpowers/specs/2026-09-06-display-industrial-redesign-design.md`
(tipografía Archivo Black/JetBrains Mono, paleta oscura, bordes rectos — ya en
producción). Este ciclo no toca la estética: agrega tres señales de contenido
que hoy faltan para que los atletas se guíen solos frente al Display sin
depender del profe.

## 1. Contexto y restricción de alcance

No existe tracking individual por atleta ni lógica real de "ejercicio activo"
(`currentExerciseIndex` sigue hardcodeado a `0` en `WorkoutEngine`, por
decisión deliberada de un ciclo anterior). Este diseño no cambia eso. Las
tres mejoras de esta spec son **puramente de presentación**: todos los datos
que necesitan ya existen en `SessionState`/`TimerState`, no se agregan
campos nuevos a `WorkoutEngine`, `SessionState`, `WorkoutBlock` ni
`Exercise`, y no hay cambios de mensaje en `SessionChannel`.

## 2. Numeración de ejercicios

`src/components/display/ExerciseListDisplay.tsx` antepone el número de
orden (`1)`, `2)`, `3)`...) a cada línea ya renderizada por
`formatExerciseLine`, usando el índice del `.map()` sobre `visible`
(el array ya recortado a máximo 4 por `selectVisibleExercises`). Ejemplo:

```
1) THRUSTER · 21reps
2) PULL-UP · 12reps
```

Sin encabezado adicional de rondas del bloque (`block.rounds`) — se
descartó explícitamente para no sumar una línea más de texto compitiendo
con el timer, que sigue siendo el elemento dominante de la pantalla.

`formatExerciseLine` no cambia — la numeración se agrega en el JSX del
`.map()` de `ExerciseListDisplay`, no en el helper de formato de texto.

## 3. Barra de progreso de tiempo del bloque

Barra lineal delgada, CSS puro (`width` en porcentaje), sin bordes
redondeados — consistente con la regla `border-radius: 0` ya establecida en
el redisño industrial. Vive en `DisplayScreen.tsx`, entre `TimerDisplay` y
`ExerciseListDisplay` (o inmediatamente debajo del timer, a criterio del
implementador según balance visual — el timer sigue siendo dominante).

Cálculo: `state.timer.elapsedMs / state.timer.durationMs`, clamped a
`[0, 1]`.

**Condición de visibilidad:** solo se muestra cuando
`state.timer.mode === "countdown"`. En modo `"countup"` (AMRAP, for time)
no hay una duración total conocida contra la cual medir progreso — la
barra no se renderiza en absoluto (no una barra vacía o indeterminada).

## 4. Indicador "Bloque X de N"

Se agrega junto a `RoundIndicator` en la franja inferior de
`DisplayScreen.tsx` (mismo `<div>` con `border-t`), misma tipografía Micro
(JetBrains Mono) y formato de corchetes ya usado por `RoundIndicator`:

```
[ RONDA 2 / 6 ]  [ BLOQUE 2/5 ]
```

Cálculo: `state.currentBlockIndex + 1` de `state.workout.blocks.length`
(ambos ya presentes en `SessionState`, sin cambios de tipo).

**Condición de visibilidad:** oculto si `state.workout.blocks.length <= 1`,
igual que la regla ya existente en `RoundIndicator` para `totalRounds <= 1`
— un workout de un solo bloque no necesita indicar posición.

## 5. Fuera de alcance explícito (este ciclo)

- Tracking de progreso individual por atleta o cualquier lógica de
  "ejercicio activo" real en `WorkoutEngine`.
- Rediseño del flujo de QR/emparejamiento del Display (pedido nuevo del
  usuario: que el QR del Display abra el armador de WOD en el celular del
  profe y que el Display cambie solo a la vista de sesión corriendo al
  guardar el workout) — **ciclo de brainstorming separado**, cruza Display,
  Trainer run panel y Workout Builder.
- Contador de tiempo standalone sin ejercicios, con descanso/tiempo de
  ronda/rondas configurables — **ciclo de brainstorming separado**. Nota
  para ese ciclo: los tipos `interval`/`tabata`/`emom` de `WorkoutBlock` ya
  tienen `workSeconds`/`restSeconds`/`rounds`; lo único que hoy bloquea un
  bloque sin ejercicios es la regla "≥1 ejercicio por bloque" en
  `validateWorkout.ts`.
- Cualquier cambio a la paleta, tipografía o geometría ya establecidas en
  el redisño industrial (Fase 1).
