export function RoundIndicator({ round, totalRounds }: { round: number; totalRounds: number }) {
  if (totalRounds <= 1) return null;
  return (
    <p className="font-tactical text-sm md:text-base uppercase tracking-widest text-gray-400 text-center">
      [ RONDA {round} / {totalRounds} ]
    </p>
  );
}
