interface Mode {
  name: string;
  description: string;
  className: string;
}

const MODES: Mode[] = [
  {
    name: "AMRAP",
    description: "Tantas rondas como puedas dentro de una ventana de tiempo.",
    className: "bg-round-1",
  },
  {
    name: "EMOM",
    description: "Un ejercicio nuevo cada minuto. Lo que sobre es descanso.",
    className: "bg-round-2",
  },
  {
    name: "OTM",
    description: "Cada N minutos te toca una nueva serie — vos elegís el intervalo.",
    className: "bg-round-3",
  },
  {
    name: "TABATA",
    description: "20 segundos de trabajo, 10 de descanso, 8 rondas.",
    className: "bg-surface-800",
  },
  {
    name: "INTERVALOS",
    description: "Trabajo y descanso definidos, ronda tras ronda.",
    className: "bg-round-4",
  },
  {
    name: "FOR TIME",
    description: "Cronometrá cuánto tardás en terminar el circuito.",
    className: "bg-surface-800",
  },
  {
    name: "COUNTDOWN",
    description: "El clásico reloj que baja desde un tiempo total. Para técnica y descanso activo.",
    className: "bg-round-1",
  },
  {
    name: "COUNTUP",
    description: "Cronometrá hacia arriba: filas, plank, distancia o lo que necesites.",
    className: "bg-round-2",
  },
  {
    name: "REST",
    description: "Bloques de descanso programados entre esfuerzos.",
    className: "bg-surface-800",
  },
];

export function WorkoutModes() {
  return (
    <section id="modos" className="px-6 md:px-10 lg:px-16 py-20 lg:py-28 bg-surface-900/60">
      <div className="max-w-5xl mx-auto">
        <div className="grid lg:grid-cols-[1.2fr_1fr] lg:gap-16 items-end">
          <div>
            <span className="font-tactical text-xs uppercase tracking-[0.18em] text-brand-500">
              Protocolos
            </span>
            <h2 className="mt-3 font-display-condensed font-normal uppercase tracking-[-0.01em] leading-[0.85] text-4xl md:text-5xl text-phosphor">
              Modos de entrenamiento
            </h2>
          </div>
          <p className="mt-6 lg:mt-0 text-sm text-phosphor-dim leading-relaxed max-w-md lg:justify-self-end">
            Nueve formatos listos para correr, con avisos de fase, audio y reps acumuladas en
            pantalla.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODES.map((mode) => (
            <div
              key={mode.name}
              className={`${mode.className} rounded-xl border border-surface-800/50 p-8 space-y-4 hover:border-brand-500/40 transition-colors`}
            >
              <h3 className="font-industrial text-3xl uppercase tracking-tight text-phosphor">
                {mode.name}
              </h3>
              <p className="text-sm text-phosphor-dim leading-relaxed">{mode.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}