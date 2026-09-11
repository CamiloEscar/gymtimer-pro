interface Step {
  number: string;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  {
    number: "01",
    title: "Armá la rutina",
    description:
      "Solapas, rondas, descansos y ejercicios desde tu celular. AMRAP, EMOM, Tabata, OTM o intervalos.",
  },
  {
    number: "02",
    title: "Conectá la pantalla",
    description:
      "Un código de 6 letras sincroniza el display de tu box por Pusher. Sin cables, sin setup.",
  },
  {
    number: "03",
    title: "Controlá desde el celu",
    description:
      "Lanzá, pausá o ajustá sobre la marcha. El display espeja el timer en vivo, al segundo.",
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="px-6 md:px-10 lg:px-16 py-20 lg:py-28">
      <div className="max-w-5xl mx-auto">
        <h2 className="font-display-condensed font-normal uppercase tracking-[-0.01em] leading-[0.85] text-4xl md:text-5xl text-phosphor">
          Cómo funciona
        </h2>
        <div className="mt-10 grid gap-px bg-surface-800 lg:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.number} className="bg-surface-950 p-8 lg:p-10 space-y-6">
              <span className="font-tactical text-sm text-brand-500">{step.number}</span>
              <h3 className="font-industrial text-2xl uppercase tracking-tight text-phosphor">
                {step.title}
              </h3>
              <p className="text-sm text-phosphor-dim leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}