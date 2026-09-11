const MODES = [
  "AMRAP",
  "EMOM",
  "TABATA",
  "FOR TIME",
  "OTM",
  "INTERVALOS",
  "ROUNDS",
  "RM",
  "FIGHT GONE BAD",
];

export function ModesMarquee() {
  const track = (
    <>
      {MODES.map((mode) => (
        <span key={mode} className="flex items-center gap-8 px-8 shrink-0">
          <span className="font-display-condensed text-5xl md:text-7xl leading-none text-phosphor/90">
            {mode}
          </span>
          <span aria-hidden className="size-2 rotate-45 bg-brand-500" />
        </span>
      ))}
    </>
  );

  return (
    <section
      role="marquee"
      aria-label="Modos de entrenamiento disponibles"
      className="border-y border-surface-800 overflow-hidden bg-surface-900/50"
    >
      <div className="anim-marquee flex w-max">
        {track}
        {track}
      </div>
    </section>
  );
}