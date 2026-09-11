"use client";

import { Reveal } from "./Reveal";
import { VideoPlayer } from "@/components/ui/VideoPlayer";

const FEATURES = [
  {
    title: "Tiempo, fases y rounds en una vista",
    description: "El atleta ve en grande qué falta: trabajo, descanso, preparate y la ronda actual.",
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
    <section className="px-6 md:px-10 lg:px-16 py-20 lg:py-28">
      <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        <Reveal>
          <VideoPlayer
            src="/exercises/chest-01.mp4"
            alt="Demo del display del entrenador"
            className="aspect-[4/5] rounded-xl"
            lazy={false}
          />
        </Reveal>

        <div>
          <span className="font-tactical text-xs uppercase tracking-[0.18em] text-brand-500">
            Para el box
          </span>
          <h2 className="mt-3 font-display-condensed font-normal uppercase tracking-[-0.01em] leading-[0.85] text-4xl md:text-5xl text-phosphor">
            Un display que aguanta el ritmo
          </h2>
          <p className="mt-4 text-sm text-phosphor-dim leading-relaxed max-w-md">
            Pensado para correr clases en vivo: el monitor del box espeja el teléfono del profe, y
            sigue marcando aunque bloqueen el celu.
          </p>

          <div className="mt-8 border-t border-surface-800/50">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="flex gap-4 py-5 border-b border-surface-800/50"
              >
                <div className="shrink-0 size-2 rotate-45 bg-brand-500 self-center" />
                <div>
                  <h3 className="font-tactical text-sm uppercase tracking-widest text-phosphor">
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