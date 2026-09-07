# GymTimer Pro — Display: QR de arranque rápido al armador de WOD (diseño técnico)

Ciclo de brainstorming separado, mencionado como fuera de alcance en
`docs/superpowers/specs/2026-09-07-display-content-guidance-design.md`.
Cruza `Display`, `Trainer run panel` y `Workout Builder`.

## 1. Contexto y objetivo

Hoy el flujo para conectar una pantalla es: el profe arma o abre un
workout guardado, lo inicia desde `/app/workouts/[id]/run` (que genera
un código con `generateCode()`), y comparte ese código a mano con quien
esté frente al televisor/monitor, que lo tipea en `/display`.

El QR que hoy se muestra en `/display/[code]` (dentro de
`DisplayConnection.tsx`) apunta a `${origin}/display/{code}` — la
misma página en la que ya está parado. Solo sirve para que un segundo
dispositivo también mire la sesión; no ayuda a arrancarla.

Este ciclo invierte el orden: el Display puede generar su propio
código ANTES de que exista un workout, mostrar un QR que lleva
directo al armador en el celular del profe, y pasar solo de la
pantalla de espera a la sesión corriendo en cuanto el profe guarda/
inicia un workout — sin que nadie tenga que tipear un código en
ningún lado.

**Conviven ambos caminos** (decisión explícita del usuario): el flujo
QR nuevo y el flujo manual de tipear código existente hoy siguen
funcionando en paralelo, cada uno resuelve un caso de uso distinto
(QR = arrancar todo desde el Display; manual = el profe ya armó/inició
la sesión en su propio dispositivo y solo necesita decirle el código a
quien está en la TV).

## 2. Mecanismo central: no hace falta sync nuevo

`SessionChannel` en `run/page.tsx` ya dispara `sendState()` apenas el
componente monta (`useEffect` sobre `session.state`, línea 68), antes
de que el profe toque "Iniciar". Cualquier Display escuchando ese
código pasa de `DisplayConnection` a `DisplayScreen` en cuanto recibe
el primer mensaje de estado — este comportamiento ya existe y no se
toca.

Lo único que falta es que **ambos lados terminen escuchando el mismo
código**, en vez de que el `run` page siempre genere uno propio. Se
resuelve propagando el código como query param `?code=XYZ123` a través
de la cadena de navegación:

```
/display/{code}  →  /app/workouts?code={code}
                 →  /app/workouts/new?code={code}   (si arma nuevo)
                 →  /app/workouts/[id]/run?code={code}
```

Sin query param, cada página se comporta exactamente como hoy
(`run/page.tsx` genera su propio código con `generateCode()` si no
recibe uno).

## 3. Pantalla de entrada `/display` (sin código)

Hoy `DisplayEntryPage` (`src/app/display/page.tsx`) es directamente un
input para tipear un código. Pasa a mostrar una pantalla de elección
con dos botones grandes:

- **"Generar código nuevo"** — llama a `generateCode()` y navega a
  `/display/{code}`.
- **"Ya tengo un código"** — revela el input de texto que ya existe
  hoy (sin cambios de comportamiento), para el caso del profe que ya
  inició sesión desde su propio dispositivo.

## 4. `/display/{code}` — pantalla de espera (`DisplayConnection.tsx`)

Único cambio: el `value` del `QRCodeSVG` deja de ser
`${origin}/display/{code}` (apuntarse a sí misma) y pasa a ser
`${origin}/app/workouts?code={code}`. El resto del componente (código
grande, texto "Escaneá para conectar", estado esperando/conectado) no
cambia.

## 5. Lista de entrenamientos `/app/workouts` con `?code=`

`WorkoutsListPage` lee `?code=` de la URL (si existe) y:

- Muestra un indicador chico y no intrusivo, ej.
  `[ CONECTANDO A PANTALLA: XYZ123 ]`, para que el profe sepa que ya
  está enganchado y no necesita tipear nada.
- Propaga `?code=` en el link "+ Nuevo entrenamiento"
  (`/app/workouts/new?code=`) y en cada link "▶ Iniciar"
  (`/app/workouts/[id]/run?code=`).

Sin `?code=` en la URL, la página se ve y comporta exactamente igual
que hoy.

## 6. Armador `/app/workouts/new` con `?code=`

`WorkoutBuilder.tsx` (línea 47) hoy hace
`router.push("/app/workouts")` incondicionalmente después de
`repo.save(workout)` (línea 42). Cambia a: si la URL trae `?code=`,
redirige a `/app/workouts/[id]/run?code={code}` usando el `id` del
workout recién guardado; si no trae `?code=`, mantiene el
`router.push("/app/workouts")` actual.

Esto hace que el profe arme el WOD y caiga directo a la pantalla de
"Iniciar" del `run` page, sin pasar por la lista.

## 7. `/app/workouts/[id]/run` con `?code=`

`RunWorkoutPage` (línea 24) cambia:

```ts
const [code] = useState(() => searchParams.get("code") ?? generateCode());
```

Si viene `?code=` lo usa tal cual (mismo string, sin validación de
formato adicional — ya viene de `generateCode()` en algún punto de la
cadena). Si no viene, genera uno nuevo como hoy. El resto del
componente (`SessionChannel`, `sendState`, UI) no cambia.

## 8. Fuera de alcance / limitación aceptada

- **No hay sync de biblioteca de workouts entre dispositivos.**
  `LocalWorkoutRepository` persiste en `localStorage`, por navegador.
  Si el profe escanea el QR con el celular, en `/app/workouts` va a
  ver los workouts guardados en ESE celular, no los que tenga en su
  compu. Es una limitación de arquitectura preexistente — no se
  resuelve en este ciclo. Confirmado con el usuario que no es un
  problema para el caso de uso real.
- No se agrega expiración ni invalidación de códigos — mismo modelo
  que existe hoy (un código es solo un identificador de canal
  efímero, sin persistencia más allá de la sesión de Pusher).
- No se toca el flujo de reset/pausa/controles del `run` page.
- No se cambia `qrcode.react` ni la lógica de generación del QR en sí
  (`QRCodeSVG`), solo el `value` que se le pasa.
