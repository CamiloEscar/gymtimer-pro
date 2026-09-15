"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/Input";
import { formatTimeInput } from "@/lib/workout/formatTimeInput";

export type TimeInputVariant = "numeric" | "wheel" | "slider";

interface TimeInputProps {
  ariaLabel: string;
  seconds: number;
  onChangeSeconds: (seconds: number) => void;
  // Widget used to enter the value. Prototype of "modos distintos de colocar
  // el tiempo": numeric keyboard for precise technical values, a scrollable
  // wheel for short ranges, a bar for "duration feel" (AMRAP long windows).
  // The editor shows a small switcher so the trainer can swap per field while
  // we validate which widget fits which cadence.
  variant?: TimeInputVariant;
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

const VARIANT_LABELS: Record<TimeInputVariant, string> = {
  numeric: "123",
  wheel: "Rueda",
  slider: "Barra",
};

export function TimeInput({ ariaLabel, seconds, onChangeSeconds, variant = "numeric" }: TimeInputProps) {
  const [mode, setMode] = useState<TimeInputVariant>(variant);
  const wheelRef = useRef<HTMLDivElement>(null);
  const total = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(total / 60);
  const secs = total % 60;

  // Center the selected value in the scrollable wheel whenever it changes.
  // guard: scrollIntoView is not implemented in jsdom (tests run headless).
  useEffect(() => {
    if (mode !== "wheel" || !wheelRef.current) return;
    const el = wheelRef.current.querySelector<HTMLElement>(`[data-seconds="${total}"]`);
    if (el && typeof el.scrollIntoView === "function") {
      el.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
    }
  }, [total, mode]);

  if (mode === "slider") {
    return (
      <div role="group" aria-label={ariaLabel} className="flex flex-col gap-1">
        <div className="flex items-center gap-1">
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
        </div>
        <span className="text-xs text-phosphor-dim font-tactical whitespace-nowrap">
          = {formatTimeInput(total)}
        </span>
        <VariantSwitcher ariaLabel={ariaLabel} mode={mode} onModeChange={setMode} />
      </div>
    );
  }

  if (mode === "wheel") {
    return (
      <div role="group" aria-label={ariaLabel} className="flex flex-col gap-1">
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
        <span className="text-xs text-phosphor-dim font-tactical whitespace-nowrap">
          = {formatTimeInput(total)}
        </span>
        <VariantSwitcher ariaLabel={ariaLabel} mode={mode} onModeChange={setMode} />
      </div>
    );
  }

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2"
    >
      <div className="flex items-center gap-1">
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
      {seconds > 0 && (
        <span className="text-xs text-phosphor-dim font-tactical whitespace-nowrap">
          = {formatTimeInput(seconds)}
        </span>
      )}
      <VariantSwitcher ariaLabel={ariaLabel} mode={mode} onModeChange={setMode} />
    </div>
  );
}

function VariantSwitcher({
  ariaLabel,
  mode,
  onModeChange,
}: {
  ariaLabel: string;
  mode: TimeInputVariant;
  onModeChange: (mode: TimeInputVariant) => void;
}) {
  return (
    <div className="inline-flex items-center gap-0.5">
      {(Object.keys(VARIANT_LABELS) as TimeInputVariant[]).map((variantMode) => (
        <button
          key={variantMode}
          type="button"
          aria-label={`${ariaLabel}: ${VARIANT_LABELS[variantMode]}`}
          aria-pressed={mode === variantMode}
          onClick={() => onModeChange(variantMode)}
          className={`rounded px-1.5 py-0.5 text-[10px] font-tactical uppercase tracking-wider transition-colors cursor-pointer ${
            mode === variantMode
              ? "text-brand-500 bg-brand-500/10"
              : "text-phosphor-dim hover:text-phosphor"
          }`}
        >
          {VARIANT_LABELS[variantMode]}
        </button>
      ))}
    </div>
  );
}