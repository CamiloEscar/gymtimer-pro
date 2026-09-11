# Backlog: auditoría UX/UI — landing, display, fijar WOD, config

Estado: solo notas, nada implementado. Pedido por usuario 2026-09-11.

## `/` (landing)

- [ ] Botón "play" manual siempre visible en `VideoPlayer.tsx:202-211` aunque el video ya está en `autoplay/muted/loop`. Ocultar cuando el video está realmente reproduciendo (evento `onPlay`/`onPause`), no solo por flag `showVideo`.
- [ ] Cards de modos (`WorkoutModes.tsx`) son 100% texto/color, sin foto. Agregar imagen real por modo (AMRAP, EMOM, Tabata, etc.).
- [ ] Anchors del header (`Navbar.tsx` → `#modos`, `#como-funciona`) sin `scroll-behavior: smooth` ni `scroll-mt-*` en el proyecto → salto seco. Nav no es sticky (es `absolute`, solo vive en el hero).

## Display (TV)

- [ ] Video no aparece: depende 100% de `showVideoOnDisplay` en la sesión del ENTRENADOR (`run/page.tsx:191-193`), no del display. Si se apaga ahí, la TV cae en silencio al logo/ícono sin ningún aviso. Considerar mostrar un estado explícito ("video oculto — activalo en Ajustes") en vez de fallback mudo.
- [ ] Botón play real (`VideoPlayer.tsx:202-211`) queda visible en una pantalla no táctil (TV) si el `.play()` programático de `DisplayScreen.tsx` falla silenciosamente (`.catch(()=>{})`). En contexto TV ese botón es inútil — nadie lo puede tocar. Reemplazar por reintento automático + indicador de carga.

## "Fijar WOD" — clarificar dos sistemas que compiten

- [ ] `wodWorkoutId` (botón "Fijar WOD" en la card, pin manual global sin fecha) vs `weeklyPlan` (día de semana → workout, en Ajustes). Prioridad real: `weeklyPlan[hoy] > wodWorkoutId > último creado` (`Dashboard.tsx:77-91`). Nada en la UI indica cuál está ganando hoy → un trainer puede fijar un WOD y ver que el plan semanal lo pisa sin explicación.
- [ ] Sugerido: mostrar en el dashboard/card "Hoy se muestra: X (viene del plan semanal / fijado manualmente)".

## Configuración

- [ ] Toggles Apagado/Encendido como par de botones en vez de switch nativo (Pantalla, Sonido x2) — mismo patrón visual reusado para selector Gimnasio/CrossFit (semántica distinta, confuso).
- [ ] "Overrides de ejercicios" sin párrafo introductorio (a diferencia de Gimnasio y Pantalla).
- [ ] Inputs video/thumbnail URL sin validación de formato ni preview — typo del trainer solo se descubre en vivo en la TV.
- [ ] Botón "Quitar override" sin confirmación (destructivo sin undo), inconsistente con el modal de reset de `/run`.
- [ ] "Plan semanal" (7 selects) enterrado dentro de la card de Gimnasio con su propio `<h2>` — decide qué se ve en el dashboard todos los días, merece sección propia.

## `/run` (ya anotado en sesión previa, referencia)

- [ ] Countdown duplicado en `getReady` (`PhaseIndicator` + `TimerDisplay` muestran lo mismo apilado).
- [ ] Colores de fase invertidos: `rest` en rojo, `work` en brand — al revés de la convención de intensidad en un box.
- [ ] Select de rutina + input de código de sesión editables durante la clase corriendo (deberían bloquearse como ya hace "Editar").
- [ ] `±10 SEG` es paso fijo sin importar duración de la fase — rompe formatos cortos tipo Tabata (20s).

## Mejoras propias (experto UI + coach), no pedidas explícitamente

- [ ] **PWA / modo kiosco para el display**: hoy depende de wifi + pestaña de navegador abierta. Un manifest + service worker con cache de assets evita que un corte de wifi tire la pantalla en medio de la clase.
- [ ] **"Próximo ejercicio" en el display**: durante EMOM/intervalos, mostrar qué sigue (no solo lo actual) ayuda al atleta a prepararse mentalmente — patrón estándar en apps de boxes (WodProof, SugarWOD).
- [ ] **Historial con progreso real**: `WorkoutHistoryRepository` graba fecha/duración/reps, pero no hay vista que muestre evolución (PRs, tendencia de tiempo en el mismo WOD). Para un coach esto es el dato que más importa a mediano plazo.
- [ ] **Accesibilidad de color**: paleta "phosphor" (rojo/verde/ámbar) sin verificar contraste WCAG AA ni caso daltonismo — en un WOD de alta intensidad, un atleta daltónico rojo-verde no debería depender solo del color para diferenciar trabajo/descanso (agregar ícono o forma, no solo tinte).
- [ ] **RX / Scaled**: no hay forma de marcar variante de un ejercicio (peso prescrito vs escalado) en el catálogo ni en el display — básico en cualquier flujo real de clase de crossfit con niveles mixtos.
- [ ] **Multi-atleta en display**: hoy es un solo contador de reps (bloque RM). Para clases grupales, un ranking en vivo (aunque sea manual, por nombre) motiva mucho más que un número solo.
- [ ] **Videos en formato liviano**: los `.mp4` en `public/exercises/` sin verificar tamaño/compresión — en wifi de gimnasio (a menudo mala) esto puede trabar el display justo al iniciar un ejercicio.
