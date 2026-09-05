export function RoundIndicator({ round, totalRounds }: { round: number; totalRounds: number }) {
  if (totalRounds <= 1) return null;
  return (
    <p className="text-lg md:text-2xl text-gray-400 text-center">
      ROUND {round} / {totalRounds}
    </p>
  );
}
