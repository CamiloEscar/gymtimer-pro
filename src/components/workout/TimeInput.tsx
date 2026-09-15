"use client";

import { useEffect, useRef } from "react";
import { Input } from "@/components/ui/Input";
import { formatTimeInput } from "@/lib/workout/formatTimeInput";

export type TimeInputVariant = "numeric" | "wheel" | "slider";

interface TimeInputProps {
  ariaLabel: string;
  seconds: number;
  onChangeSeconds: (seconds: number) => void;
  // Widget used to enter the value. Call sites pass the variant that best
  // fits the field (slider for long durations like AMRAP, wheel for short
  // cadences like FGB station/rest, numeric for compact readouts). The
  // prototype switcher that let the trainer toggle between them was removed
  // — it was visual noise.
  variant: TimeInputVariant;
}

const TIME_WHEEL_STEP = 5;
const TIME_WHEEL_MAX = 1800; // 30 min cap — long enough for any block window
const TIME_WHEEL_VALUES: number[] = [];
for (let s = 0; s <= TIME_WHEEL_MAX; s += TIME_WHEEL_STEP) {
  TIME_WHEEL_VALUES.push(s);
}
// The bar is the widget for long "perceived duration" windows (AMRAP can be
// 45-60'), so it goes further than the wheel — the wheel renders one chip per
// value and must stay small for the DOM.
const SLIDER_MAX = 7200; // 2 h

export function TimeInput({ ariaLabel, seconds, onChangeSeconds, variant }: TimeInputProps) {
  const wheelRef = useRef<HTMLDivElement>(null);
  const total = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(total / 60);
  const secs = total % 60;

  // Center the selected value in the scrollable wheel whenever it changes.
  // guard: scrollIntoView is not implemented in jsdom (tests run headless).
  useEffect(() => {
    if (variant !== "wheel" || !wheelRef.current) return;
    const el = wheelRef.current.querySelector<HTMLElement>(`[data-seconds="${total}"]`);
    if (el && typeof el.scrollIntoView === "function") {
      el.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
    }
  }, [total, variant]);

  if (variant === "slider") {
    return (
      <div role="group" aria-label={ariaLabel}>
        <input
          aria-label={ariaLabel}
          type="range"
          min={0}
          max={SLIDER_MAX}
          step={TIME_WHEEL_STEP}
          value={Math.min(total, SLIDER_MAX)}
          onChange={(e) => onChangeSeconds(Number(e.target.value))}
          className="w-full accent-brand-500"
        />
        <span className="block mt-1 text-xs font-tactical tabular-nums text-phosphor">
          {formatTimeInput(total)}
        </span>
      </div>
    );
  }

  if (variant === "wheel") {
    return (
      <div role="group" aria-label={ariaLabel}>
        <div
          ref={wheelRef}
          className="flex h-12 items-center overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {TIME_WHEEL_VALUES.map((value) => (
            <button
              key={value}
              type="button"
              data-seconds={value}
              aria-pressed={total === value}
              onClick={() => onChangeSeconds(value)}
              className={`shrink-0 w-16 font-tactical tabular-nums transition-colors cursor-pointer ${
                total === value ? "text-brand-500 text-base" : "text-phosphor-dim text-sm hover:text-phosphor"
              }`}
            >
              {formatTimeInput(value)}
            </button>
          ))}
        </div>
        <span className="block mt-1 text-xs font-tactical tabular-nums text-phosphor">
          {formatTimeInput(total)}
        </span>
      </div>
    );
  }

  return (
    <div role="group" aria-label={ariaLabel} className="flex items-center gap-1">
      <Input
        aria-label={`${ariaLabel} minutos`}
        type="number"
        inputMode="numeric"
        min={0}
        value={minutes}
        // iOS numpads place the cursor at the START of a prefilled "0",
        // so typing a digit appends BEFORE it (5 renders "50"). Selecting
        // everything on focus makes the first keystroke replace the old
        // value instead of prepending to it.
        onFocus={(e) => e.currentTarget.select()}
        onChange={(e) => onChangeSeconds(Number(e.target.value || 0) * 60 + secs)}
        className="w-16 text-center"
      />
      <span className="text-phosphor-dim text-sm">:</span>
      <Input
        aria-label={`${ariaLabel} segundos`}
        type="number"
        inputMode="numeric"
        min={0}
        max={59}
        value={secs}
        onFocus={(e) => e.currentTarget.select()}
        onChange={(e) => onChangeSeconds(minutes * 60 + Number(e.target.value || 0))}
        className="w-16 text-center"
      />
    </div>
  );
}
