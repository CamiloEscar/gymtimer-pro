"use client";

import { BAR_KG, loadPlates } from "@/lib/display/barbell";

// TV-side barbell renderer: the bar with the plates actually loaded for the
// current attempt, plus the weight readout, the round position and the
// movement name. Animates a subtle pop every time the weight changes so the
// trainer sees the load react live while the dullest member of the box
// watches.
//
// The BAR itself varies by barKg: heavier bars draw thicker, and the common
// ones get their recognizable center stripe (15kg women's = red, 10kg
// technique = blue, 20kg men's = plain steel). Unknown bar weights still size
// the shaft proportionally, just with no stripe. Plates mirror left/right so
// a loaded barbell reads instantly from the back row.

const W = 640;
const H = 210;
const BAR_Y = 96;
const COLLAR_W = 22;
const PLATE_GAP = 3;
const PLATE_H = 160;
const BAR_COLOR = "#94a3b8";
const COLLAR_COLOR = "#475569";
const STRIPE_W = 150;

const PLATE_COLORS: Record<number, string> = {
  20: "#3b82f6",
  10: "#22c55e",
  5: "#eab308",
  2.5: "#e63946",
  1: "#f5f5f4",
};

const BAR_STRIPES: Record<number, string> = {
  15: "#ef4444",
  10: "#3b82f6",
};

function platePx(size: number): number {
  return Math.round(10 + size * 0.72);
}

interface BarbellDisplayProps {
  weightKg: number;
  barKg?: number;
  exerciseName?: string;
  round?: number;
  totalRounds?: number;
}

export function BarbellDisplay({
  weightKg,
  barKg = BAR_KG,
  exerciseName,
  round,
  totalRounds,
}: BarbellDisplayProps) {
  const { plates, loadedKg, barKg: bar } = loadPlates(weightKg, barKg);
  // Shaft thickness scales with the bar (16px men's, 12 women's, 10 técnica).
  const barH = Math.max(10, Math.min(16, Math.round((bar * 16) / BAR_KG)));
  const stripe = BAR_STRIPES[bar];
  const barCenterY = BAR_Y + barH / 2;
  const plateY = barCenterY - PLATE_H / 2;

  // Stack both sides inward from the collars; one entry per actual plate
  // (counts expand) so multiples draw as separate discs with their own gap.
  const flatSizes = plates.flatMap((p) => Array.from({ length: p.count }, () => p.size));
  const left: number[] = [];
  let x = COLLAR_W;
  for (const size of flatSizes) {
    left.push(x);
    x += platePx(size) + PLATE_GAP;
  }
  const right: number[] = [];
  x = W - COLLAR_W;
  for (const size of flatSizes) {
    x -= platePx(size);
    right.push(x);
    x -= PLATE_GAP;
  }

  const breakdown =
    flatSizes.length > 0 ? flatSizes.map((size) => String(size)).join(" + ") : null;

  return (
    <div className="w-full space-y-1 text-center" data-testid="barbell-display">
      {exerciseName && (
        <p className="font-industrial text-2xl md:text-3xl text-phosphor truncate">
          {exerciseName}
        </p>
      )}
      <div key={loadedKg} style={{ animation: "barbell-pop 0.3s ease-out" }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full max-w-xl mx-auto"
          role="img"
          aria-label={`Barra de ${bar} kg con ${loadedKg} kg`}
        >
          <rect x={COLLAR_W} y={BAR_Y} width={W - COLLAR_W * 2} height={barH} fill={BAR_COLOR} rx={barH / 2} />
          {stripe && (
            <rect
              data-testid="barbell-stripe"
              x={W / 2 - STRIPE_W / 2}
              y={BAR_Y}
              width={STRIPE_W}
              height={barH}
              fill={stripe}
              rx={barH / 2}
            />
          )}
          <rect x={0} y={BAR_Y - 4} width={COLLAR_W} height={barH + 8} fill={COLLAR_COLOR} rx={4} />
          <rect x={W - COLLAR_W} y={BAR_Y - 4} width={COLLAR_W} height={barH + 8} fill={COLLAR_COLOR} rx={4} />
          {flatSizes.map((size, i) => {
            const w = platePx(size);
            return (
              <g key={`l-${size}-${i}`}>
                <rect x={left[i]} y={plateY} width={w} height={PLATE_H} rx={w * 0.3} fill={PLATE_COLORS[size]} stroke="#0000002e" />
                <rect x={left[i]} y={plateY} width={w} height={8} fill="#0000001f" />
              </g>
            );
          })}
          {flatSizes.map((size, i) => {
            const w = platePx(size);
            return (
              <g key={`r-${size}-${i}`}>
                <rect x={right[i]} y={plateY} width={w} height={PLATE_H} rx={w * 0.3} fill={PLATE_COLORS[size]} stroke="#0000002e" />
                <rect x={right[i]} y={plateY} width={w} height={8} fill="#0000001f" />
              </g>
            );
          })}
        </svg>
      </div>
      <p data-testid="barbell-weight" className="font-industrial text-4xl md:text-5xl tabular-nums text-phosphor leading-none">
        {loadedKg} KG
      </p>
      {totalRounds !== undefined && totalRounds > 1 && round !== undefined && (
        <p
          data-testid="barbell-round"
          className="font-tactical text-sm md:text-base uppercase tracking-widest text-phosphor-dim"
        >
          [ RONDA {round}/{totalRounds} ]
        </p>
      )}
      <p className="font-tactical text-xs uppercase tracking-widest text-phosphor-muted">
        {breakdown ? `${breakdown} POR LADO · BARRA ${bar} KG` : `SOLO BARRA ${bar} KG`}
      </p>
      <style>{`
        @keyframes barbell-pop {
          0% { transform: scale(0.94); opacity: 0.4; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}