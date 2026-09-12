"use client";

import Image from "next/image";
import { Reveal } from "./Reveal";

const FEATURES = [
  {
    title: "Tiempo, fases y rounds en una vista",
    description: "El atleta ve en grande qué falta: trabajo, descanso, preparate y la ronda actual.",
  },
  {
    title: "Audio cues de inicio y fin",
    description: "Beeps entre trabajo y descanso, get-ready de 3 segundos y aviso de cierre de bloque.",
  },
  {
    title: "Plan semanal asignado por día",
    description: "Asigná la rutina de cada día de la semana y los alumnos ya saben qué toca.",
  },
  {
    title: "Sincronización live por Pusher",
    description: "Pausás o corregís en el celu y el display lo refleja al instante.",
  },
  {
    title: "Código de 6 letras + QR",
    description: "El profe manda el código, la pantalla entra sola. Cero configuración.",
  },
  {
    title: "Marca del box en pantalla",
    description: "Logo y nombre del gimnasio estilo fósforo, para que se sienta tuyo.",
  },
];

export function CoachSection() {
  return (
    <section id="para-tu-box" className="px-6 md:px-10 lg:px-16 py-20 lg:py-28">
      <div className="max-w-5xl mx-auto">
        <span className="font-tactical text-xs uppercase tracking-[0.18em] text-brand-500">
          Para el box
        </span>
        <h2 className="mt-3 font-display-condensed font-normal uppercase tracking-[-0.01em] leading-[0.85] text-4xl md:text-5xl text-phosphor">
          Un display que aguanta el ritmo
        </h2>

        <Reveal className="mt-10">
          <div className="relative mx-auto w-full max-w-3xl lg:max-w-4xl">
            <Image
              src="/images/display.png"
              alt="Display del box mostrando un timer"
              width={1919}
              height={1079}
              className="relative z-10 w-full rounded-xl border border-surface-800/60 bg-surface-900 p-2 shadow-2xl shadow-black/50 rotate-2"
            />
            <Image
              src="/images/run.png"
              alt="App del entrenador controlando el timer"
              width={1897}
              height={1075}
              className="absolute -bottom-10 left-0 z-20 w-[40%] rounded-xl border border-surface-800/60 bg-surface-900 p-2 shadow-2xl shadow-black/50 -rotate-3"
            />
          </div>
        </Reveal>

        <div className="mt-12 grid gap-x-12 gap-y-8 md:grid-cols-2">
          <p className="text-sm text-phosphor-dim leading-relaxed max-w-md">
            Pensado para correr clases en vivo: el monitor del box espeja el teléfono del profe, y
            sigue marcando aunque bloqueen el celu.
          </p>
          <div className="border-t border-surface-800/50">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="flex gap-4 py-5 border-b border-surface-800/50"
              >
                <div className="shrink-0 size-2 rotate-45 bg-brand-500 self-center" />
                <div>
                  <h3 className="font-tactical text-[15px] uppercase tracking-widest text-phosphor leading-tight">
                    {feature.title}
                  </h3>
                  <p className="mt-1 text-sm text-phosphor-dim leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}