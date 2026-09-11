interface Mode {
  name: string;
  description: string;
  className: string; // background/visual variation
}

const MODES: Mode[] = [
  {
    name: "AMRAP",
    description: "Tantas rondas como puedas dentro de una ventana de tiempo.",
    className: "bg-round-1",
  },
  {
    name: "EMOM",
    description: "Un ejercicio nuevo cada minuto, con el resto que te sobre del minuto.",
    className: "bg-round-2",
  },
  {
    name: "TABATA",
    description: "20 segundos de trabajo, 10 de descanso, 8 rondas.",
    className: "bg-round-3",
  },
  {
    name: "OTM",
    description: "Arrancá en punto, te quedás con el descanso que sobre.",
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
];

export function WorkoutModes() {
  return (
    <section id="modos" className="px-6 md:px-10 lg:px-16 py-20 lg:py-28 bg-surface-900/60">
      <div className="max-w-5xl mx-auto">
        <span className="font-tactical text-xs uppercase tracking-[0.18em] text-phase-ready">
          Protocolos
        </span>
        <h2 className="mt-3 font-display-condensed font-normal uppercase tracking-[-0.01em] leading-[0.85] text-4xl md:text-5xl text-phosphor">
          Modos de entrenamiento
        </h2>
        <p className="mt-4 text-sm text-phosphor-dim leading-relaxed max-w-md">
          Más de diez formatos para armar el entrenamiento que quieras, con avisos de fase, audio y
          reps acumuladas en pantalla.
        </p>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
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