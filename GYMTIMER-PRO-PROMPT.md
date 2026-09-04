# GymTimer Pro — Prompt maestro de desarrollo

## 1. Rol

Actuá como un **Senior Full-Stack Developer, Software Architect y Product Designer**.

Tu objetivo es diseñar y desarrollar desde cero una aplicación web llamada **GymTimer Pro**, orientada principalmente a:

- Gimnasios.
- Boxes de CrossFit.
- Centros de entrenamiento funcional.
- Estudios de entrenamiento personalizado.
- Entrenadores particulares.
- Salas de entrenamiento.

La aplicación debe permitir que un entrenador administre un entrenamiento desde un **celular, tablet o computadora**, mientras que una segunda pantalla, TV, monitor o proyector muestra el entrenamiento en tiempo real.

La aplicación debe priorizar:

- Simplicidad.
- Velocidad.
- Excelente experiencia de usuario.
- Diseño moderno.
- Responsive.
- Bajo consumo de recursos.
- Cero o mínimo costo de infraestructura durante el MVP.
- Facilidad de despliegue.
- Arquitectura preparada para convertirse posteriormente en un SaaS.

---

# 2. Concepto principal

GymTimer Pro tendrá dos experiencias principales.

## A. Panel de entrenador / administrador

Se utilizará principalmente desde:

- Celular.
- Tablet.
- Notebook.
- PC.

Desde este panel el entrenador podrá:

- Crear entrenamientos.
- Configurar temporizadores.
- Iniciar entrenamientos.
- Pausar.
- Reanudar.
- Reiniciar.
- Saltar rondas.
- Agregar descansos.
- Configurar sonidos.
- Configurar repeticiones.
- Configurar tiempos.
- Seleccionar entrenamientos previamente guardados.
- Controlar remotamente la pantalla principal.

## B. Pantalla de entrenamiento

Se utilizará en:

- TV.
- Monitor.
- Proyector.
- PC conectada a una pantalla.
- Smart TV con navegador.

No debería necesitar instalar ninguna aplicación.

Simplemente se abre una URL.

Ejemplo:

`https://gymtimer.app/display/ABC123`

La pantalla debe mostrar información extremadamente clara y visible desde varios metros de distancia.

---

# 3. Principio fundamental

La aplicación NO debe depender inicialmente de hardware específico.

No asumir:

- Android TV.
- Apple TV.
- Chromecast.
- Roku.
- Fire TV.
- Smart TV específica.

La primera versión debe funcionar simplemente utilizando un navegador web.

Ejemplo:

```text
ENTRENADOR
Celular
   |
   | Internet / red local
   |
   v
GymTimer Pro
   |
   v
PANTALLA
TV / PC / Proyector
```

---

# 4. Stack tecnológico

Para el MVP utilizar:

- Next.js
- React
- TypeScript
- Tailwind CSS

No agregar dependencias innecesarias.

Priorizar Web APIs nativas siempre que sea razonable.

---

# 5. Filosofía del MVP

No intentar construir todo el SaaS desde el primer día.

Primero construir un MVP sólido.

El MVP debe poder:

1. Abrirse desde el navegador.
2. Crear un entrenamiento.
3. Configurar un timer.
4. Guardarlo.
5. Ejecutarlo.
6. Mostrarlo en una segunda pantalla.
7. Controlar esa pantalla desde otro dispositivo.
8. Tener sonidos.
9. Ser completamente responsive.

Posteriormente se agregará:

- Usuarios.
- Gimnasios.
- Suscripciones.
- Base de datos.
- Estadísticas.
- Alumnos.
- Pagos.
- Multi-tenant.
- Analytics.

---

# 6. Tipos de temporizadores

El sistema debe estar preparado para soportar diferentes tipos.

## 6.1 Countdown

Cuenta regresiva.

Ejemplo:

```text
10:00
09:59
09:58
...
00:00
```

Configuración:

- Minutos.
- Segundos.
- Sonido final.
- Sonido de últimos segundos.

## 6.2 Count Up

Cuenta ascendente.

Ejemplo:

```text
00:00
00:01
00:02
...
15:32
```

Útil para:

- For Time.
- Tests.
- Entrenamientos libres.

## 6.3 AMRAP

As Many Rounds As Possible.

Ejemplo:

```text
AMRAP 12:00

12:00
11:59
11:58
...

ROUND 1
ROUND 2
ROUND 3
```

Debe permitir configurar:

- Duración.
- Nombre del WOD.
- Descripción.
- Objetivo.
- Número de ejercicios.
- Información adicional.

## 6.4 EMOM

Every Minute On the Minute.

Ejemplo:

```text
EMOM 10

MINUTE 1
10 Push Ups

MINUTE 2
10 Squats

MINUTE 3
10 Burpees
```

El sistema debe reiniciar automáticamente el intervalo cada minuto.

Debe permitir:

- Cantidad de minutos.
- Duración del intervalo.
- Ejercicio por intervalo.
- Texto mostrado.
- Sonido al comenzar cada intervalo.

## 6.5 INTERVAL

Intervalos de trabajo y descanso.

Ejemplo:

```text
WORK
00:45

REST
00:15
```

Repetir:

```text
x 10 rounds
```

Configuración:

- Work.
- Rest.
- Rounds.
- Sonido.
- Identidad visual de cada fase.

## 6.6 TABATA

Ejemplo:

```text
20s WORK
10s REST

x 8
```

Debe permitir modificar:

- Tiempo de trabajo.
- Tiempo de descanso.
- Rondas.

## 6.7 For Time

El usuario inicia el cronómetro y el sistema registra cuánto tarda en completar el entrenamiento.

Ejemplo:

```text
FOR TIME

21-15-9

CALORIES
BOX JUMPS
BURPEES

TIME

08:32
```

## 6.8 Descanso

Temporizador exclusivamente para descanso.

Ejemplo:

```text
REST

02:00
```

---

# 7. Constructor de entrenamientos

Crear una interfaz llamada:

## Workout Builder

Debe permitir construir un entrenamiento visualmente.

Ejemplo:

```text
Nuevo entrenamiento

Nombre:
Murph Training

Tipo:
AMRAP

Duración:
20:00

Ejercicios:

[ + Agregar ejercicio ]

1. Pull Ups
2. Push Ups
3. Squats
```

Cada ejercicio puede contener:

- Nombre.
- Repeticiones.
- Tiempo.
- Distancia.
- Peso.
- Notas.

---

# 8. Sistema de bloques

Los entrenamientos deben poder construirse mediante bloques.

Ejemplo:

```text
WORK
↓
REST
↓
WORK
↓
REST
↓
WORK
```

Cada bloque puede ser:

- Work.
- Rest.
- EMOM.
- AMRAP.
- Countdown.
- Count Up.
- Interval.
- Tabata.

Esto permitirá crear entrenamientos complejos.

---

# 9. Configuración de rondas

Permitir:

```text
Rounds: 5
```

Y mostrar:

```text
ROUND 1 / 5
```

Durante el entrenamiento.

Debe existir la posibilidad de:

- Siguiente ronda.
- Ronda anterior.
- Saltar ronda.
- Reiniciar ronda.

---

# 10. Repeticiones

Los ejercicios pueden tener repeticiones.

Ejemplo:

```text
15 PUSH UPS
20 AIR SQUATS
10 BURPEES
```

Mostrar claramente:

```text
15
PUSH UPS
```

Las repeticiones deben ser configurables.

---

# 11. Pantalla principal

La pantalla de TV/display es uno de los componentes más importantes del producto.

Debe estar diseñada para verse desde lejos.

Priorizar:

- Tipografía enorme.
- Alto contraste.
- Poco texto innecesario.
- Información jerárquica.
- Animaciones simples.
- Estado actual muy visible.

Ejemplo:

```text
────────────────────────────────────

             AMRAP

              12:43

            ROUND 04

          15 PUSH UPS

────────────────────────────────────
```

---

# 12. Estados visuales

La pantalla debe diferenciar visualmente:

## WORK

```text
WORK
00:42
```

## REST

```text
REST
00:18
```

## START

```text
GET READY

00:10
```

## FINISHED

```text
TIME

12:43

WORKOUT COMPLETE
```

Utilizar una identidad visual consistente para cada fase.

No hardcodear colores por toda la aplicación. Crear tokens/clases reutilizables.

---

# 13. Sonidos

El sistema debe incluir sonidos para:

- Inicio.
- Fin.
- Últimos 10 segundos.
- Últimos 5 segundos.
- Cambio de ronda.
- Cambio Work → Rest.
- Cambio Rest → Work.
- Finalización.

Ejemplo:

```text
10
9
8
7
6
5
BEEP
4
3
2
1
BEEP
GO!
```

Considerar las restricciones de autoplay de los navegadores.

El primer botón START debe habilitar el contexto de audio cuando sea necesario.

---

# 14. Sonidos configurables

Desde configuración permitir:

```text
Sound:
ON / OFF

Countdown:
ON / OFF

Voice:
ON / OFF

Final sound:
ON / OFF
```

Posteriormente permitir diferentes paquetes de sonidos.

---

# 15. Voz

Preparar arquitectura para utilizar:

```text
Speech Synthesis API
```

Ejemplos:

```text
"Get ready"
"Work"
"Rest"
"Round three"
"Workout complete"
```

Debe ser opcional.

---

# 16. Control remoto

Una de las características principales.

El entrenador controla el timer desde el celular.

La pantalla se actualiza en tiempo real.

Controles:

```text
[ PAUSE ]
[ RESUME ]
[ RESET ]
[ NEXT ROUND ]
[ PREVIOUS ROUND ]
```

También considerar:

```text
[ +10 SEC ]
[ -10 SEC ]
[ SKIP ]
```

---

# 17. Código de conexión

Cuando una pantalla se abre:

```text
DISPLAY
```

debe generar un código.

Ejemplo:

```text
ABC123
```

El entrenador introduce ese código y queda conectado.

También permitir:

```text
QR CODE
```

para conectar rápidamente.

---

# 18. QR

Crear QR para:

### Conectar pantalla

```text
Escaneá para conectar esta pantalla
```

### Ver entrenamiento

```text
Escaneá para ver el WOD
```

### Registrar resultado

```text
Escaneá para registrar tu resultado
```

---

# 19. Sistema de alumnos

Preparar la arquitectura para que posteriormente los alumnos puedan escanear un QR.

Desde el celular:

```text
WOD DEL DÍA

AMRAP 15

3 ROUNDS

21 CALORIES
15 PUSH UPS
9 BURPEES
```

El alumno podría registrar:

- Tiempo.
- Rondas.
- Repeticiones.
- Peso.
- Comentarios.

---

# 20. Registro de resultados

Posteriormente:

```text
RESULTADO

Nombre:
Juan

WOD:
AMRAP 15

Rounds:
8

Reps:
12

Weight:
80 kg
```

Esto permitirá construir estadísticas.

---

# 21. Dashboard del entrenador

Crear una vista:

```text
Dashboard
```

Con:

- Entrenamiento actual.
- WOD del día.
- Últimos entrenamientos.
- Entrenamientos guardados.
- Favoritos.

---

# 22. Biblioteca de workouts

Crear una biblioteca.

Cada entrenamiento tendrá:

- Nombre.
- Tipo.
- Duración.
- Descripción.
- Fecha de creación.
- Favorito.

Acciones:

```text
▶ Ejecutar
✏ Editar
📋 Duplicar
🗑 Eliminar
```

---

# 23. Plantillas

Permitir crear templates.

Ejemplos:

- Morning WOD.
- Strength.
- Conditioning.
- Cardio.
- CrossFit.
- Functional.
- Recovery.

---

# 24. Duplicar workout

Agregar:

```text
Duplicate
```

para crear rápidamente variaciones.

Ejemplo:

```text
AMRAP 10
```

duplicar:

```text
AMRAP 15
```

---

# 25. Workout del día

Crear una funcionalidad:

```text
Workout of the Day
```

El entrenador puede seleccionar un entrenamiento y establecerlo como:

```text
WOD DEL DÍA
```

La pantalla puede mostrar:

```text
TODAY'S WORKOUT

FRAN

21-15-9

THRUSTERS
PULL UPS
```

---

# 26. Modo pantalla completa

La pantalla Display debe tener soporte para:

```text
FULLSCREEN
```

Utilizar Fullscreen API cuando sea posible.

La interfaz debe minimizar controles cuando se activa.

---

# 27. Modo oscuro

El Display debe utilizar un diseño oscuro por defecto.

Ideal para:

- TVs.
- Proyectores.
- Boxes.

Evitar elementos pequeños.

---

# 28. Responsive

La aplicación debe funcionar correctamente en:

### Mobile

```text
320px+
```

### Tablet

```text
768px+
```

### Desktop

```text
1024px+
```

### TV / Display

```text
1920x1080
```

No diseñar solamente para desktop.

---

# 29. Arquitectura de rutas

Proponer inicialmente:

```text
/
```

Landing / Home

```text
/app
```

Dashboard

```text
/app/workouts
```

Lista de workouts

```text
/app/workouts/new
```

Crear workout

```text
/app/workouts/[id]
```

Editar workout

```text
/display
```

Seleccionar display

```text
/display/[code]
```

Pantalla remota

```text
/join/[code]
```

Unirse a sesión

```text
/wod/[id]
```

Visualizar WOD

---

# 30. Estado global

Diseñar correctamente el estado de la aplicación.

Debe existir una fuente única de verdad para:

```text
timer
currentPhase
currentRound
totalRounds
currentExercise
isRunning
isPaused
elapsedTime
remainingTime
workout
```

Evitar múltiples timers independientes.

---

# 31. Motor del temporizador

IMPORTANTE.

El temporizador debe ser robusto y no depender simplemente de:

```js
setInterval(() => time++, 1000)
```

Utilizar timestamps/reloj real para evitar drift.

Conceptualmente:

```text
targetTime - Date.now()
```

Esto es especialmente importante cuando:

- La pestaña pierde foco.
- El dispositivo se ralentiza.
- El navegador reduce la frecuencia de timers.

Crear un Timer Engine independiente de React.

Debe poder:

```text
start()
pause()
resume()
reset()
skip()
previous()
addTime()
subtractTime()
getState()
```

---

# 32. Workout Engine

Separar la lógica del entrenamiento.

Conceptualmente:

```text
Workout
 ↓
Blocks
 ↓
Exercises
 ↓
Phases
 ↓
Timer
```

Debe encargarse de:

- Avanzar fases.
- Cambiar rondas.
- Detectar finalización.
- Calcular siguiente estado.
- Ejecutar automáticamente bloques.

---

# 33. Audio Engine

Centralizar sonidos.

Ejemplo:

```text
AudioManager

playStart()
playCountdown()
playRest()
playWork()
playFinish()
```

No reproducir audio directamente desde múltiples componentes.

---

# 34. Sincronización

Preparar una arquitectura:

```text
Trainer
   ↓
Session
   ↓
Display
```

El Display no debería inventar el tiempo.

Debe recibir el estado de la sesión.

En producción, el servidor será posteriormente la fuente de sincronización.

---

# 35. MVP sin backend costoso

La primera versión debe intentar funcionar sin infraestructura compleja.

Para prototipo utilizar:

```text
localStorage
```

Puede utilizarse para:

- Workouts.
- Configuración.
- Preferencias.
- Sonidos.
- Último workout utilizado.

No almacenar información crítica exclusivamente en localStorage cuando se implemente producción.

---

# 36. Arquitectura preparada para backend

Diseñar interfaces/repositorios para poder reemplazar:

```text
LocalWorkoutRepository
```

por:

```text
SupabaseWorkoutRepository
```

posteriormente.

Ejemplo:

```text
WorkoutRepository

LocalWorkoutRepository
SupabaseWorkoutRepository
```

De esta forma no se debe reescribir toda la aplicación.

---

# 37. Backend futuro

Preparar arquitectura para:

```text
Supabase
```

con:

- PostgreSQL.
- Authentication.
- Realtime.
- Storage.

No es obligatorio implementarlo en la primera versión.

---

# 38. Multi-tenant futuro

La aplicación debe estar pensada como SaaS.

Un usuario podrá pertenecer a un gimnasio.

Ejemplo:

```text
Gym
 ├── Coaches
 ├── Members
 ├── Workouts
 ├── Displays
 └── Sessions
```

Un gimnasio nunca debería poder acceder a los datos de otro.

Esto debe considerarse desde el diseño.

---

# 39. Modelo de datos futuro

Preparar entidades conceptuales:

```text
User
Gym
Membership
Workout
WorkoutBlock
Exercise
WorkoutExercise
Display
Session
SessionParticipant
WorkoutResult
Subscription
```

No implementar todo si no es necesario para el MVP.

---

# 40. Seguridad

Aunque el MVP sea simple:

- Validar inputs.
- Evitar XSS.
- No confiar en datos enviados desde el cliente.
- No exponer secretos.
- No guardar API keys privadas en frontend.
- Preparar autenticación futura.
- Separar correctamente lógica de presentación y negocio.

---

# 41. UX

La interfaz debe sentirse como un producto comercial real.

No debe parecer:

- Proyecto universitario.
- Template genérico.
- Dashboard administrativo aburrido.

Debe sentirse:

- Deportivo.
- Moderno.
- Rápido.
- Profesional.
- Energético.
- Minimalista.

---

# 42. Pantalla inicial

Proponer:

```text
GYMTIMER

Tu entrenamiento.
Tu ritmo.
Tu tiempo.

[ CREAR ENTRENAMIENTO ]

[ PROBAR DEMO ]

[ ABRIR PANTALLA ]
```

---

# 43. Dashboard

Ejemplo:

```text
Hola 👋

¿Qué entrenamos hoy?

┌─────────────────────────┐
│ WOD DEL DÍA             │
│                         │
│ AMRAP 15                │
│                         │
│ [ INICIAR ]             │
└─────────────────────────┘

Entrenamientos recientes

Fran
Murph
EMOM 20
Tabata
```

---

# 44. Panel de control del timer

Debe ser extremadamente simple.

Ejemplo:

```text
AMRAP 15

14:32

ROUND 3

[ PAUSE ]

[ RESET ]

[ NEXT ]

[ +10 SEC ]

[ -10 SEC ]
```

Los controles importantes deben ser grandes.

---

# 45. Controles rápidos

Agregar opcionalmente:

```text
+10 sec
-10 sec
+1 round
Next
Previous
Restart
Pause
Resume
```

---

# 46. Atajos de teclado

En desktop:

```text
Space
```

→ Pause / Resume

```text
R
```

→ Reset

```text
N
```

→ Next

```text
Arrow Right
```

→ Next

```text
Arrow Left
```

→ Previous

```text
F
```

→ Fullscreen

No deben interferir con inputs de texto.

---

# 47. Pantalla de configuración

Crear:

```text
Settings
```

Opciones:

```text
Sound
Voice
Countdown
Fullscreen
Theme
```

Guardar preferencias.

---

# 48. Persistencia local

Guardar automáticamente:

```text
settings
workouts
lastWorkout
favoriteWorkouts
displayPreferences
```

Manejar errores de localStorage.

No hacer que la aplicación se rompa si localStorage está bloqueado.

---

# 49. Gestión de errores

Agregar estados:

```text
Loading
Empty
Error
Offline
Connected
Disconnected
```

Ejemplo:

```text
Display disconnected

Trying to reconnect...
```

---

# 50. Reconexión

Cuando exista sincronización en tiempo real:

- Detectar desconexión.
- Mostrar estado.
- Intentar reconectar.
- Recuperar sesión.
- Evitar reiniciar el timer incorrectamente.

---

# 51. Sesiones

Conceptualmente:

```text
Session

id
code
workout
status
startedAt
pausedAt
currentPhase
currentRound
currentExercise
```

Estados:

```text
WAITING
READY
RUNNING
PAUSED
FINISHED
```

---

# 52. Pantalla de espera

Antes de comenzar:

```text
READY?

FRAN

21-15-9

THRUSTERS
PULL UPS

[ WAITING FOR COACH ]
```

Cuando el entrenador inicia:

```text
GET READY

10
```

---

# 53. Cuenta regresiva previa

Permitir:

```text
3
2
1
GO!
```

Configurable:

```text
3 seconds
5 seconds
10 seconds
```

---

# 54. Finalización

Cuando termina:

```text
TIME!

12:43

WORKOUT COMPLETE
```

Animación breve y sonido final.

No utilizar animaciones excesivamente pesadas.

---

# 55. Performance

La aplicación debe ser extremadamente liviana.

Evitar:

- Librerías innecesarias.
- Animaciones pesadas.
- Polling excesivo.
- Renderizados innecesarios.
- Dependencias innecesarias.

Especialmente importante para TVs antiguas.

---

# 56. Accesibilidad

Implementar:

- Contraste adecuado.
- Focus states.
- Navegación por teclado.
- Botones grandes.
- Labels.
- ARIA cuando corresponda.
- No depender únicamente del color.

---

# 57. Arquitectura de componentes

Organizar componentes de forma clara.

Ejemplo:

```text
components/

timer/
    TimerDisplay
    TimerControls
    TimerProgress
    PhaseIndicator
    RoundIndicator

workout/
    WorkoutBuilder
    WorkoutCard
    WorkoutList
    ExerciseEditor
    BlockEditor

display/
    DisplayScreen
    DisplayConnection
    DisplayQRCode

dashboard/
    Dashboard
    WorkoutOfTheDay
    RecentWorkouts

ui/
    Button
    Modal
    Input
    Select
    Card
```

Adaptar la estructura a Next.js App Router.

---

# 58. Separación de responsabilidades

No colocar toda la lógica en componentes React.

Separar:

```text
Timer Engine
Workout Engine
Audio Engine
Session Engine
Storage
UI
```

Ejemplo:

```text
lib/
    timer/
    workout/
    audio/
    session/
    storage/
```

---

# 59. Datos de ejemplo

Crear varios workouts iniciales para probar.

## AMRAP 10

```text
AMRAP 10

10 Push Ups
15 Air Squats
20 Sit Ups
```

## EMOM 10

```text
EMOM 10

Minute 1:
10 Burpees

Minute 2:
15 Squats
```

## Tabata

```text
20 sec Work
10 sec Rest

8 Rounds
```

## For Time

```text
21-15-9

Thrusters
Pull Ups
```

---

# 60. Testing

Implementar tests para la lógica crítica.

Especialmente:

## Timer

- Start.
- Pause.
- Resume.
- Reset.
- Countdown.
- Count up.
- Finish.

## Workout

- Next phase.
- Next round.
- Final round.
- Workout completion.

## Persistence

- Save.
- Load.
- Delete.
- Duplicate.

No es necesario testear visualmente cada componente en el MVP.

---

# 61. Manejo del tiempo

IMPORTANTE.

No asumir:

```js
setInterval(...)
```

como reloj principal.

Utilizar timestamps.

Ejemplo conceptual:

```text
remaining =
duration -
(Date.now() - startedAt)
```

---

# 62. Zona horaria

Los timers no deben depender de timezone.

Para timestamps históricos utilizar:

```text
ISO 8601
```

---

# 63. Arquitectura de sincronización futura

Diseñar pensando en:

```text
Trainer Device
       |
       v
Realtime Session
       |
       v
Display Device
```

Posteriormente se podrá utilizar:

- WebSocket.
- Supabase Realtime.
- WebRTC DataChannel.

Para el MVP utilizar la solución más simple que permita demostrar el concepto.

---

# 64. Modo demo

Crear una opción:

```text
DEMO MODE
```

que permita probar el sistema sin registrarse.

Ejemplo:

```text
Try GymTimer Pro

[ START DEMO ]
```

Esto será importante para vender el producto.

---

# 65. Landing page futura

Preparar una landing:

```text
GymTimer Pro

El timer de entrenamiento
para tu gimnasio.

Controlá el entrenamiento
desde tu celular.

Mostralo en cualquier pantalla.

[ PROBAR GRATIS ]
```

Secciones:

- Características.
- Cómo funciona.
- Screenshots.
- Beneficios.
- Precios.
- FAQ.
- Contacto.

---

# 66. Modelo comercial futuro

El producto deberá poder convertirse posteriormente en SaaS.

## Free

Para probar.

```text
1 gimnasio
1 display
Workouts limitados
```

## Basic

```text
Más workouts
Más displays
Historial
```

## Pro

```text
Alumnos
Estadísticas
Resultados
Múltiples displays
Personalización
```

## Business

```text
Múltiples sedes
Administración avanzada
Branding
Soporte
```

NO implementar pagos todavía.

Solo preparar la arquitectura.

---

# 67. Branding

Nombre:

# GymTimer Pro

El branding debe transmitir:

- Entrenamiento.
- Tiempo.
- Energía.
- Tecnología.
- Profesionalismo.

Crear logo textual inicialmente.

No depender de imágenes externas.

---

# 68. Diseño

Usar un sistema de diseño consistente.

Definir:

- Typography.
- Spacing.
- Border radius.
- Shadows.
- Buttons.
- Cards.
- Inputs.
- Modals.

El Display debe tener una estética diferente al dashboard.

### Dashboard

Más información.

### Display

Minimalista y gigante.

---

# 69. No sobrecargar la pantalla

La TV NO debe mostrar:

- Menús complejos.
- Botones pequeños.
- Demasiadas estadísticas.
- Información irrelevante.

Prioridad:

```text
1. Tiempo
2. Fase
3. Ronda
4. Ejercicio
5. Información secundaria
```

---

# 70. Configuración de Display

Al abrir:

```text
/display
```

mostrar:

```text
CONECTAR PANTALLA

Código:

ABC123

QR

Escaneá para conectar
```

Una vez conectado:

```text
CONNECTED ✓
```

---

# 71. Múltiples pantallas

Arquitectura preparada para:

```text
Display 1
Display 2
Display 3
```

No es obligatorio implementar múltiples displays en MVP.

---

# 72. Personalización futura

Preparar para que cada gimnasio pueda personalizar:

- Logo.
- Nombre.
- Colores.
- Mensajes.
- Sonidos.
- Pantalla de espera.

Ejemplo:

```text
CROSSFIT PARANÁ

AMRAP 20

12:32
```

---

# 73. QR para resultados

Posteriormente:

```text
SCAN TO LOG RESULT
```

El alumno escanea.

Se abre:

```text
WOD RESULT

Rounds:
[  ]

Reps:
[  ]

Weight:
[  ]

Notes:
[  ]

[ SAVE RESULT ]
```

---

# 74. Estadísticas futuras

Preparar para:

```text
Total workouts
Best time
Best score
Total rounds
Total reps
PRs
Attendance
```

---

# 75. Dashboard futuro del gimnasio

```text
GYM DASHBOARD

Today's classes: 5

Members: 124

Workouts this month: 82

Active displays: 2
```

No implementar inicialmente.

---

# 76. Arquitectura de carpetas

Proponer una estructura limpia.

Ejemplo:

```text
src/
  app/
  components/
  features/
  hooks/
  lib/
  types/
  utils/
```

Evitar una estructura innecesariamente compleja.

---

# 77. TypeScript

Usar TypeScript correctamente.

No utilizar:

```ts
any
```

salvo casos estrictamente justificados.

Crear tipos para:

```text
Workout
Exercise
WorkoutBlock
TimerState
TimerType
Session
Display
WorkoutResult
```

---

# 78. Validaciones

Validar:

- Tiempos.
- Rondas.
- Repeticiones.
- Nombre.
- Bloques vacíos.
- Duraciones inválidas.

Ejemplo:

```text
Rounds must be greater than 0
```

---

# 79. Mobile UX

El entrenador probablemente utilizará el celular durante el entrenamiento.

Por lo tanto:

- Botones grandes.
- No exigir precisión táctil.
- Controles accesibles con una mano.
- Evitar formularios gigantes.
- Acciones principales visibles.
- Evitar navegación innecesaria.

---

# 80. Protección contra errores

Antes de:

```text
RESET
```

si el workout está corriendo, evaluar si requiere confirmación.

Para acciones frecuentes:

```text
NEXT
PAUSE
```

no pedir confirmación.

---

# 81. Estado de conexión

Mostrar:

```text
● Connected
```

o:

```text
● Disconnected
```

de manera discreta.

No ocupar espacio importante del Display.

---

# 82. Internacionalización futura

Preparar textos para poder traducir posteriormente.

Idiomas futuros:

- Español.
- Inglés.
- Portugués.

No es necesario implementar traducciones ahora.

---

# 83. README

Crear un README completo con:

- Descripción.
- Tecnologías.
- Instalación.
- Desarrollo.
- Build.
- Deploy.
- Arquitectura.
- Variables de entorno.
- Roadmap.

---

# 84. Variables de entorno

Crear:

```text
.env.example
```

No colocar secretos reales.

Preparar variables futuras para:

```text
Supabase
Realtime
Analytics
```

---

# 85. Deployment

El proyecto debe poder desplegarse fácilmente en:

```text
Vercel
```

La primera versión debe intentar tener:

```text
$0
```

de costo mensual.

No agregar servicios pagos innecesarios.

---

# 86. Git

Crear commits lógicos.

Ejemplo:

```text
feat: create timer engine
feat: add workout builder
feat: add display mode
feat: add audio system
feat: add local persistence
```

No realizar un único commit gigantesco.

---

# 87. Calidad del código

Priorizar:

- Código legible.
- Componentes pequeños.
- Funciones reutilizables.
- Tipado fuerte.
- Comentarios solamente cuando aporten valor.
- Sin código duplicado.
- Sin soluciones improvisadas.

---

# 88. UX de primera ejecución

Cuando un usuario abre la aplicación por primera vez:

```text
Bienvenido a GymTimer Pro

¿Qué querés hacer?

[ CREAR ENTRENAMIENTO ]

[ PROBAR DEMO ]

[ ABRIR PANTALLA ]
```

No obligar a registrarse para probar el MVP.

---

# 89. Objetivo comercial

Aunque inicialmente sea gratuito, diseñar el producto con mentalidad comercial.

La propuesta de valor debe ser:

> "Controlá el entrenamiento desde tu celular y convertí cualquier TV o monitor en una pantalla profesional para tu gimnasio."

El producto no debe parecer solamente un cronómetro.

Debe sentirse como una:

# Plataforma de gestión y visualización de entrenamientos.

---

# 90. Roadmap

## Fase 1 — MVP

Implementar:

- Dashboard.
- Workout Builder.
- Countdown.
- Count Up.
- AMRAP.
- EMOM.
- Interval.
- Tabata.
- For Time.
- Rounds.
- Exercises.
- Audio.
- Display.
- Fullscreen.
- LocalStorage.
- Responsive.
- Demo.

## Fase 2 — Sincronización

Agregar:

- Sesiones.
- Código de conexión.
- QR.
- Control remoto.
- WebSockets / Realtime.
- Reconexión.

## Fase 3 — Usuarios

Agregar:

- Login.
- Registro.
- Gimnasios.
- Coaches.
- Roles.
- Supabase.

## Fase 4 — Alumnos

Agregar:

- QR.
- Registro de resultados.
- Perfil.
- Historial.
- PRs.
- Estadísticas.

## Fase 5 — SaaS

Agregar:

- Planes.
- Suscripciones.
- Mercado Pago / Stripe según mercado.
- Límites.
- Multi-tenant.
- Administración.

## Fase 6 — Personalización

Agregar:

- Branding.
- Logo.
- Colores.
- Sonidos.
- Temas.
- Pantallas personalizadas.

---

# 91. Reglas importantes para el agente

## Regla 1

No implementar características futuras innecesariamente.

Primero hacer funcionar correctamente el MVP.

## Regla 2

No agregar dependencias sin justificar.

## Regla 3

No utilizar backend pago para funcionalidades que puedan resolverse localmente en el MVP.

## Regla 4

La aplicación debe funcionar correctamente en celular.

## Regla 5

La pantalla Display es una parte fundamental del producto.

## Regla 6

El timer debe ser preciso.

## Regla 7

No utilizar un `setInterval` ingenuo como fuente de verdad temporal.

## Regla 8

Separar lógica de negocio de UI.

## Regla 9

Preparar interfaces para sustituir LocalStorage por Supabase posteriormente.

## Regla 10

No crear una arquitectura excesivamente compleja para el MVP.

---

# 92. Proceso de desarrollo

Antes de escribir código:

1. Analizar este documento.
2. Revisar la estructura del proyecto.
3. Identificar qué existe.
4. Proponer arquitectura.
5. Crear un pequeño plan de implementación.
6. Implementar por fases.

No pedir confirmación para cada pequeño paso.

Tomar decisiones técnicas razonables.

Si existe una decisión importante que afecta arquitectura o costos, explicarla brevemente antes de implementarla.

---

# 93. Orden de implementación

Implementar en este orden:

### Paso 1

Configurar proyecto.

### Paso 2

Sistema de diseño.

### Paso 3

Tipos TypeScript.

### Paso 4

Timer Engine.

### Paso 5

Workout Engine.

### Paso 6

Countdown.

### Paso 7

Count Up.

### Paso 8

AMRAP.

### Paso 9

EMOM.

### Paso 10

Intervals.

### Paso 11

Tabata.

### Paso 12

For Time.

### Paso 13

Workout Builder.

### Paso 14

Persistencia LocalStorage.

### Paso 15

Dashboard.

### Paso 16

Display Mode.

### Paso 17

Fullscreen.

### Paso 18

Audio.

### Paso 19

Responsive.

### Paso 20

Testing.

### Paso 21

Optimización.

### Paso 22

README.

### Paso 23

Deploy.

---

# 94. Criterios de aceptación del MVP

El MVP será considerado exitoso si:

## Caso 1

Desde el celular puedo crear:

```text
AMRAP 10
```

con:

```text
10 Push Ups
15 Squats
```

y guardarlo.

## Caso 2

Puedo iniciar el entrenamiento.

## Caso 3

El timer funciona correctamente.

## Caso 4

El sonido funciona.

## Caso 5

La pantalla Display muestra:

```text
AMRAP

09:32

ROUND 2

15 SQUATS
```

## Caso 6

Puedo pausar desde el celular.

## Caso 7

La pantalla refleja la pausa.

## Caso 8

Puedo reiniciar.

## Caso 9

Puedo finalizar.

## Caso 10

La aplicación funciona correctamente en:

- Chrome desktop.
- Chrome Android.
- Navegador móvil.
- Pantalla 1920x1080.

---

# 95. Objetivo final

El resultado debe ser una aplicación que permita que un gimnasio diga:

> "Abro GymTimer Pro en mi celular, creo el entrenamiento, conecto la pantalla y ya tengo todo listo para la clase."

Debe sentirse:

**rápida + simple + profesional + económica + escalable.**

No construir solamente un cronómetro.

Construir la base de una plataforma SaaS para gimnasios.

---

# 96. Primera tarea del agente

Comenzá analizando el proyecto actual.

Después:

1. Revisá `package.json`.
2. Revisá la estructura de carpetas.
3. Identificá el framework y dependencias existentes.
4. Determiná qué partes pueden reutilizarse.
5. Proponé la arquitectura inicial.
6. Implementá el MVP siguiendo este documento.
7. Ejecutá las pruebas.
8. Corregí errores.
9. Verificá responsive.
10. Dejame el proyecto listo para ejecutar con:

```bash
npm install
npm run dev
```

No agregues funcionalidades fuera del alcance sin una razón clara.

El objetivo principal es tener una **primera versión funcional de GymTimer Pro**, no solamente una maqueta visual.
