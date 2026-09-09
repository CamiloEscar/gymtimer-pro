export function RoundIndicator({ round, totalRounds }: { round: number; totalRounds: number }) {
  if (totalRounds <= 1) return null;
  const isLast = round === totalRounds;
  return (
    <p
      className={`font-tactical text-2xl md:text-4xl uppercase tracking-widest text-center ${
        isLast ? "text-brand-500" : "text-gray-400"
      }`}
    >
      [ RONDA {round} / {totalRounds} ]
    </p>
  );
}
