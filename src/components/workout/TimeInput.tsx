"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { formatTimeInput } from "@/lib/workout/formatTimeInput";

interface TimeInputProps {
  ariaLabel: string;
  seconds: number;
  onChangeSeconds: (seconds: number) => void;
}

// The bar is the widget for long "perceived duration" windows (AMRAP can be
// 45-60'), so it goes further than a chip wheel would stay performant for.
const SLIDER_STEP = 5;
const SLIDER_MAX = 7200; // 2 h

// One widget per field: a bar (range) for the coarse value and a tap-to-edit
// number readout for exact input. Both derive from the same `seconds`, so
// editing the number moves the bar (and vice versa). The old wheel/numeric/
// slider switcher was dropped — visual noise for the trainer.
export function TimeInput({ ariaLabel, seconds, onChangeSeconds }: TimeInputProps) {
  const [editing, setEditing] = useState(false);
  const total = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(total / 60);
  const secs = total % 60;

  return (
    <div role="group" aria-label={ariaLabel} className="space-y-1">
      <input
        aria-label={`${ariaLabel} (barra)`}
        type="range"
        min={0}
        max={SLIDER_MAX}
        step={SLIDER_STEP}
        value={Math.min(total, SLIDER_MAX)}
        onChange={(e) => onChangeSeconds(Number(e.target.value))}
        className="w-full accent-brand-500"
      />
      {editing ? (
        <div
          className="flex items-center gap-1"
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) setEditing(false);
          }}
        >
          <Input
            aria-label={`${ariaLabel} minutos`}
            type="number"
            inputMode="numeric"
            min={0}
            autoFocus
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
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label={`${ariaLabel}: ${formatTimeInput(total)}`}
          className="block mt-1 font-tactical tabular-nums text-xs text-phosphor hover:text-brand-500 transition-colors cursor-pointer"
        >
          {formatTimeInput(total)}
        </button>
      )}
    </div>
  );
}