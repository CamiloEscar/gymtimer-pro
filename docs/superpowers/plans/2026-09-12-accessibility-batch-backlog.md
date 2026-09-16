# Backlog — accesibilidad/usabilidad (2026-09-12)

Iteración sobre el audit de newbies (`docs/superpowers/plans/2026-09-11-ux-audit-backlog.md`). Se hizo un batch completo de 8 cambios en working tree y luego se revirtieron todos salvo 2 (ExerciseBanner + INICIAR quedan). **0 commits**. Repo en estado actual.

## Estado del repo ahora

### KEEP (quedó del batch)

- `src/lib/workout/deriveCurrentExercise.ts` (new)
- `src/components/timer/ExerciseBanner.tsx` (new)
- `src/components/timer/__tests__/ExerciseBanner.test.tsx` (new — 5 tests)
- `src/app/app/workouts/[id]/run/page.tsx` — solo el `<ExerciseBanner />` bajo el h1 del workout
- `src/app/app/workouts/[id]/run/__tests__/page.test.tsx` — sin cambios relevantes

**Tests**: 406/406. Lint limpio. `tsc --noEmit` limpio.

---

## Tareas que se pueden reaplicar (estaban hechas, fueron revertidas)

Cada tarea tiene la spec mínima para que un agente la vuelva a implementar. Todas se pueden hacer en paralelo entre sí o una a una. **NO se commitearon, los diffs originales NO están en git**.

### #1 — Run page clarity (parcial revertido: solo banner quedó)

**Spec completa** (la mayoría ya revertida):
- ExerciseBanner bajo el h1 ✅ KEEP
- Hero INICIAR como botón grande arriba de la pairing zone ❌ revertido (había quedado como duplicado del TimerControls, vos lo sacaste)
- Pairing zone colapsable con `<details>` cuando display conectado ❌ revertido
- FAB duplicado del run page borrado (deja solo el ActiveDisplayFloater global) ❌ revertido (FAB restaurado)
- PhaseIndicator "TIEMPO" → "TERMINADO" (visual, TTS intacto) ❌ revertido
- Caption ±SEG "Ajuste: ±10% de la fase (2–10 s)" ❌ revertido

**Archivos a tocar**:
- `src/app/app/workouts/[id]/run/page.tsx` (reorg)
- `src/components/timer/PhaseIndicator.tsx` (label)
- `src/components/timer/TimerControls.tsx` (caption)
- `src/components/layout/ActiveDisplayFloater.tsx` (si querés borrar FAB local)

**Decisión**: si vas a reaplicar, decidí si querés split (primary action fuera del TimerControls) o duplicado (hero + grid, ambos con mismo handler). El split requirió tests; el duplicado requirió `findAllByRole` en 3 tests. Sin split ni duplicado no hay hero INICIAR.

---

### #2 — Dashboard clarity

**Spec**:
- WOD card primero (antes de stats y quick actions)
- Hero slim: solo gym name + fecha + linkCode chip, sin saludo h1 ni "¿Qué entrenamos hoy?"
- QuickActions: SOLO "+ Nueva rutina" como primary `size="lg"`; borrar "Configuración" y "Abrir Display"
- Display access: solo via ActiveDisplayFloater global + hero chip

**Archivos**:
- `src/components/dashboard/Dashboard.tsx`
- `src/components/dashboard/QuickActions.tsx`
- `src/components/dashboard/QuickActions.test.tsx`
- `src/components/dashboard/Dashboard.test.tsx`

**Cuidado**: en la primera implementación quedaron 2 botones de "create" (empty state + WOD empty variant). Si lo reaplicas, dedupe.

---

### #3 — Settings unification

**Spec**:
- Plan semanal extraído a `WeeklyPlanSettings.tsx` propia, autosave on select change, arriba de Overrides
- Overrides envuelto en `<details>` "Avanzado · Overrides de ejercicios", cerrado por default, con nota
- `window.alert("URL inválida")` reemplazado por error inline `text-danger-500` (estilo como WorkoutBuilder errors)
- "Ajustes" (MobileTabBar) vs "Configuración" (h1) unificado a "Ajustes"
- GymSettings con autosave on blur, Guardar/Descartar eliminados, "Cambios guardados" `<p role="status">` que fade out 2s

**Archivos**:
- `src/components/settings/WeeklyPlanSettings.tsx` (new)
- `src/components/settings/GymSettings.tsx`
- `src/components/settings/DisplaySettings.tsx` (verificar)
- `src/components/settings/AudioSettings.tsx` (verificar)
- `src/components/settings/ExerciseOverridesSettings.tsx`
- `src/app/app/settings/page.tsx`
- `src/components/layout/AppHeader.tsx` (label link)
- `src/components/settings/__tests__/*`

**Gotcha**: el catálogo pre-carga `videoUrl` con path relativo válido, así que el test de error de URL necesitó `user.clear()` antes de tipear URL inválida.

---

### #4 — Builder clarity

**Spec**:
- Sticky save bar: `<div className="sticky bottom-20 md:bottom-0 ...">` con bg `surface-950/95 backdrop-blur`, borde superior, status `role="status"` ("Sin cambios por guardar" / "● Cambios sin guardar" cuando dirty)
- Collapsible muerto "Ver N ejercicios" ELIMINADO (no mover, borrar)
- ExerciseEditor: `+ Detalles` toggle ELIMINADO; los 4 campos (reps, series, peso, notas) visibles por defecto en grilla 2 columnas
- Glosario de tipos: `<details>` nativo con `<dl>` de los 12 tipos (label + descripción desde BLOCK_TYPE_INFO)

**Archivos**:
- `src/components/workout/WorkoutBuilder.tsx`
- `src/components/workout/BlockEditor.tsx`
- `src/components/workout/ExerciseEditor.tsx`
- `src/lib/workout/blockTypeInfo.ts` (si se agregan hints)
- `src/components/workout/__tests__/*`

---

### #5 — Jerga y onboarding

**Spec**:
- Reemplazar "WOD"/"Entrenamiento del día"/"fijar WOD" → "Rutina del día"/"destacar rutina"/"destacada del día" (campo interno `wodWorkoutId` queda intacto)
- Onboarding banner: `DisplayOnboardingBanner.tsx` con 3 pasos (Creá rutina → Tocá Iniciar → Abrí el código en el TV), brand border, X dismissible con localStorage `gymtimer.onboarding.displayDismissed`. Montado arriba de WOD card.
- "Arrancar con este ejercicio" → "Crear rutina con este ejercicio" + subtítulo "Te llevamos al editor para que la configures antes de correr."
- Selects de bloques: campo `selectHint` en `BLOCK_TYPE_INFO` con "AMRAP (tantas rondas como puedas)" etc.

**Archivos**:
- `src/components/dashboard/DisplayOnboardingBanner.tsx` (new)
- `src/components/dashboard/WorkoutOfTheDay.tsx`
- `src/components/dashboard/Dashboard.tsx` (banner integration)
- `src/components/workout/WorkoutCard.tsx` (chips, labels)
- `src/components/settings/WeeklyPlanSettings.tsx` (si se reaplica, no tocaba jerga acá)
- `src/app/app/exercises/[id]/page.tsx` (botón)
- `src/lib/workout/blockTypeInfo.ts` (selectHint)

**Cuidado**: tests de display/dashboard que tienen "WOD del día"/"Domingo WOD" como nombre de rutina semilla, no son labels — dejar.

---

### #6 — Ejercicios library

**Spec**:
- Badge por card: "Gim" (brand green), "CrossFit" (amber `phase-ready`, porque steel-blue `round-2` es muy oscuro para texto), "Ambos" para name-collisions (Box Jump + Kettlebell Swing existen en ambos)
- Thumbnails: aspect-video full-bleed via negative margins (evita pelear con Card p-4), carga `<video>` lazy con IntersectionObserver (patrón reusado de VideoPlayer), fallback dumbbell icon
- Play badge overlay siempre en mobile, hover-only en desktop
- Categorías agrupadas con sticky `<h3>` (`top-14` / `top-[60px]` debajo del AppHeader), se mantienen durante search (solo matching categories), grid plano si <6 matches
- Cards más grandes, category label brand-colored, hover border + focus outline

**Archivos**:
- `src/components/library/ExerciseLibrary.tsx`
- `src/components/library/__tests__/*` (+4 tests: badge counts 48/43/4, grouped headings, grouped-when-searching, flat for short results)

---

### #7 — Transversal cleanup

**Spec**:
- Reemplazar todos los `text-[10px]` con `text-xs` (12px). No quedó ninguno exento — todos eran body content.
- WorkoutCard icon buttons: labels visibles "Destacar/Quitar", "Duplicar", "Eliminar" en md+; `title` + `aria-label` + `min-h-11 min-w-11` (44px) en mobile
- Run page copy button: `title`, 44px, "Copiar" label en md+, input padding bumped a `pr-12 md:pr-32`
- "Iniciar" copy unificado: WOD card "Iniciar entrenamiento" → "Iniciar"; cards/WOD "Iniciar"; run page "INICIAR" (mantiene all-caps industrial); onboarding banner "Tocá Iniciar"
- Display entry points: borrar el botón run-page `/display/{code}` open (queda 1 INICIAR + los 3 normales). Los 3 entry points finales: AppHeader "Pantalla", Dashboard hero chip, ActiveDisplayFloater

**Archivos** (al menos 10): `WorkoutCard`, `ExerciseLibrary`, `DisplayScreen`, `MobileTabBar`, `WorkoutOfTheDay`, `StatsRow`, `Dashboard`, `ExerciseBanner`, `TimerControls`, `run/page.tsx`

---

### #8 — A4 keyboard shortcuts hint

**Spec**:
- Strip visual bajo TimerControls, **desktop only** (`hidden md:block`):
  `<p className="hidden md:block mt-3 text-center font-tactical text-xs uppercase tracking-widest text-phosphor-muted">ESPACIO PAUSAR · ← → RONDAS · R REINICIAR · F PANTALLA COMPLETA</p>`
- Solo shortcuts realmente wirados en `useKeyboardShortcuts.ts`: Space, ←/→, R, F. (N no se muestra porque las flechas ya cubren nav de rondas.)
- Cero test churn

**Archivos**:
- `src/app/app/workouts/[id]/run/page.tsx`

---

## Ideas nuevas (2026-09-16)

### Display de levantamiento (barbell con peso actual)

Modo display (TV) para bloques RM / levantamiento: un gráfico de la BARRA con el peso cargado — visualización de barra + discos según el peso actual del intento, animado al cambiarlo (el trainer ya maneja `weightKg` por ejercicio, ver `src/types/workout.ts`).

### Display de competencia CrossFit

Modo display "competencia": scoreboard/leaderboard entre atletas corriendo la misma WOD (nombre, corridas/reps, tiempo, ranking). Se conecta con el backlog viejo "Multi-atleta — leaderboard" y con el historial (para comparativa en vivo vs PRs).

### Historial: click en una corrida → ver detalle (2026-09-16)

`/app/history` — cuando se hace click en una entrada del historial se tiene que abrir un detalle mostrando QUÉ se hizo: bloques (tipo, duración), ejercicios con reps/series/peso, duración total, fecha, resultado RM si aplica. Hoy cada entrada solo muestra nombre + duración + botón borrar (card no clickeable). Data necesaria ya existe: `WorkoutHistoryEntry` (workoutId, workoutName, completedAt, durationMs, reps?) + el workout completo en `gymtimer.workouts` (via `LocalWorkoutRepository`).

---

## Pendiente del audit (no tocado nunca)

### Run page
- **TTS del engine**: "TIEMPO" en audio (call estándar de boxes). Si querés "COMPLETADO", tocar `WorkoutEngine.ts:502` + test. Decisión de producto.
- **Pairing zone collapse** — cubierta arriba como #1.
- **FAB duplicado** — cubierto arriba como #1.
- **Back button móvil desde run page** (observación usuario 2026-09-12): en `AppHeader.inferBackHref`, cuando `pathname === "/app/workouts/[id]/run"`, el back va a `/app/workouts/[id]` (edit page). En mobile esto es confuso — el usuario espera volver al listado de rutinas, no caer en el editor mientras está corriendo un timer. Decidir si: (a) mobile-only override a `/app/workouts`, (b) siempre a la lista. Fix chico: agregar `useMediaQuery` (mismo patrón que `usePrefersReducedMotion` en `VideoPlayer.tsx`) y cambiar `inferBackHref` para que reciba `isMobile`.

### Accesibilidad puntual
- **Color contrast pass**: el audit mencionó `text-phosphor-muted`/`text-phosphor-dim` sobre `surface-950`. Nunca chequeado con axe.
- **Touch targets** 44×44 ya garantizados en #7.
- Verificación visual en mobile real (yo no puedo ver la UI).

### Onboarding secundario
- Solo display+TV tiene banner (#5). Otros flujos siguen sin guía: crear primera rutina, configurar gym profile, overrides, plan semanal.

### Power users
- Si al aplicar #4 los reps/series/peso siempre visibles se sienten cargados en mobile para rutinas grandes, alternativa: colapsar por defecto + indicador visual "completos/incompletos".

### Display-side
- TV ya tiene preview del próximo ejercicio (no tocar).
- El TTS "TIEMPO" en la TV (no el trainer view) sigue siendo jerga CrossFit.

---

## Backlog viejo (requieren backend, sin hacer)

- **Tarea 10** — Bluetooth auto-detect TV (Web Bluetooth no descubre TVs; mDNS + service worker + backend)
- **Tarea 15** — Spotify integration (OAuth + Web Playback SDK, requiere backend con client secret)
- **PWA / kiosko** — install prompt, fullscreen lock, manifest con iconos
- **Historial con progreso real** — atletas individuales, trends, comparativa entre sesiones
- **IA coach de entrenamiento** — leer `gymtimer.history` + `gymtimer.workouts` (localStorage) y, en base a la forma de trabajo real del atleta (volúmenes, bloques preferidos, frecuencias, gaps), sugerir ideas de rutinas / próximas sesiones. Requiere backend para el prompt (API key), el historial ya está en el lado cliente. Ver cómo exponer: endpoint propio o resumir el historial del lado cliente y mandar el resumen.
- **RX / Scaled** — escalado de pesos por nivel del atleta (elite/intermediate/scaled)
- **Multi-atleta** — leaderboard, varios atletas corriendo a la vez, heat maps
- **Videos livianos** — CDN para los videos de ejercicios (actualmente en `/public/videos/`, pesado)

---

## Cómo retomar

### Para reaplicar cualquiera de #1–#8

Los diffs originales NO están en git (0 commits). Hay dos caminos:

1. **Redelegar a un agente con la spec de este backlog + el audit original** (`docs/superpowers/plans/2026-09-11-ux-audit-backlog.md`). El agente reimplementa desde cero.
2. **Buscar el código en memoria de la sesión / engram**:
   - `mem_search(project: "gymtimer-pro", query: "...")` para los hallazgos clave.
   - Hay observaciones guardadas como `architecture/what-implemented-...` con resumen de cada batch.

Recomendación: opción 1. Es más confiable que reconstruir desde memoria.

### Orden sugerido para reaplicar (si decidís re-aplicar todo)

1. **#5 (jerga + onboarding)** — bajo costo, alto impacto newbie
2. **#2 (dashboard)** — reordenamiento simple
3. **#6 (ejercicios)** — visual, sin riesgo funcional
4. **#4 (builder)** — sticky save es el win más grande
5. **#3 (settings)** — extracción de WeeklyPlanSettings
6. **#7 (transversal)** — limpieza final
7. **#1 (run page, sin split)** — agregar pairing collapse + quitar FAB local + PhaseIndicator label
8. **#8 (A4 keyboard hint)** — cherry on top

### Para retomar la próxima sesión

- Verificar visualmente lo que quedó (banner en run page)
- Decidir si querés reaplicar #1–#8 (empezando por #5) o seguir con el backlog viejo
- El backlog viejo (#10 Bluetooth, #15 Spotify, etc.) requiere decisiones de arquitectura (backend, OAuth) — no es "delegable a general agent", necesita más conversación.
