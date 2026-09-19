// Barbell load math for the TV lifting display. The trainer's weightKg is the
// TOTAL on the bar (including the 20kg bar itself), so the plates per side are
// (total − bar) / 2, distributed greedily over the standard plate set.
//
// ponytail: bar weight is hardcoded at 20kg (men's standard). Gyms that
// default to a 15kg women's bar would want a knob here — wire it to
// gymProfile when it actually matters, not before.

export const BAR_KG = 20;

export const PLATE_SIZES = [20, 10, 5, 2.5, 1] as const;

// A sane visual cap per plate size on each side (4 × 20 = 80kg per side).
const MAX_PLATES_PER_SIZE = 4;

export interface PlateStack {
  size: number;
  count: number;
}

export interface LoadedPlates {
  barKg: number;
  plates: PlateStack[];
  loadedKg: number;
}

export function loadPlates(weightKg: number, barKg = BAR_KG): LoadedPlates {
  const plates: PlateStack[] = [];
  let perSide = (weightKg - barKg) / 2;
  for (const size of PLATE_SIZES) {
    if (perSide <= 0) break;
    const count = Math.min(MAX_PLATES_PER_SIZE, Math.floor(perSide / size));
    if (count > 0) {
      plates.push({ size, count });
      perSide -= count * size;
    }
  }
  const loadedKg =
    barKg + 2 * plates.reduce((sum, p) => sum + p.size * p.count, 0);
  // Round away float noise (2.5 · 3 = 7.4999…).
  return { barKg, plates, loadedKg: Math.round(loadedKg * 100) / 100 };
}